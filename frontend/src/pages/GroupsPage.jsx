import React, { useState, useEffect, useCallback } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import { groupService } from '../services/api';

const CATEGORIES = ['all', 'Sosyal', 'Akademik', 'Spor', 'Kariyer', 'Oyun'];

function CreateGroupModal({ onClose, onCreated, currentUserId }) {
    const [form, setForm] = useState({ name: '', description: '', category: 'Sosyal' });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = React.useRef(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('Grup adi zorunludur.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('creatorId', currentUserId);
            formData.append('name', form.name);
            formData.append('description', form.description);
            formData.append('category', form.category);
            if (image) {
                formData.append('image', image);
            }

            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5181/api/groups', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Hata');
            const result = await res.json();
            
            onCreated(result);
            onClose();
        } catch (err) {
            setError('Grup olusturulamadi. Lutfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h3 style={modalStyles.title}>Yeni Grup Kur</h3>
                    <button onClick={onClose} style={modalStyles.closeBtn}>&#x2715;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Grup Fotoğrafı (İsteğe Bağlı)</label>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                        {imagePreview ? (
                            <div style={{ position: 'relative', marginBottom: '4px' }}>
                                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '180px', objectFit: 'cover', backgroundColor: '#f9fbfc', borderRadius: '12px', border: '2px solid #e5e7eb' }} />
                                <button type="button" onClick={() => { setImage(null); setImagePreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>&#x2715;</button>
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fbfc', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor='#262F59'}
                                onMouseLeave={e => e.currentTarget.style.borderColor='#e5e7eb'}>
                                <i className="feather-image" style={{ fontSize: '28px', color: '#bbb', display: 'block', marginBottom: '8px' }}></i>
                                <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>Gorsel secmek icin tiklayin</p>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ccc' }}>JPG, PNG desteklenir</p>
                            </div>
                        )}
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Grup Adi *</label>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Orn: Dagcilik Kulubu" style={modalStyles.input} />
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Kategori</label>
                        <select name="category" value={form.category} onChange={handleChange} style={modalStyles.input}>
                            {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Aciklama</label>
                        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Grup hakkinda kisa bir bilgi..." style={{ ...modalStyles.input, resize: 'vertical', minHeight: '80px' }} />
                    </div>
                    {error && <p style={{ color: '#e74c3c', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
                    <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
                        {loading ? 'Olusturuluyor...' : 'Grubu Olustur'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Group Chat Modal ────────────────────────────────────────────────────────
function GroupChatModal({ group, onClose, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    const loadMessages = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5181/api/groupmessages/${group.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [group.id]);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [loadMessages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5181/api/groupmessages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ groupId: group.id, senderId: currentUserId, content: text })
            });
            
            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => [...prev, newMsg]);
                setText('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={{ ...modalStyles.modal, maxWidth: '600px', padding: 0, display: 'flex', flexDirection: 'column', height: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fbfc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={group.imageUrl ? (group.imageUrl.startsWith('http') ? group.imageUrl : `http://localhost:5181${group.imageUrl}`) : 'http://localhost:5181/uploads/groups/default.jpg'} alt={group.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#262F59' }}>{group.name}</h3>
                            <span style={{ fontSize: '12px', color: '#727271' }}>Grup Sohbeti</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={modalStyles.closeBtn}><i className="feather-x"></i></button>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#727271' }}>Mesajlar yükleniyor...</p>
                    ) : messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#aaa', marginTop: 'auto', marginBottom: 'auto' }}>Henüz mesaj yok. İlk mesajı siz gönderin!</p>
                    ) : (
                        messages.map(m => {
                            const isMe = m.senderId === currentUserId;
                            return (
                                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: 8, maxWidth: '80%', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                        {!isMe && (
                                            <img src={m.senderAvatar ? (m.senderAvatar.startsWith('http') ? m.senderAvatar : `http://localhost:5181${m.senderAvatar}`) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                                                 style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginTop: '18px' }} alt="" />
                                        )}
                                        <div>
                                            {!isMe && <span style={{ fontSize: '11px', color: '#727271', marginLeft: 4 }}>{m.senderName}</span>}
                                            <div style={{ 
                                                backgroundColor: isMe ? '#262F59' : '#f0f2f5', 
                                                color: isMe ? '#fff' : '#262F59', 
                                                padding: '10px 14px', 
                                                borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                                fontSize: '14px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid #f0f2f5', backgroundColor: '#fff', display: 'flex', gap: 10 }}>
                    <input 
                        type="text" 
                        placeholder="Mesaj yaz..." 
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        style={{ flex: 1, ...modalStyles.input, padding: '12px 16px', borderRadius: '24px' }}
                    />
                    <button type="submit" disabled={!text.trim()} style={{ 
                        backgroundColor: text.trim() ? '#12A7CD' : '#e5e7eb', 
                        color: '#fff', border: 'none', width: 44, height: 44, borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', transition: 'all 0.2s' 
                    }}>
                        <i className="feather-send"></i>
                    </button>
                </form>

            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function GroupsPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Ogrenci';
    const [followStates, setFollowStates] = useState({});

    const [myGroups, setMyGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedChatGroup, setSelectedChatGroup] = useState(null);
    const [loadingMyGroups, setLoadingMyGroups] = useState(true);
    const [loadingAllGroups, setLoadingAllGroups] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 1;
            if (token.startsWith('dummy-jwt-token-')) {
                return parseInt(token.replace('dummy-jwt-token-', '')) || 1;
            }
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || 1;
        } catch { return 1; }
    };
    const currentUserId = getUserIdFromToken();

    const loadMyGroups = useCallback(async () => {
        setLoadingMyGroups(true);
        try {
            const data = await groupService.getMyGroups(currentUserId);
            setMyGroups(data);
        } catch {
            setMyGroups([]);
        } finally {
            setLoadingMyGroups(false);
        }
    }, [currentUserId]);

    const loadAllGroups = useCallback(async () => {
        setLoadingAllGroups(true);
        try {
            const data = await groupService.getGroups(category, search);
            setAllGroups(data);
        } catch {
            setAllGroups([]);
        } finally {
            setLoadingAllGroups(false);
        }
    }, [category, search]);

    useEffect(() => {
        loadMyGroups();
    }, [loadMyGroups]);

    useEffect(() => {
        loadAllGroups();
    }, [loadAllGroups]);

    const handleJoinGroup = async (group) => {
        try {
            await groupService.joinGroup(group.id, currentUserId);
            // MyGroups'u guncelle
            setMyGroups(prev => [...prev, { ...group, role: 'Uye', memberCount: group.memberCount + 1 }]);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLeaveGroup = async (group) => {
        if (!window.confirm(`'${group.name}' grubundan ayrilmak istediginize emin misiniz?`)) return;
        try {
            await groupService.leaveGroup(group.id, currentUserId);
            setMyGroups(prev => prev.filter(g => g.id !== group.id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreated = (newGroup) => {
        setMyGroups(prev => [newGroup, ...prev]);
        loadAllGroups(); // Listeyi guncelle
    };

    // Benim gruplarimda olmayan diger gruplar (Kesfet)
    const myGroupIds = new Set(myGroups.map(g => g.id));
    const suggestedGroups = allGroups.filter(g => !myGroupIds.has(g.id));

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} activeMenu="groups" />
            <main style={styles.feedArea}>
                
                {/* Ust Arama & Filtre Paneli */}
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0, color: '#262F59', fontSize: '22px', fontWeight: 800 }}>
                            <i className="feather-users" style={{ marginRight: '10px' }}></i>Gruplar
                        </h3>
                        <button onClick={() => setShowModal(true)} style={styles.createBtn}>
                            <i className="feather-plus" style={{ marginRight: '6px' }}></i>Yeni Grup Kur
                        </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <i className="feather-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '15px' }}></i>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Grup ara..."
                            style={{ ...styles.searchInput, paddingLeft: '40px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setCategory(cat)} style={category === cat ? styles.catBtnActive : styles.catBtn}>
                                {cat === 'all' ? 'Tumu' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gruplarim */}
                <div style={styles.card}>
                    <h3 style={{ margin: '0 0 20px', color: '#262F59', fontSize: '18px' }}>Gruplarim</h3>
                    {loadingMyGroups ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#727271' }}>Yukleniyor...</div>
                    ) : myGroups.length === 0 ? (
                        <p style={{ color: '#727271', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Henuz hicbir gruba uye degilsiniz.</p>
                    ) : (
                        <div style={styles.groupsGrid}>
                            {myGroups.map(g => (
                                <div key={g.id} style={styles.groupCard}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={g.imageUrl ? (g.imageUrl.startsWith('http') ? g.imageUrl : `http://localhost:5181${g.imageUrl}`) : 'http://localhost:5181/uploads/groups/default.jpg'} alt={g.name} style={styles.groupImage} />
                                        <span style={styles.categoryBadge}>{g.category}</span>
                                    </div>
                                    <div style={styles.groupContent}>
                                        <h4 style={styles.groupName}>{g.name}</h4>
                                        <p style={styles.groupMeta}>{g.memberCount} Uye &middot; {g.role}</p>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                            <button onClick={() => setSelectedChatGroup(g)} style={{ ...styles.joinBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <i className="feather-message-square"></i> Sohbet
                                            </button>
                                            <button onClick={() => handleLeaveGroup(g)} style={{ ...styles.leaveBtn, flex: 1 }}>Ayril</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Kesfet */}
                {(!loadingAllGroups && suggestedGroups.length > 0) && (
                    <div style={styles.card}>
                        <h3 style={{ margin: '0 0 20px', color: '#262F59', fontSize: '18px' }}>Kesfet</h3>
                        <div style={styles.groupsGrid}>
                            {suggestedGroups.map(g => (
                                <div key={g.id} style={styles.groupCard}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={g.imageUrl ? (g.imageUrl.startsWith('http') ? g.imageUrl : `http://localhost:5181${g.imageUrl}`) : 'http://localhost:5181/uploads/groups/default.jpg'} alt={g.name} style={styles.groupImage} />
                                        <span style={styles.categoryBadge}>{g.category}</span>
                                    </div>
                                    <div style={styles.groupContent}>
                                        <h4 style={styles.groupName}>{g.name}</h4>
                                        {g.description && <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.description}</p>}
                                        <p style={styles.groupMeta}>{g.memberCount} Uye</p>
                                        <button onClick={() => handleJoinGroup(g)} style={styles.joinBtn}>Katil</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            
            <RightSidebar followStates={followStates} onFollow={() => {}} />

            {showModal && (
                <CreateGroupModal
                    onClose={() => setShowModal(false)}
                    onCreated={handleCreated}
                    currentUserId={currentUserId}
                />
            )}

            {selectedChatGroup && (
                <GroupChatModal 
                    group={selectedChatGroup} 
                    onClose={() => setSelectedChatGroup(null)} 
                    currentUserId={currentUserId} 
                />
            )}
        </div>
    );
}

const styles = {
    page: { display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px', minHeight: '100vh', backgroundColor: '#f0f2f5', alignItems: 'flex-start' },
    feedArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    searchInput: { width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f9fbfc' },
    catBtnActive: { backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },
    catBtn: { backgroundColor: '#f0f2f5', color: '#555', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
    createBtn: { backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(38, 47, 89,0.25)' },
    
    groupsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
    groupCard: { border: '1px solid #f0f2f5', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    groupImage: { width: '100%', height: '140px', objectFit: 'cover' },
    categoryBadge: { position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backdropFilter: 'blur(4px)' },
    groupContent: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
    groupName: { margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: '#262F59', lineHeight: '1.3' },
    groupMeta: { margin: '0 0 16px', fontSize: '13px', color: '#727271', fontWeight: 600 },
    joinBtn: { marginTop: 'auto', backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' },
    leaveBtn: { marginTop: 'auto', backgroundColor: '#f0f2f5', color: '#555', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' },
};

const modalStyles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontSize: '20px', fontWeight: 800, color: '#262F59' },
    closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#727271', padding: '4px 8px', borderRadius: '8px' },
    field: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    submitBtn: { width: '100%', backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 12px rgba(38, 47, 89,0.3)' },
};
