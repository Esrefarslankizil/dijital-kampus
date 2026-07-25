import React, { useState, useEffect } from 'react';
import { postService, followService, storyService } from '../services/api';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';

// --- Alt Bileşenler (React Components) ---

const StoryCarousel = ({ stories, onStoryUpload }) => {
    const fileInputRef = React.useRef(null);
    const [selectedStory, setSelectedStory] = useState(null);

    return (
    <>
    {selectedStory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedStory(null)}>
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedStory(null)} style={{ position: 'absolute', top: '-40px', right: '-10px', background: 'none', border: 'none', color: '#fff', fontSize: '36px', cursor: 'pointer', zIndex: 10000 }}>&times;</button>
                <img src={`http://localhost:5181${selectedStory.bg}`} alt={selectedStory.name} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '30px' }}>
                    <img src={selectedStory.avatar} alt={selectedStory.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', marginRight: '12px' }} />
                    <p style={{ color: '#fff', margin: 0, fontWeight: 600, fontSize: '15px' }}>{selectedStory.name}</p>
                </div>
            </div>
        </div>
    )}
    <div style={{ ...styles.card, padding: '16px', background: 'linear-gradient(to right, #ffffff, #e6f4f5)' }}>
        <h4 style={{ margin: '0 0 16px 4px', color: '#006F79', fontSize: '15px', fontWeight: 700 }}>
            <i className="feather-film" style={{ marginRight: '8px' }}></i>Kampüs Hikayeleri
        </h4>
        <div style={styles.storiesRow}>
            <div style={styles.storyAddCard} onClick={() => fileInputRef.current?.click()}>
                <div style={styles.storyAddIcon}>
                    <i className="feather-plus" style={{ color: '#fff', fontSize: '20px' }}></i>
                </div>
                <p style={styles.storyLabel}>Hikaye Ekle</p>
            </div>
            <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        onStoryUpload(e.target.files[0]);
                    }
                }} 
            />
            {stories.map(s => (
                <div key={s.id} onClick={() => setSelectedStory(s)} style={{ ...styles.storyCard, backgroundImage: s.bg ? `url(http://localhost:5181${s.bg})` : 'none', backgroundColor: s.bg ? '#004F56' : '#008f7a' }}>
                    <div style={styles.storyGradient}>
                        <img src={s.avatar} alt={s.name} style={{ ...styles.storyAvatar, border: '2px solid #006F79' }} />
                        <p style={styles.storyLabel}>{s.name}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
    </>
    );
};

const CreatePostBox = ({ onShare, isPosting, error, success }) => {
    const [text, setText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [hashtagInput, setHashtagInput] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [showHashtagInput, setShowHashtagInput] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleShareClick = async () => {
        if (!text.trim() && !selectedImage) return;
        await onShare(text.trim(), selectedImage, hashtags);
        setText('');
        setSelectedImage(null);
        setHashtags([]);
        setHashtagInput('');
        setShowHashtagInput(false);
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(URL.createObjectURL(e.target.files[0]));
        }
    }

    const handleAddHashtag = (e) => {
        const raw = e.target.value;
        // Virgülle ayrılmış etiketleri parse et ve TEKİLLEŞTİR
        const tags = [...new Set(
            raw.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(t => t.length > 0)
        )];
        setHashtags(tags);
        setHashtagInput(raw);
    }

    const removeHashtag = (tagToRemove) => {
        setHashtags(hashtags.filter(tag => tag !== tagToRemove));
    }

    return (
        <div style={{ ...styles.card, padding: '16px', background: 'linear-gradient(to right, #ffffff, #e6f4f5)' }}>
            <h4 style={{ margin: '0 0 16px 4px', color: '#006F79', fontSize: '15px', fontWeight: 700 }}>
                <i className="feather-edit-3" style={{ marginRight: '8px' }}></i>Gönderi Oluştur
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <img src="/images/user-7.png" alt="me" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #006F79' }} />
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

                    {/* Hashtag Ekleme Inputu */}
                    {showHashtagInput && (
                        <div style={{ marginTop: '10px' }}>
                            <input
                                type="text"
                                value={hashtagInput}
                                onChange={handleAddHashtag}
                                placeholder="örn: VizeHaftası, Teknoloji, Yazılım"
                                style={{ ...styles.postTextarea, width: '100%', padding: '10px 14px', fontSize: '13px', boxSizing: 'border-box' }}
                                autoFocus
                            />
                            <p style={{ margin: '4px 0 0 2px', fontSize: '11px', color: '#aaa', fontWeight: 500 }}>
                                💡 Birden fazla etiket için araya virgül koyun. # işareti otomatik eklenir.
                            </p>
                        </div>
                    )}

                    {selectedImage && (
                        <div style={{ position: 'relative', marginTop: '10px', display: 'inline-block', maxWidth: '100%' }}>
                            <img src={selectedImage} alt="preview" style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.03)' }} />
                            <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="feather-x"></i></button>
                        </div>
                    )}
                </div>
            </div>
            {error && <p style={{ color: '#e74c3c', fontSize: '12px', margin: '4px 0 0', fontWeight: 600 }}>{error}</p>}
            {success && <p style={{ color: '#27ae60', fontSize: '12px', margin: '4px 0 0', fontWeight: 600 }}>{success}</p>}
            <div style={{ ...styles.postActions, flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto', backgroundColor: 'rgba(0,111,121,0.03)', padding: '10px 16px', borderRadius: '12px', marginTop: '12px' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} style={{ ...styles.postActionBtn, whiteSpace: 'nowrap', backgroundColor: 'rgba(39,174,96,0.1)', color: '#27ae60' }}>
                    <i className="feather-image" style={{ marginRight: '6px' }}></i><span className="d-none d-sm-inline">Fotoğraf</span>
                </button>
                <button onClick={() => setShowHashtagInput(!showHashtagInput)} style={{ ...styles.postActionBtn, whiteSpace: 'nowrap', backgroundColor: showHashtagInput ? 'rgba(52,152,219,0.2)' : 'rgba(52,152,219,0.1)', color: '#3498db' }}>
                    <i className="feather-hash" style={{ marginRight: '6px' }}></i><span className="d-none d-sm-inline">Etiket Ekle</span>
                </button>
                <button
                    onClick={handleShareClick}
                    disabled={isPosting || (!text.trim() && !selectedImage)}
                    style={{ ...styles.postActionBtn, marginLeft: 'auto', backgroundColor: ((!text.trim() && !selectedImage) || isPosting) ? '#ccc' : '#006F79', color: '#fff', fontWeight: 700, borderRadius: '20px', padding: '8px 24px', cursor: ((!text.trim() && !selectedImage) || isPosting) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: ((!text.trim() && !selectedImage) || isPosting) ? 'none' : '0 4px 12px rgba(0,111,121,0.3)' }}
                >
                    {isPosting ? 'Paylaşılıyor...' : 'Paylaş'}
                </button>
            </div>
        </div>
    );
};

const PostCard = ({ post, onLike, onDelete, isOwnPost }) => (
    <div style={{ ...styles.card, borderTop: '4px solid #006F79' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
            <img src={post.avatar} alt={post.user} style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px', border: '2px solid #006F79', padding: '2px' }} />
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, color: '#006F79', fontSize: '15px' }}>{post.user}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#888', fontWeight: 600 }}>{post.role} · {post.time}</p>
            </div>
            {isOwnPost ? (
                <button onClick={() => onDelete(post.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(231,76,60,0.1)' }}>
                    <i className="feather-trash-2"></i>
                </button>
            ) : (
                <button style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '18px' }}><i className="feather-more-horizontal"></i></button>
            )}
        </div>
        <p style={{ color: '#333', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>{post.content}</p>
        {post.image && <img src={post.image} alt="post" style={{ width: '100%', height: 'auto', borderRadius: '12px', maxHeight: '500px', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.02)', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />}
        
        {post.hashtags && post.hashtags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {post.hashtags.map(tag => (
                    <span key={tag} style={{ color: '#006F79', fontSize: '13px', fontWeight: 700, cursor: 'pointer', backgroundColor: 'rgba(0,111,121,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                        #{tag}
                    </span>
                ))}
            </div>
        )}

        <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '12px', display: 'flex', gap: '12px' }}>
            <button onClick={() => onLike(post.id)} style={{ ...styles.actionBtn, backgroundColor: post.liked ? 'rgba(0,111,121,0.1)' : 'rgba(0,111,121,0.03)', color: post.liked ? '#006F79' : '#555', fontWeight: post.liked ? 700 : 600 }}>
                <i className="feather-thumbs-up" style={{ marginRight: '6px', color: post.liked ? '#006F79' : '#888' }}></i>
                {post.likes} Beğeni
            </button>
            <button style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)' }}><i className="feather-message-circle" style={{ marginRight: '6px', color: '#888' }}></i>{post.comments} Yorum</button>
            <button style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)', marginLeft: 'auto' }}><i className="feather-share-2" style={{ marginRight: '6px', color: '#888' }}></i>Paylaş</button>
        </div>
    </div>
);


// --- Ana Sayfa Bileşeni ---
export default function FeedPage() {
    const [postList, setPostList] = useState([]);
    const [storyList, setStoryList] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [followStates, setFollowStates] = useState({});
    const [feedError, setFeedError] = useState('');
    const [postSuccess, setPostSuccess] = useState('');
    const [trendRefreshKey, setTrendRefreshKey] = useState(0); // Her gonderide artar
    
    // Profil istatistikleri state'i (Başlangıçta 0)
    const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });

    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Öğrenci';
    
    // JWT'den userId çıkar
    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 1; // Fallback for testing
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || 1;
        } catch { return 1; }
    };
    const currentUserId = getUserIdFromToken();

    useEffect(() => {
        // Backend API'den Gönderileri Çek (GERÇEK REACT & BACKEND ENTEGRASYONU)
        const loadPosts = async () => {
            try {
                const apiPosts = await postService.getPosts();
                if (apiPosts && apiPosts.length > 0) {
                    const mapped = apiPosts.map(p => ({
                        id: p.id,
                        user: p.author || 'Kullanıcı',
                        avatar: '/images/user-7.png',
                        time: new Date(p.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
                        role: 'Kullanıcı',
                        content: p.content,
                        likes: p.likeCount || 0,
                        comments: p.commentCount || 0,
                        liked: false,
                    }));
                    setPostList(mapped);
                }
            } catch (e) {
                console.warn('API erişilemedi.');
            }
        };

        const loadStories = async () => {
            try {
                const apiStories = await storyService.getStories();
                if (apiStories && apiStories.length > 0) {
                    const mapped = apiStories.map(s => ({
                        id: s.id,
                        name: s.userName,
                        avatar: '/images/user-7.png',
                        bg: s.mediaPath
                    }));
                    setStoryList(mapped);
                }
            } catch (e) {
                console.warn('Hikayeler yüklenemedi.');
            }
        };

        loadPosts();
        loadStories();
    }, []);

    const handleShare = async (text, imageUrl, hashtags) => {
        setIsPosting(true);
        setFeedError('');
        setPostSuccess('');
        try {
            // Etiketleri tekilleştirip içeriğe ekle (#selam seklinde)
            const uniqueHashtags = [...new Set(hashtags.map(t => t.toLowerCase()))];
            const hashtagString = uniqueHashtags.length > 0
                ? '\n' + uniqueHashtags.map(t => '#' + t).join(' ')
                : '';
            const fullContent = (text + hashtagString).trim();
            if (!fullContent) return;

            const newPost = await postService.createPost(currentUserId, fullContent);
            
            setPostList([{
                id: newPost.id,
                user: userEmail,
                avatar: '/images/user-7.png',
                time: 'Şimdi',
                role: userRole,
                content: text,
                image: imageUrl, // UI'da hemen göstermek için ekliyoruz
                hashtags: hashtags, // UI'da göstermek için ekliyoruz
                likes: 0,
                comments: 0,
                liked: false,
            }, ...postList]);
            
            // Gönderi sayısını artır
            setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
            
            setPostSuccess('Gonderi basariyla paylasildi!');
            setTimeout(() => setPostSuccess(''), 3000);
            setTrendRefreshKey(prev => prev + 1); // Kampus Gundemini yenile
        } catch (err) {
            setFeedError('Paylaşım yapılamadı. Lütfen tekrar deneyin.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
        
        try {
            // Backend API DELETE Çağrısı (GERÇEK)
            await postService.deletePost(postId);
            // Başarılı olursa UI'dan kaldır
            setPostList(postList.filter(p => p.id !== postId));
        } catch (err) {
            alert('Gönderi silinirken bir hata oluştu.');
        }
    };

    const handleFollow = async (targetUserId) => {
        const isFollowing = followStates[targetUserId];
        try {
            // Backend API Takiplesme (GERÇEK)
            if (isFollowing) {
                await followService.unfollow(currentUserId, targetUserId);
                setFollowStates(prev => ({ ...prev, [targetUserId]: false }));
                setStats(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
            } else {
                await followService.follow(currentUserId, targetUserId);
                setFollowStates(prev => ({ ...prev, [targetUserId]: true }));
                setStats(prev => ({ ...prev, following: prev.following + 1 }));
            }
        } catch (err) {
            console.error('Takip servisinde hata oluştu', err);
        }
    };

    const handleLike = (id) => {
        setPostList(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    };

    const handleStoryUpload = async (file) => {
        try {
            const result = await storyService.uploadStory(currentUserId, file);
            if (result && result.story) {
                const newStory = {
                    id: result.story.id,
                    name: userEmail,
                    avatar: '/images/user-7.png',
                    bg: result.story.mediaPath
                };
                setStoryList([newStory, ...storyList]);
            }
        } catch (e) {
            console.error('Hikaye yüklenirken hata', e);
            alert("Hikaye yüklenemedi.");
        }
    };

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={stats} />
            <main style={styles.feedArea}>
                <StoryCarousel stories={storyList} onStoryUpload={handleStoryUpload} />
                <CreatePostBox onShare={handleShare} isPosting={isPosting} error={feedError} success={postSuccess} />
                
                {feedError && <p style={{ color: '#e74c3c', textAlign: 'center', margin: '20px 0' }}>{feedError}</p>}

                {postList.length === 0 ? (
                    <div style={{...styles.card, textAlign: 'center', padding: '40px', color: '#888'}}>
                        Henüz hiç gönderi yok. İlk paylaşan siz olun!
                    </div>
                ) : (
                    postList.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            onLike={handleLike} 
                            onDelete={handleDeletePost}
                            isOwnPost={post.user === userEmail}
                        />
                    ))
                )}
            </main>
            <RightSidebar followStates={followStates} onFollow={handleFollow} trendRefreshKey={trendRefreshKey} />
        </div>
    );
}

// --- CSS Modülleri (React Inline Styles) ---
const styles = {
    page: { display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px', minHeight: '100vh', backgroundColor: '#f0f2f5', alignItems: 'flex-start' },
    leftSidebar: { width: '260px', flexShrink: 0, position: 'sticky', top: '80px' },
    feedArea: { flex: 1, minWidth: 0, maxWidth: '640px', margin: '0 auto' },
    rightSidebar: { width: '280px', flexShrink: 0, position: 'sticky', top: '80px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    profileCard: { backgroundColor: '#fff', borderRadius: '16px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    profileBanner: { height: '60px', background: 'linear-gradient(135deg, #006F79 0%, var(--mtu-primary-hover) 100%)' },
    profileAvatarWrap: { display: 'flex', justifyContent: 'center', marginTop: '-24px' },
    profileAvatar: { width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    profileName: { margin: '8px 0 2px', fontWeight: 700, fontSize: '14px', color: '#1a1a2e' },
    profileRole: { fontSize: '11px', color: '#006F79', backgroundColor: 'rgba(0,111,121,0.08)', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 },
    profileStats: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f2f5' },
    stat: { textAlign: 'center', fontSize: '11px', color: '#888' },
    statDivider: { width: '1px', height: '30px', backgroundColor: '#f0f2f5' },
    navCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '12px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    navCaption: { fontSize: '10px', fontWeight: 700, color: '#bbb', letterSpacing: '1px', padding: '4px 12px 8px', margin: 0 },
    navItem: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', color: '#555', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'all 0.15s' },
    navItemActive: { backgroundColor: 'rgba(0,111,121,0.08)', color: '#006F79', fontWeight: 700 },
    navIcon: { width: '20px', marginRight: '12px', fontSize: '16px', color: '#999' },
    navDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006F79', marginLeft: 'auto' },
    storiesRow: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' },
    storyAddCard: { width: '100px', height: '160px', borderRadius: '12px', border: '2px dashed #006F79', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', backgroundColor: 'rgba(0,111,121,0.02)' },
    storyAddIcon: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#006F79', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 4px 10px rgba(0,111,121,0.3)' },
    storyCard: { width: '100px', height: '160px', borderRadius: '12px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    storyGradient: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,111,121,0.9) 0%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px' },
    storyAvatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', marginBottom: '8px' },
    storyLabel: { color: '#fff', fontSize: '11px', fontWeight: 600, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
    postTextarea: { border: '1px solid rgba(0,111,121,0.1)', borderRadius: '12px', padding: '14px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', backgroundColor: '#f9fbfc', color: '#1a1a2e' },
    postActions: { display: 'flex', gap: '10px' },
    postActionBtn: { display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', color: '#555', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' },
    actionBtn: { display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', color: '#555', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' },
    hashtagPill: { backgroundColor: 'rgba(0,111,121,0.1)', color: '#006F79', fontSize: '12.5px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center' },
    sideCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    sideCardTitle: { fontSize: '13px', fontWeight: 700, color: '#1a1a2e', marginBottom: '14px', display: 'flex', alignItems: 'center' },
    eventItem: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
    eventDate: { width: '46px', height: '46px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    suggestionItem: { display: 'flex', alignItems: 'center', marginBottom: '12px' },
    followBtn: { border: '1.5px solid #006F79', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
};
