import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import { profileService, followService, chatService, postService } from '../services/api';
import PostCard from '../components/posts/PostCard';
import ImageCropperModal from '../components/ui/ImageCropperModal';
import axios from 'axios';
import toast from 'react-hot-toast'; // Senin bildirimlerin geri geldi!

const API_BASE = 'http://localhost:5181';

const toAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return API_BASE + url;
};

// Gradient avatar veya gerçek resim
const AvatarCircle = ({ url, name, size = 120, border = '4px solid #fff', style = {} }) => {
    const src = toAbsoluteUrl(url);
    const initial = (name || '?').charAt(0).toUpperCase();
    const base = { width: size, height: size, borderRadius: '50%', border, display: 'block', flexShrink: 0, ...style };
    if (src) return <img src={src} alt="Avatar" style={{ objectFit: 'cover', ...base }} />;
    return (
        <div style={{
            ...base,
            background: 'linear-gradient(135deg, #262F59, #12A7CD)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: size * 0.38,
        }}>{initial}</div>
    );
};

export default function ProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            const storedId = localStorage.getItem('userId') || localStorage.getItem('id');

            if (!token) return parseInt(storedId) || 0;

            if (token.startsWith('dummy-jwt-token-')) {
                return parseInt(token.replace('dummy-jwt-token-', '')) || 0;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));

            // 🚀 SUNUM HACK'İ: JWT içindeki tüm olası ID isimlerini yakalıyoruz!
            const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
                || payload.nameid
                || payload.nameId
                || payload.id
                || payload.Id
                || payload.userId
                || payload.UserId
                || payload.sub;

            return parseInt(userId) || parseInt(storedId) || 0;
        } catch {
            return parseInt(localStorage.getItem('userId') || localStorage.getItem('id')) || 0;
        }
    };

    const currentUserId = getUserIdFromToken();
    const userEmail = localStorage.getItem('email') || '';
    const userRole = localStorage.getItem('role') || 'Ogrenci';

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- SEKME (TAB) YÖNETİMİ ---
    const [activeTab, setActiveTab] = useState('gonderiler'); // 'gonderiler', 'hakkinda', 'rozetler'

    // --- SENİN PORTFOLYO STATE'LERİN ---
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState('');
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', link: '', description: '' });
    const [showCertForm, setShowCertForm] = useState(false);
    const [newCert, setNewCert] = useState({ name: '' });

    // Lightbox
    const [lightboxSrc, setLightboxSrc] = useState(null);

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editUserName, setEditUserName] = useState('');
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    // Upload states
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Cropper
    const [cropperSrc, setCropperSrc] = useState(null);
    const [cropperMode, setCropperMode] = useState('avatar');

    useEffect(() => { loadProfile(); /* eslint-disable-next-line */ }, [id, currentUserId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const targetId = parseInt(id) || currentUserId;
            if (!targetId) return; // Eşref'in güvenlik kontrolü
            const data = await profileService.getProfile(targetId);

            // Projeler ve sertifikalar (Student Profile) için ek istek (Senin kodun)
            try {
                const studentProfileRes = await axios.get(`${API_BASE}/api/profiles/${targetId}`);
                if (studentProfileRes.data) {
                    data.projects = studentProfileRes.data.projects || [];
                    data.certificates = studentProfileRes.data.certificates || [];
                    if (!data.biography) {
                        data.biography = studentProfileRes.data.biography || '';
                    }
                }
            } catch (err) {
                console.warn("Öğrenci profili bulunamadı veya çekilemedi:", err);
                data.projects = [];
                data.certificates = [];
            }

            setProfile(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openEditModal = () => {
        setEditFirstName(profile.firstName || '');
        setEditLastName(profile.lastName || '');
        setEditUserName(profile.userName || '');
        setEditError('');
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        setEditError('');
        if (!editUserName.trim()) { setEditError('Kullanıcı adı boş olamaz.'); return; }
        setEditSaving(true);
        try {
            const result = await profileService.updateProfile(currentUserId, {
                firstName: editFirstName.trim(),
                lastName: editLastName.trim(),
                userName: editUserName.trim(),
            });
            setProfile(prev => ({ ...prev, ...result }));
            setShowEditModal(false);
            toast.success('Profil güncellendi!');

            // Hata 2 düzeltmesi: localStorage'ı anında güncelle
            const newDisplayName = result.displayName ||
                [result.firstName, result.lastName].filter(Boolean).join(' ').trim() ||
                result.userName || editUserName.trim();
            if (result.firstName) localStorage.setItem('firstName', result.firstName);
            if (result.lastName) localStorage.setItem('lastName', result.lastName);
            localStorage.setItem('displayName', newDisplayName);

            // Header bileşenini uyarı için storage event tetikle
            window.dispatchEvent(new Event('storage'));
        } catch (err) { setEditError(err.message); }
        finally { setEditSaving(false); }
    };

    const handleDeleteProfilePost = async (postId) => {
        if (!window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;

        try {
            await postService.deletePost(postId);
            setProfile(prev => ({
                ...prev,
                posts: prev.posts.filter(p => p.id !== postId)
            }));
            toast.success('Gönderi silindi!');
        } catch (err) {
            toast.error('Gönderi silinirken bir hata oluştu.');
        }
    };

    // --- SENİN PORTFOLYO FONKSİYONLARIN ---
    const handleBioSave = () => {
        const payload = { userId: currentUserId, biography: newBio };
        axios.put(`${API_BASE}/api/profiles/${currentUserId}`, payload)
            .then(() => {
                setProfile(prev => ({ ...prev, biography: newBio }));
                setIsEditingBio(false);
                toast.success('Biyografi başarıyla kaydedildi! 🎉');
            })
            .catch(error => {
                console.error("Biyografi kaydedilemedi!", error);
                toast.error('Biyografi kaydedilirken hata oluştu!');
            });
    };

    const handleAddProject = () => {
        if (newProject.title.trim() === '') return;
        const payload = { studentProfileId: currentUserId, title: newProject.title, link: newProject.link, description: newProject.description };
        axios.post(`${API_BASE}/api/portfolio/projects`, payload)
            .then(response => {
                setProfile(prev => ({ ...prev, projects: [...(prev.projects || []), response.data] }));
                setNewProject({ title: '', link: '', description: '' });
                setShowProjectForm(false);
                toast.success('Proje başarıyla eklendi! 🚀');
            })
            .catch(error => toast.error('Proje eklenirken hata oluştu!'));
    };

    const handleAddCert = () => {
        if (newCert.name.trim() === '') return;
        const payload = { studentProfileId: currentUserId, name: newCert.name };
        axios.post(`${API_BASE}/api/portfolio/certificates`, payload)
            .then(response => {
                setProfile(prev => ({ ...prev, certificates: [...(prev.certificates || []), response.data] }));
                setNewCert({ name: '' });
                setShowCertForm(false);
                toast.success('Sertifika başarıyla eklendi! 🏆');
            })
            .catch(error => toast.error('Sertifika eklenirken hata oluştu!'));
    };

    // --- DOSYA YÜKLEME VE TAKİP İŞLEMLERİ (EŞREF'İN YAZDIKLARI) ---
    const handleAvatarFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { setCropperSrc(reader.result); setCropperMode('avatar'); };
        reader.readAsDataURL(file);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    const handleCoverFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { setCropperSrc(reader.result); setCropperMode('cover'); };
        reader.readAsDataURL(file);
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    const handleCropConfirm = async (blob) => {
        setCropperSrc(null);
        const file = new File([blob], cropperMode === 'avatar' ? 'avatar.jpg' : 'cover.jpg', { type: 'image/jpeg' });
        if (cropperMode === 'avatar') {
            setAvatarUploading(true);
            try {
                const result = await profileService.uploadAvatar(currentUserId, file);
                setProfile(prev => ({ ...prev, avatarUrl: result.avatarUrl }));
                
                // İki mantık birleştirildi: Avatarı lokale kaydet ve bildirimi göster
                if (result.avatarUrl) {
                    localStorage.setItem('avatarUrl', result.avatarUrl);
                }
                toast.success('Profil fotoğrafı güncellendi!');
            } catch (err) { console.error(err); }
            finally { setAvatarUploading(false); }
        } else {
            setCoverUploading(true);
            try {
                const result = await profileService.uploadCover(currentUserId, file);
                setProfile(prev => ({ ...prev, coverUrl: result.coverUrl }));
                toast.success('Kapak fotoğrafı güncellendi!');
            } catch (err) { console.error(err); }
            finally { setCoverUploading(false); }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!window.confirm('Profil resminizi kaldırmak istediğinize emin misiniz?')) return;
        try {
            await profileService.removeAvatar(currentUserId);
            setProfile(prev => ({ ...prev, avatarUrl: null }));
            localStorage.removeItem('avatarUrl');
        } catch (err) { console.error(err); }
    };

    const handleRemoveCover = async () => {
        if (!window.confirm('Kapak fotoğrafını kaldırmak istediğinize emin misiniz?')) return;
        try {
            await profileService.removeCover(currentUserId);
            setProfile(prev => ({ ...prev, coverUrl: null }));
        } catch (err) { console.error(err); }
    };

    const handleFollowToggle = async () => {
        try {
            if (profile.isFollowing) {
                await followService.unfollow(currentUserId, profile.id);
                setProfile(prev => ({
                    ...prev, isFollowing: false, followersCount: Math.max(0, prev.followersCount - 1)
                }));
            } else {
                await followService.follow(currentUserId, profile.id);
                setProfile(prev => ({
                    ...prev, isFollowing: true, followersCount: prev.followersCount + 1
                }));
            }
        } catch (e) { console.error('Takip işlemi hatası:', e); }
    };

    const handleMessageClick = async () => {
        try {
            const data = await chatService.startConversation(profile.id);
            const convId = data?.conversationId || data?.ConversationId;
            if (convId) { navigate(`/messages?conversationId=${convId}`); }
        } catch (e) { console.error('Mesaj başlatma hatası:', e); }
    };

    if (loading) return (
        <div style={S.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} />
            <main style={S.main}><div style={S.spinner}></div></main>
            <RightSidebar />
        </div>
    );

    if (!profile) return (
        <div style={S.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} />
            <main style={S.main}><p style={{ textAlign: 'center', marginTop: 100, color: '#727271' }}>Kullanıcı bulunamadı.</p></main>
            <RightSidebar />
        </div>
    );

    const targetProfileId = parseInt(id) || currentUserId;
    const isMe = currentUserId > 0 && targetProfileId === currentUserId;
    // Önce gerçek ad soyad var mı bak, yoksa kayıtta hafızaya aldığımız adı göster.
    const localName = localStorage.getItem('displayName');
    const displayName = (profile.firstName || profile.lastName)
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        : (localName || profile.displayName || profile.userName || profile.email || 'Kullanıcı');
    const avatarSrc = profile.avatarUrl && profile.avatarUrl !== 'null' && profile.avatarUrl !== 'undefined' ? toAbsoluteUrl(profile.avatarUrl) : '/images/default-avatar.svg';
    const coverSrc = toAbsoluteUrl(profile.coverUrl);

    // Kendi portfolyo dizilerini güvene al
    const userProjects = profile.projects || [];
    const userCertificates = profile.certificates || [];
    const userBio = profile.biography || profile.bio || '';

    return (
        <div style={S.page}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                .pbtn { transition: transform .15s, opacity .15s; cursor: pointer; }
                .pbtn:hover { transform: translateY(-1px); opacity: .88; }
                .cover-overlay { opacity: 0; transition: opacity .2s; }
                .cover-wrap:hover .cover-overlay { opacity: 1; }
                .ei { width:100%; padding:10px 14px; border:1.5px solid #e0e0e0; border-radius:10px; font-size:14px; outline:none; box-sizing:border-box; transition:border-color .2s; font-family:inherit; }
                .ei:focus { border-color: #262F59; }
            `}</style>

            <LeftSidebar userEmail={userEmail} userRole={userRole} activeMenu="profile" />

            <main style={S.main}>
                <div style={S.heroCard}>
                    {/* ---- KAPAK ---- */}
                    <div className="cover-wrap" style={{ position: 'relative', height: 200, borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                        {coverSrc
                            ? <img src={coverSrc} alt="Kapak" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #262F59 0%, #003f47 100%)' }} />
                        }
                        {coverSrc && (
                            <div className="cover-overlay"
                                onClick={() => setLightboxSrc(coverSrc)}
                                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' }}>
                                <i className="feather-zoom-in" style={{ color: '#fff', fontSize: 32 }}></i>
                            </div>
                        )}
                        {coverUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }}></div></div>}
                        <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverFileSelect} />
                    </div>

                    {/* ---- HERO CONTENT ---- */}
                    <div style={{ padding: '0 32px 32px' }}>
                        <div style={{ marginTop: -60, marginBottom: 16, display: 'inline-block', position: 'relative' }}>
                            <div onClick={() => avatarSrc ? setLightboxSrc(avatarSrc) : null}
                                style={{ cursor: avatarSrc ? 'zoom-in' : 'default', borderRadius: '50%', display: 'inline-block' }}>
                                <AvatarCircle url={profile.avatarUrl} name={displayName} size={120} />
                            </div>
                            {avatarUploading && (
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 28, height: 28, border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}></div>
                                </div>
                            )}
                            <input type="file" accept="image/*" ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <h2 style={S.name}>{displayName}</h2>
                            <p style={S.handle}>@{profile.userName}</p>
                            <p style={S.role}>{profile.departmentOrTitle}</p>
                        </div>

                        <div style={S.statsRow}>
                            {[['Gönderi', profile.posts?.length || 0], ['Takipçi', profile.followersCount], ['Takip', profile.followingCount]].map(([label, val]) => (
                                <div key={label} style={{ textAlign: 'center' }}>
                                    <strong style={{ fontSize: 20, fontWeight: 800, color: '#262F59' }}>{val}</strong>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            {isMe ? (
                                <button className="pbtn" style={{ ...S.btn, ...S.btnPrimary }} onClick={openEditModal}>
                                    <i className="feather-edit-2" style={{ marginRight: 8 }}></i>Profili Düzenle
                                </button>
                            ) : (
                                <>
                                    <button className="pbtn"
                                        style={{
                                            ...S.btn,
                                            ...(profile.isFollowing ? S.btnSecondary : S.btnPrimary),
                                            width: '160px', padding: '10px 0'
                                        }}
                                        onClick={handleFollowToggle}>
                                        <i className={profile.isFollowing ? 'feather-user-check' : 'feather-user-plus'} style={{ marginRight: 8 }}></i>
                                        {profile.isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                                    </button>
                                    <button className="pbtn" style={{ ...S.btn, ...S.btnSecondary }} onClick={handleMessageClick}>
                                        <i className="feather-message-square" style={{ marginRight: 8 }}></i>Mesaj Gönder
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== DİNAMİK SEKMELER (TABS) ===== */}
                <div style={S.tabs}>
                    <button style={activeTab === 'gonderiler' ? S.tabActive : S.tab} onClick={() => setActiveTab('gonderiler')}>Gönderiler</button>
                    <button style={activeTab === 'hakkinda' ? S.tabActive : S.tab} onClick={() => setActiveTab('hakkinda')}>Hakkında</button>
                    <button style={activeTab === 'rozetler' ? S.tabActive : S.tab} onClick={() => setActiveTab('rozetler')}>Rozetler</button>
                </div>

                {/* ===== SEKME İÇERİKLERİ ===== */}

                {/* 1. GENEL GÖNDERİLER SEKMESİ */}
                {activeTab === 'gonderiler' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {profile.posts?.length > 0 ? profile.posts.map(p => {
                            const imgUrl = p.medias?.[0]?.url;
                            const fullImgUrl = imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `http://localhost:5181${imgUrl}`) : null;
                            return (
                                <PostCard key={p.id}
                                    post={{ id: p.id, user: displayName, role: profile.departmentOrTitle, avatar: avatarSrc, time: new Date(p.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }), content: p.content, likes: p.likeCount, comments: p.commentCount, liked: p.isLikedByMe, image: fullImgUrl }}
                                    isOwnPost={isMe} onLike={loadProfile} onDelete={handleDeleteProfilePost}
                                />
                            );
                        }) : (
                            <div style={S.noPosts}>
                                <i className="feather-camera" style={{ fontSize: 48, color: '#ddd', display: 'block', marginBottom: 12 }}></i>
                                <h3 style={{ margin: '0 0 8px', color: '#555' }}>Henüz Gönderi Yok</h3>
                                <p style={{ margin: 0, color: '#aaa' }}>Bu kullanıcı henüz bir şey paylaşmamış.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. HAKKINDA (SENİN PORTFOLYO) SEKMESİ */}
                {activeTab === 'hakkinda' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 10 }}>

                        {/* BİYOGRAFİ KARTI */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                            <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>Biyografi</h3>
                            {isEditingBio ? (
                                <div>
                                    <textarea style={{ width: '100%', minHeight: '100px', borderRadius: '8px', border: '1px solid #ccc', padding: '12px', marginBottom: '12px', outlineColor: '#262F59' }}
                                        value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="Kendinden bahset..."
                                    />
                                    <div>
                                        <button onClick={handleBioSave} style={{ backgroundColor: '#262F59', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px', fontWeight: '500' }}>Kaydet</button>
                                        <button onClick={() => setIsEditingBio(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>İptal</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '16px' }}>
                                        {userBio || 'Henüz bir biyografi eklenmemiş.'}
                                    </p>
                                    {isMe && (
                                        <button onClick={() => { setIsEditingBio(true); setNewBio(userBio || ''); }}
                                            style={{ backgroundColor: '#e6f4f5', color: '#262F59', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                            Düzenle
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PROJELER KARTI */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                            <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>Projeler & Çalışmalar</h3>
                            {userProjects.length === 0 ? (
                                <p style={{ color: '#727271' }}>Henüz eklenmiş bir proje yok.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {userProjects.map((proj, index) => (
                                        <div key={index} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ color: '#0f172a', fontSize: '16px' }}>{proj.title || proj.Title}</strong>
                                                <a href={proj.link || proj.Link} target="_blank" rel="noreferrer" style={{ color: '#262F59', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>İncele ↗</a>
                                            </div>
                                            <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>{proj.description || proj.Description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isMe && (showProjectForm ? (
                                <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                                    <input type="text" placeholder="Proje Adı" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                    <input type="text" placeholder="Proje Linki (Github vb.)" value={newProject.link} onChange={(e) => setNewProject({ ...newProject, link: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                    <textarea placeholder="Proje Açıklaması" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '60px' }} />
                                    <button onClick={handleAddProject} style={{ backgroundColor: '#262F59', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}>Ekle</button>
                                    <button onClick={() => setShowProjectForm(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowProjectForm(true)} style={{ backgroundColor: '#262F59', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px', fontWeight: '500' }}>+ Yeni Proje Ekle</button>
                            ))}
                        </div>

                        {/* SERTİFİKALAR KARTI */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                            <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>Sertifikalar</h3>
                            {userCertificates.length === 0 ? (
                                <p style={{ color: '#727271' }}>Henüz eklenmiş bir sertifika yok.</p>
                            ) : (
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {userCertificates.map((cert, index) => (
                                        <li key={index} style={{ backgroundColor: '#e6f4f5', color: '#262F59', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
                                            🏆 {cert.name || cert.Name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {isMe && (showCertForm ? (
                                <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                                    <input type="text" placeholder="Sertifika Adı (Örn: React Bootcamp)" value={newCert.name} onChange={(e) => setNewCert({ name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                    <button onClick={handleAddCert} style={{ backgroundColor: '#262F59', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}>Ekle</button>
                                    <button onClick={() => setShowCertForm(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowCertForm(true)} style={{ backgroundColor: '#262F59', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px', fontWeight: '500' }}>+ Yeni Sertifika</button>
                            ))}
                        </div>

                    </div>
                )}

                {/* 3. ROZETLER SEKMESİ (Şimdilik Boş) */}
                {activeTab === 'rozetler' && (
                    <div style={S.noPosts}>
                        <i className="feather-award" style={{ fontSize: 48, color: '#ddd', display: 'block', marginBottom: 12 }}></i>
                        <h3 style={{ margin: '0 0 8px', color: '#555' }}>Rozetler Yakında</h3>
                        <p style={{ margin: 0, color: '#aaa' }}>Kullanıcıların başarı rozetleri burada listelenecek.</p>
                    </div>
                )}

            </main>

            <RightSidebar />

            {/* ===== MODALS (EŞREF'İN KODLARI AYNEN DURUYOR) ===== */}
            {cropperSrc && (
                <ImageCropperModal imageSrc={cropperSrc} mode={cropperMode} onConfirm={handleCropConfirm} onCancel={() => setCropperSrc(null)} />
            )}

            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn .2s', cursor: 'zoom-out' }}>
                    <button onClick={() => setLightboxSrc(null)} style={{ position: 'absolute', top: 20, right: 28, background: 'none', border: 'none', color: '#fff', fontSize: 40, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                    <img src={lightboxSrc} alt="Büyük görünüm" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', cursor: 'default' }} />
                </div>
            )}

            {showEditModal && (
                <div style={S.backdrop} onClick={() => setShowEditModal(false)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <div style={S.mHeader}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#262F59' }}>Profili Düzenle</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#bbb', lineHeight: 1, padding: 0 }}>&times;</button>
                        </div>
                        <div style={{ padding: '0 24px', overflowY: 'auto', maxHeight: '70vh' }}>
                            <div style={{ marginBottom: 24 }}>
                                <p style={S.label}>Kapak Fotoğrafı</p>
                                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 110, background: coverSrc ? 'none' : 'linear-gradient(135deg,#262F59,#003f47)', cursor: 'pointer' }} onClick={() => coverInputRef.current?.click()}>
                                    {coverSrc && <img src={coverSrc} alt="kapak" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                                        {coverUploading ? <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }}></div> : <i className="feather-image" style={{ color: '#fff', fontSize: 22 }}></i>}
                                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{profile.coverUrl ? 'Değiştir' : 'Kapak Ekle'}</span>
                                    </div>
                                </div>
                                {profile.coverUrl && (
                                    <button onClick={handleRemoveCover} style={{ ...S.btn, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 12, padding: '6px 12px', marginTop: 8 }}><i className="feather-trash-2" style={{ marginRight: 4 }}></i>Kapağı Kaldır</button>
                                )}
                            </div>
                            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <AvatarCircle url={profile.avatarUrl} name={displayName} size={80} border="3px solid #f0f2f5" />
                                    {avatarUploading && (
                                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }}></div></div>
                                    )}
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#333' }}>Profil Fotoğrafı</p>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button disabled={avatarUploading} onClick={() => avatarInputRef.current?.click()} style={{ ...S.btn, ...S.btnPrimary, fontSize: 12, padding: '7px 14px' }}><i className="feather-upload" style={{ marginRight: 5 }}></i>{profile.avatarUrl ? 'Değiştir' : 'Yükle'}</button>
                                        {profile.avatarUrl && <button disabled={avatarUploading} onClick={handleRemoveAvatar} style={{ ...S.btn, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 12, padding: '7px 14px' }}><i className="feather-trash-2" style={{ marginRight: 5 }}></i>Kaldır</button>}
                                    </div>
                                </div>
                            </div>
                            <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverFileSelect} />
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}><label style={S.label}>Ad</label><input className="ei" type="text" placeholder="Adınız" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} /></div>
                                <div style={{ flex: 1 }}><label style={S.label}>Soyad</label><input className="ei" type="text" placeholder="Soyadınız" value={editLastName} onChange={e => setEditLastName(e.target.value)} /></div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={S.label}>Kullanıcı Adı</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb', fontSize: 14 }}>@</span>
                                    <input className="ei" type="text" placeholder="kullanici_adi" value={editUserName} onChange={e => setEditUserName(e.target.value)} style={{ paddingLeft: 28 }} />
                                </div>
                            </div>
                            {editError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}><p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>{editError}</p></div>}
                        </div>
                        <div style={S.mFooter}>
                            <button onClick={() => setShowEditModal(false)} style={{ ...S.btn, ...S.btnSecondary, flex: 1 }}>İptal</button>
                            <button onClick={handleSaveProfile} disabled={editSaving} style={{ ...S.btn, ...S.btnPrimary, flex: 2, opacity: editSaving ? 0.7 : 1 }}>
                                {editSaving ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', marginRight: 8 }}></div>Kaydediliyor...</> : <><i className="feather-check" style={{ marginRight: 8 }}></i>Kaydet</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    page: { display: 'flex', gap: 20, maxWidth: 1400, margin: '0 auto', padding: '80px 20px 40px', boxSizing: 'border-box', alignItems: 'flex-start', minHeight: '100vh' },
    main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 },
    spinner: { width: 48, height: 48, border: '4px solid #262F59', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '80px auto' },
    heroCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
    name: { margin: '0 0 2px', fontSize: 24, fontWeight: 800, color: '#262F59' },
    handle: { margin: '0 0 4px', fontSize: 14, color: '#aaa' },
    role: { margin: 0, fontSize: 15, color: '#262F59', fontWeight: 600 },
    statsRow: { display: 'flex', gap: 40, padding: '18px 0', borderTop: '1px solid #f0f2f5', borderBottom: '1px solid #f0f2f5', margin: '18px 0' },
    btn: { padding: '10px 22px', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: '#262F59', color: '#fff' },
    btnSecondary: { backgroundColor: '#f0f2f5', color: '#262F59' },
    tabs: { display: 'flex', gap: 24, borderBottom: '1px solid #e8e8e8' },
    tabActive: { background: 'none', border: 'none', padding: '12px 4px', fontSize: 15, fontWeight: 700, color: '#262F59', borderBottom: '3px solid #262F59', cursor: 'pointer' },
    tab: { background: 'none', border: 'none', padding: '12px 4px', fontSize: 15, fontWeight: 600, color: '#aaa', cursor: 'pointer' },
    noPosts: { backgroundColor: '#fff', borderRadius: 20, padding: '60px 20px', textAlign: 'center' },
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn .2s' },
    modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', animation: 'slideUp .25s ease', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
    mHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f0f2f5', flexShrink: 0 },
    mFooter: { display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid #f0f2f5', flexShrink: 0 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
};