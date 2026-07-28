import React from 'react';

const PostCard = ({ post, onLike, onDelete, isOwnPost }) => (
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
            <button style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)' }}><i className="feather-message-circle" style={{ marginRight: '6px', color: '#888' }}></i>{post.comments || 0} Yorum</button>
            <button style={{ ...styles.actionBtn, backgroundColor: 'rgba(0,0,0,0.02)', marginLeft: 'auto' }}><i className="feather-share-2" style={{ marginRight: '6px', color: '#888' }}></i>Paylaş</button>
        </div>
    </div>
);

const styles = {
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'transform 0.2s, box-shadow 0.2s', marginBottom: '20px' },
    actionBtn: { border: 'none', padding: '8px 16px', borderRadius: '24px', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
};

export default PostCard;
