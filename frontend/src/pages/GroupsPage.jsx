import React, { useState, useEffect, useCallback } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import { groupService } from '../services/api';

const CATEGORIES = ['all', 'Sosyal', 'Akademik', 'Spor', 'Kariyer', 'Oyun'];

function CreateGroupModal({ onClose, onCreated, currentUserId }) {
    const [form, setForm] = useState({ name: '', description: '', category: 'Sosyal' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('Grup adi zorunludur.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await groupService.createGroup({
                creatorId: currentUserId,
                name: form.name,
                description: form.description,
                category: form.category,
                imageUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 90000000000)}?auto=format&fit=crop&q=80&w=600` // Rastgele kapak
            });
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

export default function GroupsPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Ogrenci';
    const [followStates, setFollowStates] = useState({});

    const [myGroups, setMyGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [loadingMyGroups, setLoadingMyGroups] = useState(true);
    const [loadingAllGroups, setLoadingAllGroups] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return 1;
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
                        <h3 style={{ margin: 0, color: '#006F79', fontSize: '22px', fontWeight: 800 }}>
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
                    <h3 style={{ margin: '0 0 20px', color: '#1a1a2e', fontSize: '18px' }}>Gruplarim</h3>
                    {loadingMyGroups ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Yukleniyor...</div>
                    ) : myGroups.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Henuz hicbir gruba uye degilsiniz.</p>
                    ) : (
                        <div style={styles.groupsGrid}>
                            {myGroups.map(g => (
                                <div key={g.id} style={styles.groupCard}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={g.imageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400'} alt={g.name} style={styles.groupImage} />
                                        <span style={styles.categoryBadge}>{g.category}</span>
                                    </div>
                                    <div style={styles.groupContent}>
                                        <h4 style={styles.groupName}>{g.name}</h4>
                                        <p style={styles.groupMeta}>{g.memberCount} Uye &middot; {g.role}</p>
                                        <button onClick={() => handleLeaveGroup(g)} style={styles.leaveBtn}>Ayril</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Kesfet */}
                {(!loadingAllGroups && suggestedGroups.length > 0) && (
                    <div style={styles.card}>
                        <h3 style={{ margin: '0 0 20px', color: '#1a1a2e', fontSize: '18px' }}>Kesfet</h3>
                        <div style={styles.groupsGrid}>
                            {suggestedGroups.map(g => (
                                <div key={g.id} style={styles.groupCard}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={g.imageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400'} alt={g.name} style={styles.groupImage} />
                                        <span style={styles.categoryBadge}>{g.category}</span>
                                    </div>
                                    <div style={styles.groupContent}>
                                        <h4 style={styles.groupName}>{g.name}</h4>
                                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.description}</p>
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
        </div>
    );
}

const styles = {
    page: { display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px', minHeight: '100vh', backgroundColor: '#f0f2f5', alignItems: 'flex-start' },
    feedArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    searchInput: { width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f9fbfc' },
    catBtnActive: { backgroundColor: '#006F79', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },
    catBtn: { backgroundColor: '#f0f2f5', color: '#555', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
    createBtn: { backgroundColor: '#006F79', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,111,121,0.25)' },
    
    groupsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
    groupCard: { border: '1px solid #f0f2f5', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    groupImage: { width: '100%', height: '140px', objectFit: 'cover' },
    categoryBadge: { position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backdropFilter: 'blur(4px)' },
    groupContent: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
    groupName: { margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: '#1a1a2e', lineHeight: '1.3' },
    groupMeta: { margin: '0 0 16px', fontSize: '13px', color: '#888', fontWeight: 600 },
    joinBtn: { marginTop: 'auto', backgroundColor: '#006F79', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' },
    leaveBtn: { marginTop: 'auto', backgroundColor: '#f0f2f5', color: '#555', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' },
};

const modalStyles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontSize: '20px', fontWeight: 800, color: '#1a1a2e' },
    closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888', padding: '4px 8px', borderRadius: '8px' },
    field: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    submitBtn: { width: '100%', backgroundColor: '#006F79', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 12px rgba(0,111,121,0.3)' },
};
