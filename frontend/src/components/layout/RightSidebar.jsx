import React from 'react';
import { Link } from 'react-router-dom';

const RightSidebar = ({ followStates = {}, onFollow = () => {} }) => {
    const events = [
        { month: 'EYL', day: '21', title: 'Akademik Yıl Açılışı', location: 'Ana Kampüs', color: '#D6A327', bg: 'rgba(214,163,39,0.1)' },
    ];
    const suggestions = [
        { id: 10, name: 'Fatma Demir', role: 'Bilgisayar Müh.', avatar: '/images/user-2.png', mutualFriends: 5, followers: 89 },
        { id: 11, name: 'Murat Kaya', role: 'Elektrik Müh.', avatar: '/images/user-3.png', mutualFriends: 3, followers: 124 },
    ];

    return (
        <aside style={styles.rightSidebar}>
            <div style={styles.sideCard}>
                <p style={styles.sideCardTitle}><i className="feather-trending-up" style={{ marginRight: '8px', color: '#006F79' }}></i>Kampüs Gündemi</p>
                <div style={styles.trendingItem}>
                    <p style={styles.trendingCategory}>Akademik · Gündem</p>
                    <p style={styles.trendingTopic}>#VizeHaftası</p>
                    <p style={styles.trendingCount}>1,245 Gönderi</p>
                </div>
                <div style={styles.trendingItem}>
                    <p style={styles.trendingCategory}>Etkinlik · Gündem</p>
                    <p style={styles.trendingTopic}>#BaharŞenliği2026</p>
                    <p style={styles.trendingCount}>856 Gönderi</p>
                </div>
                <div style={styles.trendingItem}>
                    <p style={styles.trendingCategory}>Spor · Gündem</p>
                    <p style={styles.trendingTopic}>#MTUE-SporTurnuvası</p>
                    <p style={styles.trendingCount}>432 Gönderi</p>
                </div>
            </div>

            <div style={styles.sideCard}>
                <p style={styles.sideCardTitle}><i className="feather-calendar" style={{ marginRight: '8px', color: '#006F79' }}></i>Yaklaşan Etkinlikler</p>
                {events.map((ev, i) => (
                    <div key={i} style={styles.eventItem}>
                        <div style={{ ...styles.eventDate, backgroundColor: ev.bg, color: ev.color }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, display: 'block' }}>{ev.month}</span>
                            <span style={{ fontSize: '20px', fontWeight: 800 }}>{ev.day}</span>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>{ev.title}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{ev.location}</p>
                        </div>
                    </div>
                ))}
                <Link to="/events" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '8px', backgroundColor: 'rgba(0,111,121,0.05)', color: '#006F79', borderRadius: '8px', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>Tümünü Gör</Link>
            </div>
            
            <div style={styles.sideCard}>
                <p style={styles.sideCardTitle}><i className="feather-user-plus" style={{ marginRight: '8px', color: '#006F79' }}></i>Tanıyor Olabilirsiniz</p>
                {suggestions.map((s) => (
                    <div key={s.id} style={styles.suggestionItem}>
                        <img src={s.avatar} alt={s.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px', border: '2px solid transparent', transition: 'border 0.2s' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '13.5px', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{s.role} · {s.mutualFriends} ortak</p>
                        </div>
                        <button
                            onClick={() => onFollow(s.id)}
                            style={{
                                ...styles.followBtn,
                                backgroundColor: followStates[s.id] ? '#006F79' : 'rgba(0,111,121,0.1)',
                                color: followStates[s.id] ? '#fff' : '#006F79',
                                border: 'none'
                            }}
                        >
                            {followStates[s.id] ? 'Takip Ediliyor' : 'Takip Et'}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ ...styles.sideCard, background: 'linear-gradient(135deg, #006F79 0%, #004F56 100%)', color: '#fff' }}>
                <p style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 8px', display: 'flex', alignItems: 'center' }}><i className="feather-award" style={{ marginRight: '8px', color: '#D6A327' }}></i>MTÜ Mobil Uygulaması</p>
                <p style={{ fontSize: '12px', margin: '0 0 16px', opacity: 0.9, lineHeight: '1.4' }}>Kampüs her an cebinde! Ders notları, etkinlikler ve yemekhane menüsü tek tıkla elinin altında.</p>
                <button style={{ backgroundColor: '#fff', color: '#006F79', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', width: '100%' }}>Uygulamayı İndir</button>
            </div>
        </aside>
    );
};

const styles = {
    rightSidebar: { width: '290px', flexShrink: 0, position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' },
    sideCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 20px rgba(0, 111, 121, 0.08)' },
    sideCardTitle: { fontSize: '14px', fontWeight: 800, color: '#1a1a2e', marginBottom: '16px', display: 'flex', alignItems: 'center' },
    eventItem: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
    eventDate: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    suggestionItem: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
    followBtn: { borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', marginLeft: '10px' },
    trendingItem: { marginBottom: '12px' },
    trendingCategory: { margin: 0, fontSize: '10.5px', color: '#888', fontWeight: 600 },
    trendingTopic: { margin: '2px 0', fontSize: '14px', fontWeight: 800, color: '#1a1a2e' },
    trendingCount: { margin: 0, fontSize: '11px', color: '#aaa' }
};

export default RightSidebar;
