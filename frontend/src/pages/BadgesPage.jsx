import React, { useState } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';

export default function BadgesPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Ogrenci';
    const [followStates, setFollowStates] = useState({});
    const [activeTab, setActiveTab] = useState('all');

    // Gamification User Data
    const userStats = {
        totalPoints: 1450,
        currentLevel: 5,
        levelTitle: "Kampüs Elçisi",
        nextLevelPoints: 2000,
        unlockedCount: 3,
        totalBadges: 6
    };

    const progressPercentage = (userStats.totalPoints / userStats.nextLevelPoints) * 100;

    // Mock data for badges
    const badges = [
        { id: 1, name: 'İlk Adım', icon: 'feather-award', color: '#006F79', glow: 'rgba(0,111,121,0.4)', desc: 'MTÜ Dijital Kampüs\'e katıldın.', unlocked: true, points: 50 },
        { id: 2, name: 'Sosyal Kelebek', icon: 'feather-heart', color: '#e74c3c', glow: 'rgba(231,76,60,0.4)', desc: 'Gönderilerin 50 beğeni aldı.', unlocked: true, points: 200 },
        { id: 3, name: 'Akademik Paylaşımcı', icon: 'feather-book', color: '#D6A327', glow: 'rgba(214,163,39,0.4)', desc: 'Ders notu paylaştın.', unlocked: false, progress: 0, total: 1, points: 300 },
        { id: 4, name: 'Etkinlik Rehberi', icon: 'feather-map-pin', color: '#27ae60', glow: 'rgba(39,174,96,0.4)', desc: '3 farklı etkinliğe katıldın.', unlocked: false, progress: 1, total: 3, points: 400 },
        { id: 5, name: 'Popüler Öğrenci', icon: 'feather-users', color: '#8e44ad', glow: 'rgba(142,68,173,0.4)', desc: '100 takipçiye ulaştın.', unlocked: false, progress: 45, total: 100, points: 500 },
        { id: 6, name: 'Yardımsever', icon: 'feather-thumbs-up', color: '#f39c12', glow: 'rgba(243,156,18,0.4)', desc: 'Başkalarının gönderilerine 100 beğeni bıraktın.', unlocked: true, points: 300 },
    ];

    const displayedBadges = badges.filter(b => {
        if (activeTab === 'unlocked') return b.unlocked;
        if (activeTab === 'locked') return !b.unlocked;
        return true;
    });

    return (
        <div style={styles.page}>
            <style>
                {`
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(0, 111, 121, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 111, 121, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 111, 121, 0); }
                }
                .badge-card {
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                .badge-card:hover {
                    transform: translateY(-5px) scale(1.02);
                }
                .unlocked-card:hover {
                    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
                }
                .tab-btn {
                    transition: all 0.2s;
                }
                .tab-btn:hover {
                    background-color: rgba(0,111,121,0.05);
                }
                @media (max-width: 992px) {
                    .feed-area { padding: 0 !important; }
                    .hero-banner { flex-direction: column; text-align: center; }
                    .hero-stats { width: 100%; margin-top: 20px; }
                    .badges-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; }
                }
                `}
            </style>
            
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} activeMenu="badges" />
            
            <main className="feed-area" style={styles.feedArea}>
                
                {/* Hero Banner Section */}
                <div className="hero-banner" style={styles.heroBanner}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '12px', backdropFilter: 'blur(4px)' }}>
                            <i className="feather-star" style={{ marginRight: '6px', color: '#FFD700' }}></i>
                            Seviye {userStats.currentLevel}
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800 }}>{userStats.levelTitle}</h2>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                            Platformdaki etkileşimlerinle harika gidiyorsun! Yeni görevleri tamamla ve efsane rozetlerin kilidini aç.
                        </p>
                    </div>
                    
                    <div className="hero-stats" style={styles.heroStatsBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                            <div>
                                <span style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Toplam Puan</span>
                                <span style={{ fontSize: '24px', fontWeight: 800 }}>{userStats.totalPoints}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Sonraki Seviye</span>
                                <span style={{ fontSize: '16px', fontWeight: 700 }}>{userStats.nextLevelPoints}</span>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#FFD700', borderRadius: '4px', boxShadow: '0 0 10px rgba(255,215,0,0.5)' }}></div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
                            Seviye atlamaya <strong>{userStats.nextLevelPoints - userStats.totalPoints} puan</strong> kaldı!
                        </div>
                    </div>
                </div>

                <div style={styles.mainCard}>
                    {/* Header & Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '20px', fontWeight: 800 }}>
                                <i className="feather-award" style={{ marginRight: '8px', color: '#006F79' }}></i>Rozet Koleksiyonu
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                                {userStats.unlockedCount} / {userStats.totalBadges} rozet açıldı
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', backgroundColor: '#f0f2f5', padding: '4px', borderRadius: '12px' }}>
                            <button className="tab-btn" onClick={() => setActiveTab('all')} style={activeTab === 'all' ? styles.activeTab : styles.inactiveTab}>Tümü</button>
                            <button className="tab-btn" onClick={() => setActiveTab('unlocked')} style={activeTab === 'unlocked' ? styles.activeTab : styles.inactiveTab}>Kazanılanlar</button>
                            <button className="tab-btn" onClick={() => setActiveTab('locked')} style={activeTab === 'locked' ? styles.activeTab : styles.inactiveTab}>Kilitliler</button>
                        </div>
                    </div>

                    {/* Badges Grid */}
                    <div className="badges-grid" style={styles.badgesGrid}>
                        {displayedBadges.map(b => (
                            <div key={b.id} className={`badge-card ${b.unlocked ? 'unlocked-card' : ''}`} style={{ ...styles.badgeCard, ...(b.unlocked ? styles.badgeUnlocked : styles.badgeLocked) }}>
                                
                                {/* Points Badge */}
                                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: b.unlocked ? 'rgba(0,0,0,0.05)' : '#eee', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: b.unlocked ? b.color : '#aaa' }}>
                                    +{b.points} 
                                </div>

                                {/* Icon Wrap */}
                                <div style={{ ...styles.badgeIconWrap, backgroundColor: b.unlocked ? b.color : '#e0e0e0', boxShadow: b.unlocked ? `0 8px 20px ${b.glow}` : 'none' }}>
                                    <i className={b.icon} style={{ color: b.unlocked ? '#fff' : '#aaa', fontSize: '32px' }}></i>
                                    {b.unlocked && (
                                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: '#fff', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            <i className="feather-check-circle" style={{ color: '#27ae60', fontSize: '14px', display: 'block', backgroundColor: '#fff', borderRadius: '50%' }}></i>
                                        </div>
                                    )}
                                </div>
                                
                                <h4 style={{ margin: '16px 0 6px', fontSize: '15px', fontWeight: 700, color: b.unlocked ? '#1a1a2e' : '#888' }}>{b.name}</h4>
                                <p style={{ fontSize: '12px', color: '#777', margin: 0, textAlign: 'center', lineHeight: '1.4', flex: 1 }}>{b.desc}</p>
                                
                                {/* Locked Progress Indicator */}
                                {!b.unlocked && b.total && (
                                    <div style={{ width: '100%', marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999', marginBottom: '4px', fontWeight: 600 }}>
                                            <span>İlerleme</span>
                                            <span>{b.progress} / {b.total}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(b.progress / b.total) * 100}%`, height: '100%', backgroundColor: '#ccc', borderRadius: '3px' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            
            <RightSidebar followStates={followStates} onFollow={() => {}} />
        </div>
    );
}

const styles = {
    page: { display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px', minHeight: '100vh', backgroundColor: '#f9fbfc', alignItems: 'flex-start' },
    feedArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' },
    
    heroBanner: { 
        background: 'linear-gradient(135deg, #006F79 0%, #004F56 100%)', 
        borderRadius: '20px', 
        padding: '32px 40px', 
        color: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(0,111,121,0.2)',
        position: 'relative',
        overflow: 'hidden'
    },
    heroStatsBox: { 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        borderRadius: '16px', 
        padding: '20px', 
        width: '320px', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
    },
    
    mainCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    
    activeTab: { backgroundColor: '#fff', color: '#006F79', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    inactiveTab: { backgroundColor: 'transparent', color: '#888', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
    
    badgesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' },
    badgeCard: { 
        border: '1px solid #f0f2f5', 
        borderRadius: '16px', 
        padding: '24px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        cursor: 'pointer',
        position: 'relative',
        height: '100%'
    },
    badgeUnlocked: {
        backgroundColor: '#fff',
        border: '1px solid #eaeaea',
    },
    badgeLocked: {
        backgroundColor: '#f9fbfc',
        border: '1px dashed #e0e0e0',
        filter: 'grayscale(100%)',
        opacity: 0.8
    },
    badgeIconWrap: { 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'relative',
        marginBottom: '4px'
    }
};
