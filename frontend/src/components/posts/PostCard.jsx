import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services/api';

const PostCard = ({ post, onDelete, isOwnPost }) => {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [commentCount, setCommentCount] = useState(post.commentCount || post.comments || 0);
    const navigate = useNavigate();

    // Beğeni state'i — sayfa yenilenince prop'tan gelen değerle başlar (backend'den geliyor)
    const [liked, setLiked] = useState(post.isLikedByCurrentUser || post.liked || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || post.likes || 0);
    const [likePending, setLikePending] = useState(false);

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

    const handleLike = async () => {
        if (likePending) return;
        setLikePending(true);
        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        try {
            const userId = getUserIdFromToken();
            const result = await postService.likePost(post.id, userId);
            // Sunucudan gelen gerçek değerle senkronize et
            setLiked(result.liked);
            setLikeCount(result.likeCount);
        } catch {
            // Hata durumunda geri al
            setLiked(liked);
            setLikeCount(likeCount);
        } finally {
            setLikePending(false);
        }
    };

    const handleToggleComments = async () => {
        const willShow = !showComments;
        setShowComments(willShow);
        
        if (willShow && comments.length === 0) {
            setLoadingComments(true);
            try {
                const fetchedComments = await postService.getComments(post.id);
                setComments(fetchedComments);
            } catch (err) {
                console.error("Yorumlar yüklenemedi:", err);
            } finally {
                setLoadingComments(false);
            }
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsPosting(true);
        try {
            const userId = getUserIdFromToken();
            const addedComment = await postService.addComment(post.id, userId, newComment.trim());
            setComments([...comments, addedComment]);
            setNewComment('');
            setCommentCount(prev => prev + 1);
        } catch (err) {
            console.error("Yorum eklenemedi:", err);
            alert("Yorum eklenirken bir hata oluştu.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div style={{ ...styles.card, borderTop: '4px solid #262F59' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                <div 
                    onClick={() => navigate(`/profile/${post.userId || ''}`)}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}
                >
                    <img src={post.avatar || '/images/default-avatar.svg'} alt={post.user} style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px', border: '2px solid #262F59', padding: '2px', backgroundColor: '#f0f2f5' }} />
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, color: '#262F59', fontSize: '15px' }}>{post.user || post.author}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#727271', fontWeight: 600 }}>{post.role} · {post.time}</p>
                    </div>
                </div>
                {isOwnPost ? (
                    <button onClick={() => onDelete && onDelete(post.id)} className="btn-hover-anim" style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(231,76,60,0.1)' }}>
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
                        <span key={tag} style={{ color: '#262F59', fontSize: '13px', fontWeight: 700, cursor: 'pointer', backgroundColor: 'rgba(38, 47, 89,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '12px', display: 'flex', gap: '12px' }}>
                <button
                    onClick={handleLike}
                    disabled={likePending}
                    className="btn-hover-anim"
                    style={{
                        ...styles.actionBtn,
                        backgroundColor: liked ? 'rgba(38, 47, 89,0.1)' : 'rgba(38, 47, 89,0.03)',
                        color: liked ? '#262F59' : '#555',
                        fontWeight: liked ? 700 : 600,
                        transition: 'all 0.2s',
                        opacity: likePending ? 0.7 : 1
                    }}
                >
                    <i className="feather-thumbs-up" style={{ marginRight: '6px', color: liked ? '#262F59' : '#727271' }}></i>
                    {likeCount} Beğeni
                </button>
                <button onClick={handleToggleComments} className="btn-hover-anim" style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)' }}><i className="feather-message-circle" style={{ marginRight: '6px', color: '#727271' }}></i>{commentCount} Yorum</button>
                <button className="btn-hover-anim" style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)', marginLeft: 'auto' }}><i className="feather-share-2" style={{ marginRight: '6px', color: '#727271' }}></i>Paylaş</button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f2f5' }}>
                    {loadingComments ? (
                        <p style={{ fontSize: '13px', color: '#727271', textAlign: 'center' }}>Yorumlar yükleniyor...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {comments.map((comment, index) => (
                                <div key={comment.id || index} style={{ display: 'flex', gap: '10px' }}>
                                    <img src={comment.avatarUrl && comment.avatarUrl !== 'null' && comment.avatarUrl !== 'undefined' ? (comment.avatarUrl.startsWith('http') ? comment.avatarUrl : `http://localhost:5181${comment.avatarUrl}`) : "/images/default-avatar.svg"} alt="user" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f2f5' }} />
                                    <div style={{ backgroundColor: '#f0f2f5', padding: '10px 14px', borderRadius: '16px', flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#262F59' }}>{comment.author}</span>
                                            <span style={{ fontSize: '11px', color: '#727271' }}>{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && <p style={{ fontSize: '13px', color: '#727271', textAlign: 'center' }}>Henüz yorum yok. İlk yorumu sen yap!</p>}
                        </div>
                    )}
                    
                    <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
                        <img src={localStorage.getItem('avatarUrl') && localStorage.getItem('avatarUrl') !== 'null' && localStorage.getItem('avatarUrl') !== 'undefined' ? (localStorage.getItem('avatarUrl').startsWith('http') ? localStorage.getItem('avatarUrl') : `http://localhost:5181${localStorage.getItem('avatarUrl')}`) : "/images/default-avatar.svg"} alt="me" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f2f5' }} />
                        <input 
                            type="text" 
                            placeholder="Bir yorum yaz..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
                            disabled={isPosting}
                        />
                        <button type="submit" disabled={isPosting || !newComment.trim()} style={{ backgroundColor: '#EF7F1A', color: '#fff', border: 'none', borderRadius: '24px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: (isPosting || !newComment.trim()) ? 'not-allowed' : 'pointer', opacity: (isPosting || !newComment.trim()) ? 0.6 : 1 }}>
                            Gönder
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const styles = {
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'transform 0.2s, box-shadow 0.2s', marginBottom: '20px' },
    actionBtn: { border: 'none', padding: '8px 16px', borderRadius: '24px', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
};

export default PostCard;



