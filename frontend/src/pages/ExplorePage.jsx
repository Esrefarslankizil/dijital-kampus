import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import { postService } from '../services/api';

const API_BASE = 'http://localhost:5181';

function toAbsUrl(url) {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function getUserIdFromToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return 0;
        if (token.startsWith('dummy-jwt-token-')) return parseInt(token.replace('dummy-jwt-token-', '')) || 0;
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const id = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub;
            return parseInt(id) || 0;
        }
        return 0;
    } catch { return 0; }
}

const GRADIENTS = [
    'linear-gradient(135deg, #262F59 0%, #12A7CD 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
    'linear-gradient(135deg, #262F59 0%, #B99C71 100%)',
    'linear-gradient(135deg, #EF7F1A 0%, #262F59 100%)',
    'linear-gradient(135deg, #B99C71 0%, #12A7CD 100%)',
    'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
    'linear-gradient(135deg, #12A7CD 0%, #262F59 100%)',
];

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
    return `${Math.floor(diff / 86400)} gün`;
}

// ─── AvatarFallback ──────────────────────────────────────────────────────────
function AvatarFallback({ url, name, size = 46, border = '2px solid #fff' }) {
    const [broken, setBroken] = useState(false);
    const src = toAbsUrl(url);
    if (src && !broken) {
        return <img src={src} alt={name} onError={() => setBroken(true)}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border, backgroundColor: '#f0f2f5', flexShrink: 0 }} />;
    }
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', border, backgroundColor: '#e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ width: '38%', height: '38%', borderRadius: '50%', backgroundColor: '#9ba5b0', marginTop: '8%' }} />
            <div style={{ width: '65%', height: '44%', borderRadius: '50% 50% 0 0', backgroundColor: '#9ba5b0', marginTop: '4%' }} />
        </div>
    );
}

