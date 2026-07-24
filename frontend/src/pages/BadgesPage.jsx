import React, { useState } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';

export default function BadgesPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Öğrenci';
    const [followStates, setFollowStates] = useState({});

    // Mock data for badges
    const badges = [
        { id: 1, name: 'İlk Adım', icon: 'feather-award', color: '#006F79', desc: 'MTÜ Dijital Kampüs\'e katıldın.', unlocked: true },
        { id: 2, name: 'Sosyal Kelebek', icon: 'feather-heart', color: '#e74c3c', desc: 'Gönderilerin 50 beğeni aldı.', unlocked: true },
        { id: 3, name: 'Akademik Paylaşımcı', icon: 'feather-book', color: '#D6A327', desc: 'Ders notu paylaştın.', unlocked: false },
        { id: 4, name: 'Etkinlik Rehberi', icon: 'feather-map-pin', color: '#27ae60', desc: '3 farklı etkinliğe katıldın.', unlocked: false },
        { id: 5, name: 'Popüler Öğrenci', icon: 'feather-users', color: '#8e44ad', desc: '100 takipçiye ulaştın.', unlocked: false },
        { id: 6, name: 'Yardımsever', icon: 'feather-thumbs-up', color: '#f39c12', desc: 'Başkalarının gönderilerine 100 beğeni bıraktın.', unlocked: true },
    ];

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} activeMenu="badges" />
            <main style={styles.feedArea}>
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#006F79', fontSize: '20px' }}>Rozetlerim</h3>
                        <div style={{ backgroundColor: 'rgba(214, 163, 39, 0.1)', color: '#D6A327', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
                            <i className="feather-star" style={{ marginRight: '6px' }}></i>1450 Puan
                        </div>
                    </div>
                    
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Dijital Kampüs'teki etkileşimlerine göre rozetler kazan ve puan topla.</p>
                    
                    <div style={styles.badgesGrid}>
                        {badges.map(b => (
                            <div key={b.id} style={{ ...styles.badgeCard, opacity: b.unlocked ? 1 : 0.6, borderColor: b.unlocked ? '#eee' : 'transparent', backgroundColor: b.unlocked ? '#fff' : '#f9f9fa' }}>
                                <div style={{ ...styles.badgeIconWrap, backgroundColor: b.unlocked ? b.color : '#ccc' }}>
                                    <i className={b.icon} style={{ color: '#fff', fontSize: '28px' }}></i>
                                </div>
                                <h4 style={{ margin: '14px 0 6px', fontSize: '14px', color: '#1a1a2e' }}>{b.name}</h4>
                                <p style={{ fontSize: '11px', color: '#888', margin: 0, textAlign: 'center', lineHeight: '1.4' }}>{b.desc}</p>
                                {!b.unlocked && <span style={{ marginTop: '12px', fontSize: '10px', fontWeight: 'bold', color: '#999', backgroundColor: '#eee', padding: '4px 10px', borderRadius: '12px' }}><i className="feather-lock"></i> Kilitli</span>}
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
    page: { maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px', padding: '24px 16px', alignItems: 'flex-start' },
    feedArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    badgesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' },
    badgeCard: { border: '1px solid #eee', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' },
    badgeIconWrap: { width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};
