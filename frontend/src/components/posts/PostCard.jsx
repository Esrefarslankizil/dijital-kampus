import React, { useState } from 'react';
import { postService } from '../../services/api';

const PostCard = ({ post, onLike, onDelete, isOwnPost }) => {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comments || 0);

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
        <div style={{ ...styles.card, borderTop: '4px solid #006F79' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                <img src={post.avatar || '/images/user-7.png'} alt={post.user} style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px', border: '2px solid #006F79', padding: '2px' }} />
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, color: '#006F79', fontSize: '15px' }}>{post.user}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#888', fontWeight: 600 }}>{post.role} · {post.time}</p>
                </div>
                {isOwnPost ? (
                    <button onClick={() => onDelete && onDelete(post.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(231,76,60,0.1)' }}>
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
                <button onClick={() => onLike && onLike(post.id)} style={{ ...styles.actionBtn, backgroundColor: post.liked ? 'rgba(0,111,121,0.1)' : 'rgba(0,111,121,0.03)', color: post.liked ? '#006F79' : '#555', fontWeight: post.liked ? 700 : 600 }}>
                    <i className="feather-thumbs-up" style={{ marginRight: '6px', color: post.liked ? '#006F79' : '#888' }}></i>
                    {post.likes || 0} Beğeni
                </button>
                <button onClick={handleToggleComments} style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)' }}><i className="feather-message-circle" style={{ marginRight: '6px', color: '#888' }}></i>{commentCount} Yorum</button>
                <button style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)', marginLeft: 'auto' }}><i className="feather-share-2" style={{ marginRight: '6px', color: '#888' }}></i>Paylaş</button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f2f5' }}>
                    {loadingComments ? (
                        <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Yorumlar yükleniyor...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {comments.map((comment, index) => (
                                <div key={comment.id || index} style={{ display: 'flex', gap: '10px' }}>
                                    <img src="/images/user-7.png" alt="user" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div style={{ backgroundColor: '#f0f2f5', padding: '10px 14px', borderRadius: '16px', flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>{comment.author}</span>
                                            <span style={{ fontSize: '11px', color: '#888' }}>{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Henüz yorum yok. İlk yorumu sen yap!</p>}
                        </div>
                    )}
                    
                    <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
                        <img src="/images/user-7.png" alt="me" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <input 
                            type="text" 
                            placeholder="Bir yorum yaz..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
                            disabled={isPosting}
                        />
                        <button type="submit" disabled={isPosting || !newComment.trim()} style={{ backgroundColor: '#006F79', color: '#fff', border: 'none', borderRadius: '24px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: (isPosting || !newComment.trim()) ? 'not-allowed' : 'pointer', opacity: (isPosting || !newComment.trim()) ? 0.6 : 1 }}>
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
