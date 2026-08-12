import React, { useState, useEffect } from 'react';
import { postService, followService, storyService } from '../services/api';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import PostCard from '../components/posts/PostCard';

import { useNavigate } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:5181';

// ─── StoryCarousel ──────────────────────────────────────────────────────────
const StoryCarousel = ({ stories, onStoryUpload, currentUserId, onDeleteStory, onNavigateToProfile }) => {
    const fileInputRef = React.useRef(null);
    const [selectedStory, setSelectedStory] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [storyText, setStoryText] = useState('');
    const [storyBgColor, setStoryBgColor] = useState('#151A33');
    const [storyTextColor, setStoryTextColor] = useState('#ffffff');
    const [storyImage, setStoryImage] = useState(null);
    const [storyImageFile, setStoryImageFile] = useState(null);

    const bgColors = ['#151A33', '#e74c3c', '#8e44ad', '#f39c12', '#2c3e50', '#27ae60', '#000000', '#ffffff'];
    const textColors = ['#ffffff', '#000000', '#B99C71', '#262F59', '#e74c3c'];

    const selectedIndex = stories.findIndex(s => s.id === selectedStory?.id);
    const hasNext = selectedIndex !== -1 && selectedIndex < stories.length - 1;
    const hasPrev = selectedIndex !== -1 && selectedIndex > 0;

    const goToNext = (e) => { e.stopPropagation(); if (hasNext) setSelectedStory(stories[selectedIndex + 1]); };
    const goToPrev = (e) => { e.stopPropagation(); if (hasPrev) setSelectedStory(stories[selectedIndex - 1]); };

    const handleShare = () => {
        onStoryUpload(storyImageFile, storyText, storyBgColor, storyTextColor);
        setShowCreateModal(false);
        setStoryText('');
        setStoryImage(null);
        setStoryImageFile(null);
        setStoryTextColor('#ffffff');
    };

    return (
        <>
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#262F59' }}>Hikaye Oluştur</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#727271' }}>&times;</button>
                        </div>
                        <div style={{ height: '300px', borderRadius: '12px', backgroundColor: storyImage ? 'transparent' : storyBgColor, backgroundImage: storyImage ? `url(${storyImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <textarea value={storyText} onChange={e => setStoryText(e.target.value)} placeholder="Bir şeyler yaz..." style={{ background: 'transparent', border: 'none', color: storyTextColor, fontSize: '24px', fontWeight: 'bold', textAlign: 'center', width: '100%', resize: 'none', outline: 'none', textShadow: storyTextColor === '#000000' ? 'none' : '0 2px 4px rgba(0,0,0,0.8)' }} rows={4} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#555', marginRight: '4px' }}>Arka Plan:</span>
                            {bgColors.map(c => (
                                <div key={c} onClick={() => { setStoryBgColor(c); setStoryImage(null); setStoryImageFile(null); }} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: storyBgColor === c && !storyImage ? '3px solid #262F59' : '2px solid #ddd', flexShrink: 0 }}></div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#555', marginRight: '4px' }}>Yazı Rengi:</span>
                            {textColors.map(c => (
                                <div key={c} onClick={() => setStoryTextColor(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: storyTextColor === c ? '3px solid #262F59' : '2px solid #ddd', flexShrink: 0 }}></div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) { setStoryImageFile(e.target.files[0]); setStoryImage(URL.createObjectURL(e.target.files[0])); } }} />
                            <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: '#f9f9f9', cursor: 'pointer', fontWeight: 600, color: '#555' }}>
                                <i className="feather-image"></i> Fotoğraf
                            </button>
                            <button onClick={handleShare} disabled={!storyText.trim() && !storyImage} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: (!storyText.trim() && !storyImage) ? '#ccc' : '#262F59', color: '#fff', cursor: (!storyText.trim() && !storyImage) ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                                Paylaş
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedStory && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedStory(null)}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '450px', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedStory(null)} style={{ position: 'absolute', top: '-40px', right: '0px', background: 'none', border: 'none', color: '#fff', fontSize: '36px', cursor: 'pointer', zIndex: 10000 }}>&times;</button>
                        {hasPrev && <i className="feather-chevron-left" style={{ position: 'absolute', left: '-50px', top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '40px', cursor: 'pointer', zIndex: 10001, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }} onClick={goToPrev}></i>}
                        {hasNext && <i className="feather-chevron-right" style={{ position: 'absolute', right: '-50px', top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '40px', cursor: 'pointer', zIndex: 10001, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }} onClick={goToNext}></i>}
                        <div style={{ position: 'relative', width: '100%', height: '80vh', borderRadius: '16px', backgroundColor: selectedStory.bgColor || '#000', backgroundImage: selectedStory.bg ? `url(${BACKEND_URL}${selectedStory.bg})` : 'none', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
                            {hasPrev && <div onClick={goToPrev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', cursor: 'pointer', zIndex: 10 }}></div>}
                            {hasNext && <div onClick={goToNext} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', cursor: 'pointer', zIndex: 10 }}></div>}
                            {selectedStory.text && <p style={{ color: selectedStory.textColor || '#fff', fontSize: '28px', fontWeight: 'bold', textAlign: 'center', textShadow: selectedStory.textColor === '#000000' ? 'none' : '0 2px 6px rgba(0,0,0,0.8)', margin: 0, wordBreak: 'break-word', zIndex: 2 }}>{selectedStory.text}</p>}
                            {selectedStory.bg && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}></div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', justifyContent: 'space-between', width: '100%', padding: '0 20px' }}>
                            <div 
                                style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '30px', cursor: 'pointer', transition: 'background 0.2s' }}
                                onClick={() => onNavigateToProfile(selectedStory.userId)}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                            >
                                <img src={selectedStory.avatar} alt={selectedStory.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', marginRight: '12px' }} />
                                <p style={{ color: '#fff', margin: 0, fontWeight: 600, fontSize: '15px' }}>{selectedStory.name}</p>
                            </div>
                            {selectedStory.userId === currentUserId && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Bu hikayeyi silmek istediğinize emin misiniz?')){
                                            onDeleteStory(selectedStory.id);
                                            setSelectedStory(null);
                                        }
                                    }} 
                                    style={{ backgroundColor: 'rgba(231,76,60,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(231,76,60,1)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.8)'}
                                >
                                    <i className="feather-trash-2" style={{ fontSize: '18px' }}></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ ...styles.card, padding: '16px', background: 'linear-gradient(to right, #ffffff, #e6f4f5)' }}>
                <h4 style={{ margin: '0 0 16px 4px', color: '#262F59', fontSize: '15px', fontWeight: 700 }}>
                    <i className="feather-film" style={{ marginRight: '8px' }}></i>Kampüs Hikayeleri
                </h4>
                <div style={styles.storiesRow} className="stories-row">
                    {/* Hikaye Ekle Kartı (Kullanıcının Avatarı Arkaplan Olacak) */}
                    <div 
                        style={{ 
                            ...styles.storyCard, 
                            backgroundImage: `url(${localStorage.getItem('avatarUrl') && localStorage.getItem('avatarUrl') !== 'null' ? (localStorage.getItem('avatarUrl').startsWith('http') ? localStorage.getItem('avatarUrl') : `${BACKEND_URL}${localStorage.getItem('avatarUrl')}`) : "/images/default-avatar.svg"})`,
                            border: '2px solid #262F59'
                        }} 
                        onClick={() => setShowCreateModal(true)}
                    >
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '6px' }}>
                            <div style={{ position: 'absolute', top: '-12px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#262F59', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                                <i className="feather-plus" style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}></i>
                            </div>
                            <p style={{ color: '#111', fontSize: '10px', fontWeight: 700, margin: 0 }}>Hikaye Ekle</p>
                        </div>
                    </div>
                    {stories.map(s => (
                        <div key={s.id} onClick={() => setSelectedStory(s)} style={{ ...styles.storyCard, backgroundImage: s.bg ? `url(${BACKEND_URL}${s.bg})` : 'none', backgroundColor: s.bg ? 'transparent' : (s.bgColor || '#000') }}>
                            {!s.bg && s.text && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                                    <p style={{ color: s.textColor || '#fff', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', margin: 0, wordBreak: 'break-word', opacity: 0.9 }}>{s.text.length > 40 ? s.text.substring(0, 40) + '...' : s.text}</p>
                                </div>
                            )}
                            <div style={styles.storyGradient}>
                                <img src={s.avatar} alt={s.name} style={{ ...styles.storyAvatar, border: '2px solid #262F59' }} />
                                <p style={styles.storyLabel}>{s.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`.stories-row::-webkit-scrollbar { display: none; }`}</style>
        </>
    );
};

// ─── CreatePostBox ───────────────────────────────────────────────────────────
const CreatePostBox = ({ onShare, isPosting, error, success }) => {
    const [text, setText] = useState('');
    const [selectedImagePreview, setSelectedImagePreview] = useState(null); 
    const [selectedImageFile, setSelectedImageFile] = useState(null);       
    const [hashtagInput, setHashtagInput] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [showHashtagInput, setShowHashtagInput] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleShareClick = async () => {
        if (!text.trim() && !selectedImageFile) return;
        // Hata 5: imageFile gerçek dosya nesnesini gönder
        await onShare(text.trim(), selectedImageFile, hashtags);
        setText('');
        setSelectedImagePreview(null);
        setSelectedImageFile(null);
        setHashtags([]);
        setHashtagInput('');
        setShowHashtagInput(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImageFile(file);                        
            setSelectedImagePreview(URL.createObjectURL(file)); 
        }
    };

    const handleAddHashtag = (e) => {
        const raw = e.target.value;
        const tags = [...new Set(raw.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(t => t.length > 0))];
        setHashtags(tags);
        setHashtagInput(raw);
    };

    const removeHashtag = (tagToRemove) => setHashtags(hashtags.filter(tag => tag !== tagToRemove));

    return (
        <div style={{ ...styles.card, padding: '16px', background: 'linear-gradient(to right, #ffffff, #e6f4f5)' }}>
            <h4 style={{ margin: '0 0 16px 4px', color: '#262F59', fontSize: '15px', fontWeight: 700 }}>
                <i className="feather-edit-3" style={{ marginRight: '8px' }}></i>Gönderi Oluştur
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <img src={localStorage.getItem('avatarUrl') && localStorage.getItem('avatarUrl') !== 'null' ? (localStorage.getItem('avatarUrl').startsWith('http') ? localStorage.getItem('avatarUrl') : `${BACKEND_URL}${localStorage.getItem('avatarUrl')}`) : "/images/default-avatar.svg"} alt="me" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #262F59' }} />
                <div style={{ flex: 1 }}>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Aklında ne var? Paylaş..."
                        style={{ ...styles.postTextarea, width: '100%' }}
                        rows={2}
                    />

                    {/* Hashtag Listesi */}
                    {hashtags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            {hashtags.map(tag => (
                                <span key={tag} style={styles.hashtagPill}>
                                    #{tag}
                                    <i onClick={() => removeHashtag(tag)} className="feather-x" style={{ marginLeft: '6px', cursor: 'pointer', fontSize: '12px' }}></i>
                                </span>
                            ))}
                        </div>
                    )}

                    {showHashtagInput && (
                        <div style={{ marginTop: '10px' }}>
                            <input type="text" value={hashtagInput} onChange={handleAddHashtag} placeholder="örn: VizeHaftası, Teknoloji, Yazılım" style={{ ...styles.postTextarea, width: '100%', padding: '10px 14px', fontSize: '13px', boxSizing: 'border-box' }} autoFocus />
                            <p style={{ margin: '4px 0 0 2px', fontSize: '11px', color: '#aaa', fontWeight: 500 }}>💡 Birden fazla etiket için araya virgül koyun. # işareti otomatik eklenir.</p>
                        </div>
                    )}

                    {/* Ön izleme resmi göster */}
                    {selectedImagePreview && (
                        <div style={{ position: 'relative', marginTop: '10px', display: 'inline-block', maxWidth: '100%' }}>
                            <img src={selectedImagePreview} alt="preview" style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.03)' }} />
                            <button onClick={() => { setSelectedImagePreview(null); setSelectedImageFile(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="feather-x"></i></button>
                        </div>
                    )}
                </div>
            </div>
            {error && <p style={{ color: '#e74c3c', fontSize: '12px', margin: '4px 0 0', fontWeight: 600 }}>{error}</p>}
            {success && <p style={{ color: '#27ae60', fontSize: '12px', margin: '4px 0 0', fontWeight: 600 }}>{success}</p>}
            <div style={{ ...styles.postActions, flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto', backgroundColor: 'rgba(38, 47, 89,0.03)', padding: '10px 16px', borderRadius: '12px', marginTop: '12px' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className="btn-hover-anim" style={{ ...styles.postActionBtn, whiteSpace: 'nowrap', backgroundColor: 'rgba(18, 167, 205, 0.1)', color: '#12A7CD' }}>
                    <i className="feather-image" style={{ marginRight: '6px' }}></i><span>Fotoğraf</span>
                </button>
                <button onClick={() => setShowHashtagInput(!showHashtagInput)} className="btn-hover-anim" style={{ ...styles.postActionBtn, whiteSpace: 'nowrap', backgroundColor: showHashtagInput ? 'rgba(38, 47, 89, 0.2)' : 'rgba(38, 47, 89, 0.1)', color: '#262F59' }}>
                    <i className="feather-hash" style={{ marginRight: '6px' }}></i><span>Etiket Ekle</span>
                </button>
                <button
                    onClick={handleShareClick}
                    disabled={isPosting || (!text.trim() && !selectedImageFile)}
                    className="btn-hover-anim"
                    style={{ ...styles.postActionBtn, marginLeft: 'auto', backgroundColor: ((!text.trim() && !selectedImageFile) || isPosting) ? '#ccc' : '#EF7F1A', color: '#fff', fontWeight: 700, borderRadius: '20px', padding: '8px 24px', cursor: ((!text.trim() && !selectedImageFile) || isPosting) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: ((!text.trim() && !selectedImageFile) || isPosting) ? 'none' : '0 4px 12px rgba(239,127,26,0.4)' }}
                >
                    {isPosting ? 'Paylaşılıyor...' : 'Paylaş'}
                </button>
            </div>
        </div>
    );
};

// ─── Ana Sayfa Bileşeni ──────────────────────────────────────────────────────
export default function FeedPage() {
    const [postList, setPostList] = useState([]);
    const [storyList, setStoryList] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [followStates, setFollowStates] = useState({});
    const [feedError, setFeedError] = useState('');
    const [postSuccess, setPostSuccess] = useState('');
    const [trendRefreshKey, setTrendRefreshKey] = useState(0); // Her gonderide artar

    // Profil istatistikleri state'i
    const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
    const navigate = useNavigate();

    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Öğrenci';

    // JWT'den userId çıkar (dummy token ve gerçek JWT destekli)
    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 0;
            // Dummy token format: dummy-jwt-token-{id}
            if (token.startsWith('dummy-jwt-token-'))
                return parseInt(token.replace('dummy-jwt-token-', '')) || 0;
            // Gerçek JWT
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || 0;
        } catch { return 0; }
    };
    const currentUserId = getUserIdFromToken();

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const apiPosts = await postService.getPosts(currentUserId);
                if (apiPosts && apiPosts.length > 0) {
                    const mapped = apiPosts.map(p => ({
                        id: p.id,
                        userId: p.userId,
                        user: p.author || 'Kullanıcı',
                        authorId: p.authorId || p.userId, // Eşref ve senin mantığını garantiye alır
                        avatar: p.avatarUrl && p.avatarUrl !== 'null' ? (p.avatarUrl.startsWith('http') ? p.avatarUrl : BACKEND_URL + p.avatarUrl) : '/images/default-avatar.svg',
                        time: new Date(p.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
                        role: 'Kullanıcı',
                        content: p.content,
                        image: p.mediaUrl ? BACKEND_URL + p.mediaUrl : (p.medias?.[0]?.url ? BACKEND_URL + p.medias[0].url : null),
                        likeCount: p.likeCount || 0,
                        commentCount: p.commentCount || 0,
                        isLikedByCurrentUser: p.isLikedByCurrentUser || false,
                    }));
                    setPostList(mapped);
                }
            } catch (e) { console.warn('API erişilemedi.'); }
        };

        const loadStories = async () => {
            try {
                const apiStories = await storyService.getStories();
                if (apiStories && apiStories.length > 0) {
                    const mapped = apiStories.map(s => ({
                        id: s.id,
                        userId: s.userId,
                        name: s.userName,
                        avatar: s.avatarUrl && s.avatarUrl !== 'null' ? (s.avatarUrl.startsWith('http') ? s.avatarUrl : `${BACKEND_URL}${s.avatarUrl}`) : '/images/default-avatar.svg',
                        bg: s.mediaPath,
                        text: s.textContent,
                        bgColor: s.backgroundColor || '#000',
                        textColor: s.textColor || '#fff'
                    }));
                    setStoryList(mapped);
                }
            } catch (e) { console.warn('Hikayeler yüklenemedi.'); }
        };

        loadPosts();
        loadStories();
    }, []);

    const handleShare = async (text, imageFile, hashtags) => {
        setIsPosting(true);
        setFeedError('');
        setPostSuccess('');
        try {
            const uniqueHashtags = [...new Set(hashtags.map(t => t.toLowerCase()))];
            const hashtagString = uniqueHashtags.length > 0 ? '\n' + uniqueHashtags.map(t => '#' + t).join(' ') : '';
            const fullContent = (text + hashtagString).trim();
            if (!fullContent && !imageFile) return;

            // Hata 5: imageFile ve hashtags'i doğrudan (FormData olarak) gönder (Senin altyapın)
            const newPost = await postService.createPost(currentUserId, fullContent || ' ', imageFile, uniqueHashtags);

            // Önizleme URL'i: backend'den gelen media URL ya da geçici blob
            const previewImageUrl = newPost.mediaUrl 
                ? BACKEND_URL + newPost.mediaUrl 
                : (newPost.medias?.[0]?.url ? BACKEND_URL + newPost.medias[0].url : (imageFile ? URL.createObjectURL(imageFile) : null));

            const currentUserAvatar = localStorage.getItem('avatarUrl');

            setPostList([{
                id: newPost.id,
                userId: currentUserId,
                user: newPost.author || userEmail,
                authorId: currentUserId,
                avatar: currentUserAvatar && currentUserAvatar !== 'null' ? (currentUserAvatar.startsWith('http') ? currentUserAvatar : BACKEND_URL + currentUserAvatar) : '/images/default-avatar.svg',
                time: 'Şimdi',
                role: userRole,
                content: text,
                image: previewImageUrl,
                hashtags: uniqueHashtags,
                likeCount: 0,
                commentCount: 0,
                isLikedByCurrentUser: false,
            }, ...postList]);

            // Gönderi sayısını artır ve sol menüyü uyar (Senin efsane event'in)
            setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
            window.dispatchEvent(new Event('postCreated'));
            
            setPostSuccess('Gönderi başarıyla paylaşıldı!');
            setTimeout(() => setPostSuccess(''), 3000);
            setTrendRefreshKey(prev => prev + 1);
        } catch (err) {
            setFeedError('Paylaşım yapılamadı. Lütfen tekrar deneyin.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;

        try {
            await postService.deletePost(postId);
            setPostList(postList.filter(p => p.id !== postId));
        } catch (err) {
            alert('Gönderi silinirken bir hata oluştu.');
        }
    };

    const handleFollow = async (targetUserId) => {
        const isFollowing = followStates[targetUserId];
        try {
            if (isFollowing) {
                await followService.unfollow(currentUserId, targetUserId);
                setFollowStates(prev => ({ ...prev, [targetUserId]: false }));
                setStats(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
            } else {
                await followService.follow(currentUserId, targetUserId);
                setFollowStates(prev => ({ ...prev, [targetUserId]: true }));
                setStats(prev => ({ ...prev, following: prev.following + 1 }));
            }
        } catch (err) { console.error('Takip servisinde hata oluştu', err); }
    };

    const handleStoryUpload = async (file, text, bgColor, textColor) => {
        try {
            const result = await storyService.uploadStory(currentUserId, file, text, bgColor, textColor);
            if (result && result.story) {
                setStoryList([{
                    id: result.story.id,
                    userId: currentUserId,
                    name: userEmail,
                    avatar: localStorage.getItem('avatarUrl') && localStorage.getItem('avatarUrl') !== 'null' ? (localStorage.getItem('avatarUrl').startsWith('http') ? localStorage.getItem('avatarUrl') : `${BACKEND_URL}${localStorage.getItem('avatarUrl')}`) : "/images/default-avatar.svg",
                    bg: result.story.mediaPath,
                    text: result.story.textContent,
                    bgColor: result.story.backgroundColor,
                    textColor: result.story.textColor
                }, ...storyList]);
            }
        } catch (e) {
            console.error('Hikaye yüklenirken hata', e);
            alert('Hikaye yüklenemedi.');
        }
    };

    const handleDeleteStory = async (storyId) => {
        try {
            await storyService.deleteStory(storyId, currentUserId);
            setStoryList(storyList.filter(s => s.id !== storyId));
        } catch (e) {
            console.error('Hikaye silinirken hata', e);
            alert('Hikaye silinemedi.');
        }
    };

    const handleNavigateToProfile = (userId) => {
        if(userId) {
            navigate(`/profile?userId=${userId}`);
        }
    };

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={stats} />
            <main style={styles.feedArea}>
                <StoryCarousel 
                    stories={storyList} 
                    onStoryUpload={handleStoryUpload} 
                    currentUserId={currentUserId}
                    onDeleteStory={handleDeleteStory}
                    onNavigateToProfile={handleNavigateToProfile}
                />
                <CreatePostBox onShare={handleShare} isPosting={isPosting} error={feedError} success={postSuccess} />

                {feedError && <p style={{ color: '#e74c3c', textAlign: 'center', margin: '20px 0' }}>{feedError}</p>}

                {postList.length === 0 ? (
                    <div style={{ ...styles.card, textAlign: 'center', padding: '40px', color: '#727271' }}>
                        Henüz hiç gönderi yok. İlk paylaşan siz olun!
                    </div>
                ) : (
                    postList.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDelete={handleDeletePost}
                            isOwnPost={post.authorId === currentUserId || post.userId === currentUserId}
                        />
                    ))
                )}
            </main>
            <RightSidebar followStates={followStates} onFollow={handleFollow} trendRefreshKey={trendRefreshKey} />
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
    page: { display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px', minHeight: '100vh', backgroundColor: '#f0f2f5', alignItems: 'flex-start' },
    feedArea: { flex: 1, minWidth: 0, maxWidth: '640px', margin: '0 auto' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    postTextarea: { border: '1px solid #e0e0e0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', lineHeight: '1.6', resize: 'none', outline: 'none', backgroundColor: '#fafafa', fontFamily: 'inherit', transition: 'border-color 0.2s' },
    postActions: { display: 'flex', gap: '10px', marginTop: '12px' },
    postActionBtn: { border: 'none', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s' },
    hashtagPill: { display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(38, 47, 89,0.1)', color: '#262F59', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 },
    storiesRow: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' },
    storyCard: { minWidth: '90px', height: '140px', borderRadius: '14px', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0, transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    storyAddCard: { minWidth: '90px', height: '140px', borderRadius: '14px', border: '2px dashed #262F59', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', flexShrink: 0, backgroundColor: 'rgba(38, 47, 89,0.04)', transition: 'background 0.2s' },
    storyAddIcon: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#262F59', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    storyGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 6px 6px', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    storyAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', marginBottom: '4px' },
    storyLabel: { color: '#fff', fontSize: '10px', fontWeight: 700, margin: 0, textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' },
};