// ─── PostModal ───────────────────────────────────────────────────────────────
function PostModal({ post, onClose, onLike, isLiked, currentUserId, onNext, onPrev, hasNext, hasPrev }) {
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const mediaUrl = toAbsUrl(post.medias?.[0]?.url);

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) setComments(await res.json());
            } catch { }
        };
        fetch_();
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'd') && hasNext) {
                onNext();
            }
            else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'a') && hasPrev) {
                onPrev();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [post.id, onClose, onNext, onPrev, hasNext, hasPrev]);

    const submitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !currentUserId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ userId: currentUserId, content: commentText })
            });
            if (res.ok) { const comment = await res.json(); setComments(p => [...p, comment]); setCommentText(''); }
        } catch { }
    };

    return (
        <div style={MOD.overlay} onClick={onClose}>
            <div style={MOD.box} onClick={e => e.stopPropagation()}>
                {/* Sol: Medya */}
                <div style={MOD.left}>
                    {mediaUrl
                        ? <img src={mediaUrl} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: GRADIENTS[post.id % GRADIENTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="feather-image" style={{ fontSize: 56, color: 'rgba(255,255,255,0.25)' }} />
                          </div>
                    }
                    
                    {/* Yön tuşları */}
                    {hasPrev && (
                        <button onClick={onPrev} style={{ ...MOD.navBtn, left: 16 }}>
                            <i className="feather-chevron-left" />
                        </button>
                    )}
                    {hasNext && (
                        <button onClick={onNext} style={{ ...MOD.navBtn, right: 16 }}>
                            <i className="feather-chevron-right" />
                        </button>
                    )}

                    <button onClick={onClose} style={MOD.closeBtn}><i className="feather-x" /></button>
                </div>

                {/* Sağ: İçerik */}
                <div style={MOD.right}>
                    <div style={MOD.authorRow} onClick={() => { navigate(`/profile/${post.userId}`); onClose(); }}>
                        <AvatarFallback url={post.avatarUrl} name={post.author} size={42} border="2px solid #262F59" />
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#262F59' }}>{post.author}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#727271' }}>{post.role} · {timeAgo(post.createdAt)}</p>
                        </div>
                    </div>

                    <p style={{ margin: 0, padding: '12px 16px', fontSize: 14, color: '#333', lineHeight: 1.6, borderBottom: '1px solid #f0f2f5' }}>
                        {post.content}
                    </p>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                        {comments.length === 0
                            ? <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 20 }}>Henüz yorum yok.</p>
                            : comments.map((c, i) => (
                                <div key={c.id || i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <AvatarFallback url={c.avatarUrl} name={c.author} size={32} border="none" />
                                    <div style={{ background: '#f5f6fa', borderRadius: 12, padding: '8px 12px', flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: '#262F59' }}>{c.author}</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>{c.content}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f2f5', display: 'flex', gap: 16 }}>
                        <button onClick={() => onLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: isLiked ? '#EF7F1A' : '#727271', fontWeight: 700, fontSize: 13 }}>
                            <i className="feather-heart" style={{ color: isLiked ? '#EF7F1A' : '#727271' }} />
                            {post.likeCount}
                        </button>
                        <span style={{ color: '#727271', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="feather-message-circle" /> {comments.length}
                        </span>
                    </div>

                    <form onSubmit={submitComment} style={{ padding: '10px 16px', borderTop: '1px solid #f0f2f5', display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="Yorum yaz..." value={commentText} onChange={e => setCommentText(e.target.value)}
                            style={{ flex: 1, border: '1.5px solid #e8ecf0', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
                        <button type="submit" style={{ background: '#262F59', border: 'none', borderRadius: 10, color: '#fff', padding: '8px 14px', cursor: 'pointer' }}>
                            <i className="feather-send" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── ExploreCard ─────────────────────────────────────────────────────────────
function ExploreCard({ post, onOpen, onLike, isLiked, height = 220, idx = 0 }) {
    const [hovered, setHovered] = useState(false);
    const mediaUrl = toAbsUrl(post.medias?.[0]?.url);
    const gradient = GRADIENTS[idx % GRADIENTS.length];

    return (
        <div
            style={{ position: 'relative', height, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', transition: 'transform 0.22s ease, box-shadow 0.22s ease', transform: hovered ? 'scale(1.015)' : 'scale(1)', boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.22)' : '0 2px 10px rgba(0,0,0,0.12)' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onOpen(post)}
        >
            {/* Arka plan */}
            {mediaUrl
                ? <img src={mediaUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ position: 'absolute', inset: 0, background: gradient }} />
            }

            {/* Karartma */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,20,0.82) 0%, rgba(10,10,20,0.08) 55%, transparent 100%)' }} />

            {/* Beğeni badge */}
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', color: '#fff', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
                <i className="feather-heart" style={{ fontSize: 10, color: isLiked ? '#EF7F1A' : '#fff' }} />
                {post.likeCount}
            </div>

            {/* Alt: Avatar + İsim */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', padding: '10px 8px 12px', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                    <AvatarFallback url={post.avatarUrl} name={post.author} size={38} border="2px solid #fff" />
                </div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.author}
                </p>
                {post.content && (
                    <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: 10, textShadow: '0 1px 2px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.content.length > 35 ? post.content.slice(0, 35) + '…' : post.content}
                    </p>
                )}
            </div>

            {/* Hover katmanı */}
            {hovered && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(38,47,89,0.5)', backdropFilter: 'blur(3px)' }}>
                    <button onClick={e => { e.stopPropagation(); onLike(post.id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${isLiked ? '#EF7F1A' : '#fff'}`, color: isLiked ? '#EF7F1A' : '#fff', background: 'transparent', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        <i className="feather-heart" /> {isLiked ? 'Beğenildi' : 'Beğen'}
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="feather-message-circle" /> {post.commentCount} Yorum
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── Ana Sayfa ───────────────────────────────────────────────────────────────
export default function ExplorePage() {
    const currentUserId = getUserIdFromToken();
    const userEmail = localStorage.getItem('email') || '';
    const userRole = localStorage.getItem('role') || '';

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [selectedPost, setSelectedPost] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const PAGE_SIZE = 18; // 6 gruplar × 3 post

    const fetchPosts = useCallback(async (pageNum, reset = false) => {
        try {
            if (pageNum === 1) setLoading(true); else setLoadingMore(true);
            const data = await postService.getExplorePosts(pageNum, PAGE_SIZE);
            const newPosts = data.posts || [];
            if (reset || pageNum === 1) setPosts(newPosts);
            else setPosts(prev => [...prev, ...newPosts]);
            setTotal(data.total || 0);
            setHasMore((pageNum * PAGE_SIZE) < (data.total || 0));
            const liked = new Set();
            newPosts.forEach(p => { if (p.isLikedByMe) liked.add(p.id); });
            setLikedPosts(prev => new Set([...prev, ...liked]));
        } catch (err) { console.error('Keşfet hatası:', err); }
        finally { setLoading(false); setLoadingMore(false); }
    }, []);

    useEffect(() => { fetchPosts(1, true); }, [fetchPosts]);

    const handleLike = async (postId) => {
        if (!currentUserId) return;
        const already = likedPosts.has(postId);
        setLikedPosts(prev => { const n = new Set(prev); already ? n.delete(postId) : n.add(postId); return n; });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: p.likeCount + (already ? -1 : 1) } : p));
        if (selectedPost?.id === postId) setSelectedPost(p => ({ ...p, likeCount: p.likeCount + (already ? -1 : 1) }));
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ userId: currentUserId }),
            });
        } catch { }
    };

    const displayPosts = searchQuery.trim()
        ? posts.filter(p => p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || p.author?.toLowerCase().includes(searchQuery.toLowerCase()))
        : posts;

    // Gönderileri 3'lü gruplara böl: [büyük, küçük, küçük]
    const groups = [];
    for (let i = 0; i < displayPosts.length; i += 3) {
        groups.push(displayPosts.slice(i, i + 3));
    }

    const BIG_HEIGHT = 440;
    const SMALL_HEIGHT = (BIG_HEIGHT - 6) / 2; // 6 = gap

    return (
        <div style={S.page}>
            <div style={S.sidebarWrap}>
                <LeftSidebar userEmail={userEmail} userRole={userRole} />
            </div>

            <main style={S.main}>
                {/* Başlık + Arama */}
                <div style={S.headerCard}>
                    <div style={S.headerLeft}>
                        <h2 style={S.title}>Keşfet</h2>
                        {total > 0 && <span style={S.badge}>{total} gönderi</span>}
                    </div>
                    <div style={S.searchBox}>
                        <i className="feather-search" style={{ color: '#aaa', fontSize: 15, marginRight: 8 }} />
                        <input type="text" placeholder="Gönderi veya kişi ara..." value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} style={S.searchInput} />
                        {searchQuery && <button onClick={() => setSearchQuery('')} style={S.clearBtn}><i className="feather-x" /></button>}
                    </div>
                </div>

                {/* İçerik */}
                {loading ? (
                    // Skeleton
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[0, 1].map(gi => (
                            <div key={gi} style={{ display: 'grid', gridTemplateColumns: gi % 2 === 0 ? '2fr 1fr' : '1fr 2fr', gap: 6 }}>
                                <div style={{ height: BIG_HEIGHT, borderRadius: 12, background: '#e8ecf0', animation: 'pulse 1.5s infinite' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ flex: 1, borderRadius: 12, background: '#e8ecf0', animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ flex: 1, borderRadius: 12, background: '#e8ecf0', animation: 'pulse 1.5s infinite' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayPosts.length === 0 ? (
                    <div style={S.empty}>
                        <i className="feather-wind" style={{ fontSize: 48, color: '#B99C71', marginBottom: 14 }} />
                        <h4 style={{ margin: '0 0 6px', color: '#262F59' }}>Hiç içerik bulunamadı</h4>
                        <p style={{ margin: 0, color: '#727271', fontSize: 14 }}>{searchQuery ? 'Arama sonucu yok.' : 'Keşfedilecek yeni içerik yok.'}</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {groups.map((group, gi) => {
                                const bigPost = group[0];
                                const smalls = group.slice(1);
                                const isBigLeft = gi % 2 === 0; // Büyük kartın yeri sırayla değişiyor

                                return (
                                    <div key={gi} style={{ display: 'grid', gridTemplateColumns: isBigLeft ? '2fr 1fr' : '1fr 2fr', gap: 6 }}>
                                        {isBigLeft ? (
                                            <>
                                                {/* Büyük kart — sol */}
                                                <ExploreCard post={bigPost} onOpen={setSelectedPost} onLike={handleLike}
                                                    isLiked={likedPosts.has(bigPost.id)} height={BIG_HEIGHT} idx={gi * 3} />
                                                {/* Küçük kartlar — sağ, dikey */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {smalls.map((p, si) => (
                                                        <ExploreCard key={p.id} post={p} onOpen={setSelectedPost} onLike={handleLike}
                                                            isLiked={likedPosts.has(p.id)} height={SMALL_HEIGHT} idx={gi * 3 + si + 1} />
                                                    ))}
                                                    {smalls.length < 2 && <div style={{ flex: 1, borderRadius: 12, background: 'transparent' }} />}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Küçük kartlar — sol, dikey */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {smalls.map((p, si) => (
                                                        <ExploreCard key={p.id} post={p} onOpen={setSelectedPost} onLike={handleLike}
                                                            isLiked={likedPosts.has(p.id)} height={SMALL_HEIGHT} idx={gi * 3 + si + 1} />
                                                    ))}
                                                    {smalls.length < 2 && <div style={{ flex: 1, borderRadius: 12, background: 'transparent' }} />}
                                                </div>
                                                {/* Büyük kart — sağ */}
                                                <ExploreCard post={bigPost} onOpen={setSelectedPost} onLike={handleLike}
                                                    isLiked={likedPosts.has(bigPost.id)} height={BIG_HEIGHT} idx={gi * 3} />
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {hasMore && !searchQuery && (
                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                <button onClick={() => { const n = page + 1; setPage(n); fetchPosts(n, false); }}
                                    disabled={loadingMore} style={S.loadMoreBtn}>
                                    {loadingMore
                                        ? <><i className="feather-loader" style={{ marginRight: 6 }} />Yükleniyor...</>
                                        : <><i className="feather-chevrons-down" style={{ marginRight: 6 }} />Daha Fazla Göster</>
                                    }
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <div style={S.sidebarWrap}>
                <RightSidebar />
            </div>

            {selectedPost && (() => {
                const idx = displayPosts.findIndex(p => p.id === selectedPost.id);
                return (
                    <PostModal 
                        post={selectedPost} 
                        onClose={() => setSelectedPost(null)}
                        onLike={handleLike} 
                        isLiked={likedPosts.has(selectedPost.id)} 
                        currentUserId={currentUserId} 
                        onNext={() => setSelectedPost(displayPosts[idx + 1])}
                        onPrev={() => setSelectedPost(displayPosts[idx - 1])}
                        hasNext={idx < displayPosts.length - 1}
                        hasPrev={idx > 0}
                    />
                );
            })()}
        </div>
    );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const S = {
    page: { 
        display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', 
        paddingTop: '90px', // Üst header için boşluk (sabit)
        height: '100vh', // Sayfanın tamamını kapla
        overflow: 'hidden', // Tüm sayfanın kaymasını engelle
        backgroundColor: '#f0f2f5', alignItems: 'flex-start' 
    },
    main: { 
        flex: 1, minWidth: 0, 
        height: '100%', // Sayfa yüksekliği kadar
        overflowY: 'auto', // SADECE bu kısım kaydırılabilir
        paddingBottom: '100px', 
        scrollbarWidth: 'none', msOverflowStyle: 'none' // Görünmez scroll
    },
    sidebarWrap: { 
        height: '100%', // Yan menüler sabit kalsın
        overflowY: 'auto', // Eğer içeriği ekrana sığmazsa kendi içinde kaysın
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        paddingBottom: '20px'
    },
    headerCard: { backgroundColor: '#fff', borderRadius: 16, padding: '14px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(38,47,89,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    title: { margin: 0, fontSize: 20, fontWeight: 800, color: '#262F59' },
    badge: { fontSize: 12, fontWeight: 700, color: '#12A7CD', background: 'rgba(18,167,205,0.1)', borderRadius: 20, padding: '3px 10px' },
    searchBox: { display: 'flex', alignItems: 'center', background: '#f5f6fa', borderRadius: 10, padding: '8px 14px', border: '1.5px solid #e8ecf0', minWidth: 200 },
    searchInput: { background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#262F59', flex: 1 },
    clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#727271', padding: 0 },
    empty: { backgroundColor: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(38,47,89,0.06)' },
    loadMoreBtn: { padding: '12px 28px', background: 'linear-gradient(135deg, #262F59 0%, #12A7CD 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(38,47,89,0.25)' },
};

const MOD = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    box: { background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', width: 920, height: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' },
    left: { flex: '0 0 55%', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    right: { flex: '0 0 45%', display: 'flex', flexDirection: 'column', height: '100%' },
    closeBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, zIndex: 2 },
    navBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, zIndex: 2, transition: 'background 0.2s' },
    authorRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f0f2f5', cursor: 'pointer' },
};
