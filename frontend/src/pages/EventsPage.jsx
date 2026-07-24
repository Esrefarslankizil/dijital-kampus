import React, { useState } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';

export default function EventsPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Öğrenci';
    const [followStates, setFollowStates] = useState({});
    const [filter, setFilter] = useState('all'); // 'all' or 'attending'

    const [events, setEvents] = useState([
        { id: 1, title: '2026-2027 Akademik Yıl Açılışı', date: '21 Eylül, Pazartesi - 08:30', location: 'Ana Kampüs Konferans Salonu', attendees: 1240, image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600', isAttending: true },
        { id: 2, title: 'Kariyer Günleri: Geleceğin Meslekleri', date: '28 Ekim, Salı - 14:00', location: 'Konferans Salonu B', attendees: 342, image: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=600', isAttending: false },
        { id: 3, title: 'Yapay Zeka Çalıştayı', date: '02 Kasım, Pazar - 09:30', location: 'Teknokent Zemin Kat', attendees: 156, image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600', isAttending: false },
    ]);

    const handleAttend = (eventId) => {
        setEvents(events.map(ev => {
            if (ev.id === eventId) {
                return {
                    ...ev,
                    isAttending: !ev.isAttending,
                    attendees: ev.isAttending ? ev.attendees - 1 : ev.attendees + 1
                };
            }
            return ev;
        }));
    };

    const filteredEvents = filter === 'attending' ? events.filter(ev => ev.isAttending) : events;

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} activeMenu="events" />
            <main style={styles.feedArea}>
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#006F79', fontSize: '20px' }}>Kampüs Etkinlikleri</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.filterBtnActive : styles.filterBtn}>Yaklaşanlar</button>
                            <button onClick={() => setFilter('attending')} style={filter === 'attending' ? styles.filterBtnActive : styles.filterBtn}>Katıldıklarım</button>
                        </div>
                    </div>

                    {filteredEvents.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>Bu kategoride etkinlik bulunamadı.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {filteredEvents.map(ev => (
                                <div key={ev.id} style={styles.eventCard}>
                                    <img src={ev.image} alt={ev.title} style={styles.eventImage} />
                                    <div style={styles.eventContent}>
                                        <div>
                                            <h4 style={styles.eventTitle}>{ev.title}</h4>
                                            <p style={styles.eventMeta}><i className="feather-clock" style={{ marginRight: '6px' }}></i>{ev.date}</p>
                                            <p style={styles.eventMeta}><i className="feather-map-pin" style={{ marginRight: '6px' }}></i>{ev.location}</p>
                                        </div>
                                        <div style={styles.eventAction}>
                                            <span style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>{ev.attendees} Katılımcı</span>
                                            <button 
                                                onClick={() => handleAttend(ev.id)}
                                                style={{ ...styles.attendBtn, backgroundColor: ev.isAttending ? '#f0f2f5' : '#006F79', color: ev.isAttending ? '#555' : '#fff' }}
                                            >
                                                {ev.isAttending ? 'Katılıyorsun' : 'Katıl'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
    filterBtnActive: { backgroundColor: 'rgba(0,111,121,0.1)', color: '#006F79', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },
    filterBtn: { backgroundColor: 'transparent', color: '#888', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },
    eventCard: { border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '20px', alignItems: 'stretch' },
    eventImage: { width: '240px', objectFit: 'cover' },
    eventContent: { padding: '20px 20px 20px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    eventTitle: { margin: '0 0 12px', fontSize: '18px', color: '#1a1a2e' },
    eventMeta: { margin: '0 0 8px', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center' },
    eventAction: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #eee' },
    attendBtn: { border: 'none', padding: '8px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }
};
