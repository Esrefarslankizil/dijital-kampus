import React, { useState, useEffect } from 'react';
import { trendService, eventService, authService } from '../../services/api';
import { Link } from 'react-router-dom';

const RightSidebar = ({ followStates = {}, onFollow = () => {}, trendRefreshKey = 0 }) => {
    const [trends, setTrends] = useState([]);
    const [loadingTrends, setLoadingTrends] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const data = await trendService.getTrends();
                setTrends(data);
            } catch (error) {
                console.error("Trendler yüklenirken hata:", error);
            } finally {
                setLoadingTrends(false);
            }
        };
        fetchTrends();
    }, [trendRefreshKey]);

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventService.getEvents();
                const now = new Date();
                const future = data
                    .filter(e => new Date(e.eventDate) > now)
                    .slice(0, 3);
                setUpcomingEvents(future);
            } catch { /* sessizce basarisiz ol */ }
        };
        fetchEvents();
    }, [trendRefreshKey]);
    const events = [
        { month: 'EYL', day: '21', title: 'Akademik Yıl Açılışı', location: 'Ana Kampüs', color: '#B99C71', bg: 'rgba(185, 156, 113,0.1)' },
    ];
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const email = localStorage.getItem('email');
            if (!email) {
                setLoadingSuggestions(false);
                return;
            }
            try {
                const data = await authService.getRecommendations(email);
                setSuggestions(data);
            } catch (error) {
                console.error("Öneriler alınamadı:", error);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [followStates]); // followStates değiştiğinde önerileri güncelle

    return (
        <aside style={styles.rightSidebar}>
            <div style={styles.sideCard}>
                <p style={styles.sideCardTitle}><i className="feather-trending-up" style={{ marginRight: '8px', color: '#262F59' }}></i>Kampüs Gündemi</p>
                {loadingTrends ? (
                    <p style={{ fontSize: '12px', color: '#727271' }}>Yükleniyor...</p>
                ) : trends.length > 0 ? (
                    trends.map(trend => (
                        <div key={trend.topic} style={styles.trendingItem}>
                            <p style={styles.trendingCategory}>{trend.category}</p>
                            <p style={styles.trendingTopic}>{trend.topic}</p>
                            <p style={styles.trendingCount}>{trend.postCount} Gönderi</p>
                        </div>
                    ))
                ) : (
                    <p style={{ fontSize: '12px', color: '#727271' }}>Şu an gündem boş.</p>
                )}
            </div>

            <div style={styles.sideCard}>
                <p style={styles.sideCardTitle}><i className="feather-calendar" style={{ marginRight: '8px', color: '#262F59' }}></i>Yaklaşan Etkinlikler</p>
                {upcomingEvents.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '8px 0' }}>Yaklaşan etkinlik yok.</p>
                ) : (
                    upcomingEvents.map(ev => {
                        const d = new Date(ev.eventDate);
                        const month = d.toLocaleString('tr-TR', { month: 'short' }).toUpperCase().slice(0, 3);
                        const day = d.getDate();
                        return (
                            <div key={ev.id} style={styles.eventItem}>
                                <div style={{ ...styles.eventDate, backgroundColor: 'rgba(185, 156, 113,0.1)', color: '#B99C71' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, display: 'block' }}>{month}</span>
                                    <span style={{ fontSize: '20px', fontWeight: 800 }}>{day}</span>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#262F59', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>{ev.title}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#727271' }}>{ev.location}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <Link to="/events" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '8px', backgroundColor: 'rgba(38, 47, 89,0.05)', color: '#262F59', borderRadius: '8px', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>Tümünü Gör</Link>
            </div>
            
            <div style={styles.sideCard}>
                <p style={styles.sideCardTitle}><i className="feather-user-plus" style={{ marginRight: '8px', color: '#262F59' }}></i>Tanıyor Olabilirsiniz</p>
                {loadingSuggestions ? (
                    <p style={{ fontSize: '12px', color: '#727271', textAlign: 'center' }}>Yükleniyor...</p>
                ) : suggestions.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#727271', textAlign: 'center' }}>Öneri bulunamadı.</p>
                ) : (
                    suggestions.map((s) => {
                        const avatarUrl = s.avatarUrl && s.avatarUrl.trim() !== '' && s.avatarUrl !== 'null' && s.avatarUrl !== 'undefined' ? s.avatarUrl : '/images/default-avatar.svg';
                        const displayName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.userName;
                        return (
                            <div key={s.id} style={styles.suggestionItem}>
                                <img src={avatarUrl} alt={displayName} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px', border: '2px solid transparent', transition: 'border 0.2s' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '13.5px', color: '#262F59', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#727271' }}>{s.role} · {s.mutualCount || 0} ortak</p>
                                </div>
                                <button
                                    onClick={() => onFollow(s.id)}
                                    style={{
                                        ...styles.followBtn,
                                        backgroundColor: followStates[s.id] ? '#f3f4f6' : '#B99C71', // Gold color updated
                                        color: followStates[s.id] ? '#262F59' : '#fff',
                                        border: 'none'
                                    }}
                                >
                                    {followStates[s.id] ? 'Takiptesin' : 'Takip Et'}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <div style={{ ...styles.sideCard, background: 'linear-gradient(135deg, #262F59 0%, #151A33 100%)', color: '#fff' }}>
                <p style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 8px', display: 'flex', alignItems: 'center' }}><i className="feather-award" style={{ marginRight: '8px', color: '#B99C71' }}></i>MTÜ Mobil Uygulaması</p>
                <p style={{ fontSize: '12px', margin: '0 0 16px', opacity: 0.9, lineHeight: '1.4' }}>Kampüs her an cebinde! Ders notları, etkinlikler ve yemekhane menüsü tek tıkla elinin altında.</p>
                <button style={{ backgroundColor: '#fff', color: '#262F59', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', width: '100%' }}>Uygulamayı İndir</button>
            </div>
        </aside>
    );
};

const styles = {
    rightSidebar: { width: '290px', flexShrink: 0, position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' },
    sideCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 20px rgba(38, 47, 89, 0.08)' },
    sideCardTitle: { fontSize: '14px', fontWeight: 800, color: '#262F59', marginBottom: '16px', display: 'flex', alignItems: 'center' },
    eventItem: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
    eventDate: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    suggestionItem: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
    followBtn: { borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', marginLeft: '10px' },
    trendingItem: { marginBottom: '12px' },
    trendingCategory: { margin: 0, fontSize: '10.5px', color: '#727271', fontWeight: 600 },
    trendingTopic: { margin: '2px 0', fontSize: '14px', fontWeight: 800, color: '#262F59' },
    trendingCount: { margin: 0, fontSize: '11px', color: '#aaa' }
};

export default RightSidebar;
