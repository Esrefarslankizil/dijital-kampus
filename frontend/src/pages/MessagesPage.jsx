import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import { chatService } from '../services/api';

export default function MessagesPage() {
    const [searchParams] = useSearchParams();
    const targetConvId = searchParams.get('conversationId');

    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Ogrenci';
    const token = localStorage.getItem('token');

    const getUserIdFromToken = () => {
        try {
            if (!token) return 0;
            if (token.startsWith('dummy-jwt-token-')) {
                return parseInt(token.replace('dummy-jwt-token-', '')) || 0;
            }
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || 0;
        } catch { return 0; }
    };
    const currentUserId = getUserIdFromToken();
    
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connection, setConnection] = useState(null);
    
    const messagesBodyRef = useRef(null);
    const activeConvRef = useRef(null);

    // activeConversation güncellendikçe ref'i de güncelle
    useEffect(() => {
        activeConvRef.current = activeConversation;
    }, [activeConversation]);

    // SADECE mesaj konteynerinin kendi içini aşağı kaydırır (Pencereyi/Sayfayı asla kaydırmaz!)
    const scrollToBottom = (behavior = "smooth") => {
        setTimeout(() => {
            if (messagesBodyRef.current) {
                messagesBodyRef.current.scrollTo({
                    top: messagesBodyRef.current.scrollHeight,
                    behavior
                });
            }
        }, 50);
    };

    // İlk yüklemede sohbet listesini çek
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const data = await chatService.getConversations();
                setConversations(data);
                
                if (targetConvId) {
                    const found = data.find(c => c.id === parseInt(targetConvId));
                    if (found) {
                        setActiveConversation(found);
                        const history = await chatService.getHistory(found.id);
                        setMessages(history);
                        scrollToBottom("auto");
                    }
                }
            } catch (error) {
                console.error("Sohbetler yüklenemedi", error);
            }
        };
        fetchInitial();
    }, [targetConvId]);

    // SignalR Bağlantısını tek seferlik kur
    useEffect(() => {
        if (!token) return;

        const newConnection = new HubConnectionBuilder()
            .withUrl('http://localhost:5181/chathub', {
                accessTokenFactory: () => token
            })
            .configureLogging(LogLevel.Warning)
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log('SignalR Bağlandı!');
                newConnection.on('ReceiveMessage', (message) => {
                    if (activeConvRef.current && message.conversationId === activeConvRef.current.id) {
                        setMessages(prev => [...prev, message]);
                        scrollToBottom("smooth");
                    }
                    chatService.getConversations().then(data => setConversations(data)).catch(() => {});
                });
            })
            .catch(e => console.log('SignalR bağlantı hatası: ', e));

        setConnection(newConnection);

        return () => {
            newConnection.stop();
        };
    }, [token]);

    const loadMessages = async (conversationId) => {
        try {
            const data = await chatService.getHistory(conversationId);
            setMessages(data);
            scrollToBottom("auto");
        } catch (error) {
            console.error("Mesajlar yüklenemedi", error);
        }
    };

    const handleSelectConversation = (conv) => {
        setActiveConversation(conv);
        loadMessages(conv.id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !connection) return;

        const textToSend = newMessage.trim();
        setNewMessage('');

        try {
            await connection.invoke("SendMessage", activeConversation.id, textToSend);
            scrollToBottom("smooth");
        } catch (error) {
            console.error("Mesaj gönderilemedi:", error);
        }
    };

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} activeMenu="messages" />
            
            <main style={styles.mainArea}>
                <div style={styles.chatContainer}>
                    {/* Sohbet Listesi (Sol Taraf) */}
                    <div style={styles.conversationList}>
                        <div style={styles.listHeader}>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '20px' }}>Mesajlar</h4>
                            <i className="feather-edit" style={{ fontSize: '18px', color: '#006F79', cursor: 'pointer' }}></i>
                        </div>
                        
                        <div style={styles.listBody}>
                            {conversations.length === 0 ? (
                                <p style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>Henüz mesajınız yok.</p>
                            ) : (
                                conversations.map(conv => (
                                    <div 
                                        key={conv.id} 
                                        style={{...styles.convItem, ...(activeConversation?.id === conv.id ? styles.convItemActive : {})}}
                                        onClick={() => handleSelectConversation(conv)}
                                    >
                                        <div style={styles.avatarWrap}>
                                            <img src="/images/user.png" alt="user" style={styles.avatar} />
                                            {conv.unreadCount > 0 && <span style={styles.unreadBadge}>{conv.unreadCount}</span>}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <h5 style={styles.convTitle}>{conv.title}</h5>
                                            <p style={styles.convPreview}>Son etkileşim: {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Mesajlaşma Ekranı (Sağ Taraf) */}
                    <div style={styles.chatArea}>
                        {activeConversation ? (
                            <>
                                {/* Chat Header */}
                                <div style={styles.chatHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <img src="/images/user.png" alt="user" style={styles.headerAvatar} />
                                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '18px' }}>{activeConversation.title}</h4>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', color: '#888' }}>
                                        <i className="feather-phone" style={{ cursor: 'pointer' }}></i>
                                        <i className="feather-video" style={{ cursor: 'pointer' }}></i>
                                        <i className="feather-more-vertical" style={{ cursor: 'pointer' }}></i>
                                    </div>
                                </div>
                                
                                {/* Messages List */}
                                <div ref={messagesBodyRef} style={styles.messagesBody}>
                                    {messages.map((msg, index) => {
                                        const isMine = (currentUserId > 0 && msg.senderId === currentUserId) || 
                                                       (msg.senderEmail && userEmail && msg.senderEmail.toLowerCase() === userEmail.toLowerCase());
                                        return (
                                            <div key={index} style={{...styles.messageRow, justifyContent: isMine ? 'flex-end' : 'flex-start'}}>
                                                <div style={{...styles.messageBubble, ...(isMine ? styles.myBubble : styles.theirBubble)}}>
                                                    <span>{msg.content}</span>
                                                    <span style={{
                                                        float: 'right',
                                                        fontSize: '10px',
                                                        fontWeight: 500,
                                                        opacity: 0.82,
                                                        marginLeft: '14px',
                                                        marginTop: '6px',
                                                        lineHeight: 1,
                                                        whiteSpace: 'nowrap',
                                                        color: isMine ? 'rgba(255,255,255,0.88)' : '#777'
                                                    }}>
                                                        {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Message Input */}
                                <div style={styles.chatInputContainer}>
                                    <form onSubmit={handleSendMessage} style={styles.chatForm}>
                                        <i className="feather-smile" style={styles.inputIcon}></i>
                                        <i className="feather-paperclip" style={styles.inputIcon}></i>
                                        <input 
                                            type="text" 
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Bir mesaj yazın..." 
                                            style={styles.chatInput}
                                        />
                                        <button type="submit" style={styles.sendButton} disabled={!newMessage.trim()}>
                                            <i className="feather-send"></i>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div style={styles.emptyChat}>
                                <div style={styles.emptyIconWrap}><i className="feather-message-circle"></i></div>
                                <h3>Mesajlarınız</h3>
                                <p>Sohbet başlatmak veya mesaj okumak için soldan bir kişi seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            <RightSidebar followStates={{}} onFollow={() => {}} />
        </div>
    );
}

const styles = {
    page: { 
        display: 'flex', 
        gap: '20px', 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '80px 20px 20px', 
        height: '100vh', 
        maxHeight: '100vh',
        backgroundColor: '#f9fbfc', 
        boxSizing: 'border-box',
        overflow: 'hidden'
    },
    mainArea: { 
        flex: 1, 
        minWidth: 0, 
        minHeight: 0, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
    },
    
    chatContainer: {
        backgroundColor: '#fff',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden'
    },
    
    // Conversation List (Left)
    conversationList: { width: '320px', borderRight: '1px solid #f0f2f5', display: 'flex', flexDirection: 'column', minHeight: 0 },
    listHeader: { padding: '20px 24px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    listBody: { flex: 1, overflowY: 'auto', padding: '12px', minHeight: 0 },
    convItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' },
    convItemActive: { backgroundColor: '#f0f8f9' },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatar: { width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' },
    unreadBadge: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', border: '2px solid #fff' },
    convTitle: { margin: '0 0 4px', fontSize: '14.5px', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    convPreview: { margin: 0, fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    
    // Chat Area (Right)
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfd', minHeight: 0, height: '100%' },
    chatHeader: { padding: '16px 24px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', flexShrink: 0 },
    headerAvatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
    
    messagesBody: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 },
    messageRow: { display: 'flex', width: '100%' },
    messageBubble: { 
        maxWidth: '75%', 
        minWidth: '100px',
        padding: '7px 22px 7px 18px', 
        borderRadius: '16px', 
        fontSize: '14px', 
        lineHeight: '1.45', 
        position: 'relative', 
        wordBreak: 'break-word',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    myBubble: { 
        background: 'linear-gradient(135deg, #006F79 0%, #00565e 100%)', 
        color: '#ffffff', 
        borderBottomRightRadius: '5px' 
    },
    theirBubble: { 
        backgroundColor: '#edf1f5', 
        color: '#1a1a2e', 
        borderBottomLeftRadius: '5px' 
    },
    messageTime: { 
        display: 'block', 
        fontSize: '10.5px', 
        marginTop: '6px', 
        opacity: 0.8, 
        textAlign: 'right',
        fontWeight: 500
    },
    
    chatInputContainer: { padding: '16px 20px', backgroundColor: '#fff', borderTop: '1px solid #f0f2f5', flexShrink: 0 },
    chatForm: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f0f2f5', padding: '8px 16px', borderRadius: '24px' },
    inputIcon: { fontSize: '20px', color: '#888', cursor: 'pointer' },
    chatInput: { flex: 1, border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '14px', padding: '8px 0', color: '#1a1a2e' },
    sendButton: { backgroundColor: '#006F79', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 1, transition: '0.2s', flexShrink: 0 },
    
    emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center' },
    emptyIconWrap: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#ccc', marginBottom: '20px' }
};
