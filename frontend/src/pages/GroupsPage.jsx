import React, { useState } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';

export default function GroupsPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Öğrenci';
    const [followStates, setFollowStates] = useState({});

    const [myGroups, setMyGroups] = useState([
        { id: 1, name: 'Yazılım ve İnovasyon Kulübü', members: 124, role: 'Üye', image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=200' },
        { id: 2, name: 'Doğa ve Kampçılık', members: 56, role: 'Yönetici', image: 'https://images.unsplash.com/photo-1504280390267-33106440ebec?auto=format&fit=crop&q=80&w=200' },
    ]);

    const [suggestedGroups, setSuggestedGroups] = useState([
        { id: 3, name: 'MTÜ E-Spor', members: 342, category: 'Oyun', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200' },
        { id: 4, name: 'Yapay Zeka Araştırmaları', members: 89, category: 'Akademik', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=200' },
        { id: 5, name: 'Girişimcilik Kulübü', members: 156, category: 'Kariyer', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=200' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupCategory, setNewGroupCategory] = useState('Sosyal');

    const handleJoinGroup = (groupToJoin) => {
        setSuggestedGroups(suggestedGroups.filter(g => g.id !== groupToJoin.id));
        setMyGroups([...myGroups, { 
            id: groupToJoin.id, 
            name: groupToJoin.name, 
            members: groupToJoin.members + 1, 
            role: 'Üye', 
            image: groupToJoin.image 
        }]);
    };

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        const newGroup = {
            id: Date.now(),
            name: newGroupName,
            members: 1,
            role: 'Yönetici',
            // Rastgele bir teknoloji veya sosyal resmi
            image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 90000000000)}?auto=format&fit=crop&q=80&w=200`
        };

        setMyGroups([...myGroups, newGroup]);
        setNewGroupName('');
        setIsModalOpen(false);
    };

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} activeMenu="groups" />
            <main style={styles.feedArea}>
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#006F79', fontSize: '20px' }}>Gruplarım</h3>
                        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#006F79', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                            <i className="feather-plus" style={{ marginRight: '6px' }}></i>Yeni Grup Kur
                        </button>
                    </div>

                    {myGroups.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Henüz hiçbir gruba üye değilsiniz.</p>
                    ) : (
                        <div style={styles.groupsGrid}>
                            {myGroups.map(g => (
                                <div key={g.id} style={styles.groupCard}>
                                    <img src={g.image} alt={g.name} style={styles.groupImage} />
                                    <div style={styles.groupContent}>
                                        <h4 style={styles.groupName}>{g.name}</h4>
                                        <p style={styles.groupMeta}>{g.members} Üye · {g.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {suggestedGroups.length > 0 && (
                    <div style={styles.card}>
                        <h3 style={{ margin: '0 0 20px', color: '#1a1a2e', fontSize: '18px' }}>Keşfet</h3>
                        <div style={styles.groupsGrid}>
                            {suggestedGroups.map(g => (
                                <div key={g.id} style={styles.groupCard}>
                                    <img src={g.image} alt={g.name} style={styles.groupImage} />
                                    <div style={styles.groupContent}>
                                        <h4 style={styles.groupName}>{g.name}</h4>
                                        <p style={styles.groupMeta}>{g.members} Üye · {g.category}</p>
                                        <button onClick={() => handleJoinGroup(g)} style={styles.joinBtn}>Katıl</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <RightSidebar followStates={followStates} onFollow={() => {}} />

            {/* Yeni Grup Kurma Modalı */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1a1a2e' }}>Yeni Grup Kur</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>
                                <i className="feather-x"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: 600 }}>Grup Adı</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Örn: Dağcılık Kulübü" 
                                    style={styles.modalInput} 
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: 600 }}>Kategori</label>
                                <select 
                                    value={newGroupCategory}
                                    onChange={(e) => setNewGroupCategory(e.target.value)}
                                    style={styles.modalInput}
                                >
                                    <option value="Sosyal">Sosyal</option>
                                    <option value="Akademik">Akademik</option>
                                    <option value="Spor">Spor</option>
                                    <option value="Kariyer">Kariyer</option>
                                </select>
                            </div>
                            <button type="submit" style={styles.modalSubmitBtn}>Grubu Oluştur</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px', padding: '24px 16px', alignItems: 'flex-start' },
    feedArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    groupsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
    groupCard: { border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    groupImage: { width: '100%', height: '100px', objectFit: 'cover' },
    groupContent: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
    groupName: { margin: '0 0 8px', fontSize: '15px', color: '#1a1a2e' },
    groupMeta: { margin: '0 0 16px', fontSize: '12px', color: '#888' },
    joinBtn: { marginTop: 'auto', backgroundColor: 'rgba(0,111,121,0.1)', color: '#006F79', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
    
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
    modalInput: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
    modalSubmitBtn: { width: '100%', backgroundColor: '#006F79', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }
};
