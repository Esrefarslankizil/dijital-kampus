import React, { useState, useEffect, useCallback } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import { eventService } from '../services/api';

const CATEGORIES = ['all', 'Seminer', 'Atolye', 'Kariyer', 'Sosyal', 'Spor', 'Genel'];

// Basit bir Toast bileseni
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bg = type === 'error' ? '#e74c3c' : '#27ae60';
    return (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: bg, color: '#fff', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '14px', animation: 'slideDown 0.3s ease-out' }}>
            <span>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', padding: 0 }}>&#x2715;</button>
        </div>
    );
}

const EVENT_IMAGES = {
    'Seminer':  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600',
    'Atolye':   'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600',
    'Kariyer':  'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=600',
    'Sosyal':   'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600',
    'Spor':     'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600',
    'default':  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600',
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
}

function CreateEventModal({ onClose, onCreated, currentUserId }) {
    const [form, setForm] = useState({
        title: '', description: '', eventDate: '', location: '', eventType: 'Genel', maxParticipants: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = React.useRef(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Resmi istemci tarafinda kucult (compress)
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const compressedFile = new File([blob], newFileName, { type: 'image/webp', lastModified: Date.now() });
                        setImageFile(compressedFile);
                        setImagePreview(URL.createObjectURL(compressedFile));
                    }, 'image/webp', 0.8); // %80 kalite WebP (en az veri icin)
                };
            };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.eventDate || !form.location) {
            setError('Baslik, tarih ve konum zorunludur.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await eventService.createEvent({
                organizerId: currentUserId,
                title: form.title,
                description: form.description,
                eventDate: new Date(form.eventDate).toISOString(),
                location: form.location,
                eventType: form.eventType,
                maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
            }, imageFile);
            onCreated(result);
            onClose();
        } catch (err) {
            setError('Etkinlik olusturulamadi. Lutfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h3 style={modalStyles.title}>Yeni Etkinlik Olustur</h3>
                    <button onClick={onClose} style={modalStyles.closeBtn}>&#x2715;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Gorsel Yukleme Alani */}
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Etkinlik Gorseli (Opsiyonel)</label>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageSelect} />
                        {imagePreview ? (
                            <div style={{ position: 'relative', marginBottom: '4px' }}>
                                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '180px', objectFit: 'contain', backgroundColor: '#f9fbfc', borderRadius: '12px', border: '2px solid #e5e7eb' }} />
                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>&#x2715;</button>
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fbfc', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor='#262F59'}
                                onMouseLeave={e => e.currentTarget.style.borderColor='#e5e7eb'}>
                                <i className="feather-image" style={{ fontSize: '28px', color: '#bbb', display: 'block', marginBottom: '8px' }}></i>
                                <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>Gorsel secmek icin tiklayin</p>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ccc' }}>JPG, PNG desteklenir</p>
                            </div>
                        )}
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Baslik *</label>
                        <input name="title" value={form.title} onChange={handleChange} placeholder="Etkinlik basligi" style={modalStyles.input} />
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Aciklama</label>
                        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Etkinlik hakkinda..." style={{ ...modalStyles.input, resize: 'vertical', minHeight: '80px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={modalStyles.field}>
                            <label style={modalStyles.label}>Tarih ve Saat *</label>
                            <input type="datetime-local" name="eventDate" value={form.eventDate} onChange={handleChange} style={modalStyles.input} />
                        </div>
                        <div style={modalStyles.field}>
                            <label style={modalStyles.label}>Kategori</label>
                            <select name="eventType" value={form.eventType} onChange={handleChange} style={modalStyles.input}>
                                {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={modalStyles.field}>
                            <label style={modalStyles.label}>Konum *</label>
                            <input name="location" value={form.location} onChange={handleChange} placeholder="Orn: Konferans Salonu A" style={modalStyles.input} />
                        </div>
                        <div style={modalStyles.field}>
                            <label style={modalStyles.label}>Maks. Katilimci (Opsiyonel)</label>
                            <input type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} placeholder="Ornek: 100" style={modalStyles.input} min="1" />
                        </div>
                    </div>
                    {error && <p style={{ color: '#e74c3c', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
                    <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
                        {loading ? 'Olusturuluyor...' : 'Etkinligi Olustur'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function EventsPage() {
    const userEmail = localStorage.getItem('email') || 'kullanici@mtu.edu.tr';
    const userRole = localStorage.getItem('role') || 'Ogrenci';
    const [followStates, setFollowStates] = useState({});
    const [filter, setFilter] = useState('all');
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [events, setEvents] = useState([]);
    const [attendingIds, setAttendingIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
    const currentUserId = getUserIdFromToken();

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await eventService.getEvents(
                filter === 'all' ? category : null,
                search || null,
                currentUserId
            );
            setEvents(data);
            
            // Populate attendingIds from API response
            const attending = data.filter(e => e.isAttending).map(e => e.id);
            setAttendingIds(new Set(attending));
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [category, filter, search, currentUserId]);

    useEffect(() => {
        if (filter !== 'attending') {
            loadEvents();
        }
    }, [loadEvents, filter]);

    const handleAttend = async (eventId) => {
        const isAttending = attendingIds.has(eventId);
        try {
            if (isAttending) {
                await eventService.leave(eventId, currentUserId);
                setAttendingIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
                setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendeeCount: e.attendeeCount - 1 } : e));
                setToast({ show: true, message: 'Etkinlikten ayrildiniz.', type: 'success' });
            } else {
                const result = await eventService.attend(eventId, currentUserId);
                if (!result.alreadyAttending) {
                    setAttendingIds(prev => new Set([...prev, eventId]));
                    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e));
                }
                setToast({ show: true, message: 'Etkinlige katilim saglandi!', type: 'success' });
            }
        } catch (err) {
            setToast({ show: true, message: err.message || 'Bir hata olustu.', type: 'error' });
        }
    };

    const handleCreated = (newEvent) => {
        setEvents(prev => [{ ...newEvent, attendeeCount: 0, isFull: false, organizerId: currentUserId }, ...prev]);
        setToast({ show: true, message: 'Etkinlik basariyla olusturuldu!', type: 'success' });
    };

    const displayedEvents = filter === 'attending'
        ? events.filter(e => attendingIds.has(e.id))
        : events;

    return (
        <div style={styles.page}>
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
            <style>
                {`
                @keyframes slideDown {
                    from { transform: translate(-50%, -20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                `}
            </style>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} activeMenu="events" />
            <main style={styles.feedArea}>

                {/* Header */}
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0, color: '#262F59', fontSize: '22px', fontWeight: 800 }}>
                            <i className="feather-calendar" style={{ marginRight: '10px' }}></i>Kampus Etkinlikleri
                        </h3>
                        <button onClick={() => setShowModal(true)} style={styles.createBtn}>
                            <i className="feather-plus" style={{ marginRight: '6px' }}></i>Etkinlik Olustur
                        </button>
                    </div>

                    {/* Arama */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <i className="feather-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '15px' }}></i>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Etkinlik veya konum ara..."
                            style={{ ...styles.searchInput, paddingLeft: '40px' }}
                        />
                    </div>

                    {/* Filtreler */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.filterBtnActive : styles.filterBtn}>Yaklasanlar</button>
                        <button onClick={() => setFilter('attending')} style={filter === 'attending' ? styles.filterBtnActive : styles.filterBtn}>Katildiklarim</button>
                        <div style={{ width: '1px', backgroundColor: '#eee', margin: '0 4px' }} />
                        {CATEGORIES.filter(c => c !== 'all').map(cat => (
                            <button key={cat} onClick={() => setCategory(cat === category ? 'all' : cat)} style={category === cat ? styles.catBtnActive : styles.catBtn}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Liste */}
                <div style={styles.card}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#262F59' }}>
                            <i className="feather-loader" style={{ fontSize: '24px' }}></i>
                            <p style={{ marginTop: '12px', color: '#727271' }}>Etkinlikler yukleniyor...</p>
                        </div>
                    ) : displayedEvents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <i className="feather-calendar" style={{ fontSize: '48px', color: '#ddd' }}></i>
                            <p style={{ color: '#aaa', marginTop: '16px', fontSize: '15px' }}>
                                {filter === 'attending' ? 'Henuz hicbir etkinlige katilmadınız.' : 'Bu kategoride etkinlik bulunamadi.'}
                            </p>
                            {filter !== 'attending' && (
                                <button onClick={() => setShowModal(true)} style={{ ...styles.createBtn, marginTop: '16px' }}>
                                    Ilk etkinligi olustur
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {displayedEvents.map(ev => {
                                const isAttending = attendingIds.has(ev.id);
                                const isOrganizer = ev.organizerId === currentUserId;
                                const isPast = new Date(ev.eventDate) < new Date();
                                const imgSrc = EVENT_IMAGES[ev.eventType] || EVENT_IMAGES['default'];
                                const isFull = ev.isFull && !isAttending;
                                return (
                                    <div key={ev.id} style={styles.eventCard}>
                                        <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
                                            <img
                                                src={ev.imagePath ? 'http://localhost:5181' + ev.imagePath : 'http://localhost:5181/uploads/events/default.jpg'}
                                                alt={ev.title}
                                                style={styles.eventImage}
                                            />
                                            <span style={{ ...styles.categoryBadge, backgroundColor: isAttending ? '#262F59' : '#f0f2f5', color: isAttending ? '#fff' : '#555' }}>
                                                {ev.eventType}
                                            </span>
                                        </div>
                                        <div style={styles.eventContent}>
                                            <div>
                                                <h4 style={styles.eventTitle}>{ev.title}</h4>
                                                {ev.description && <p style={{ fontSize: '13px', color: '#727271', margin: '0 0 12px', lineHeight: '1.5' }}>{ev.description}</p>}
                                                <p style={styles.eventMeta}><i className="feather-clock" style={{ marginRight: '6px', color: '#262F59' }}></i>{formatDate(ev.eventDate)}</p>
                                                <p style={styles.eventMeta}><i className="feather-map-pin" style={{ marginRight: '6px', color: '#262F59' }}></i>{ev.location}</p>
                                                <p style={styles.eventMeta}><i className="feather-user" style={{ marginRight: '6px', color: '#262F59' }}></i>{ev.organizerEmail}</p>
                                            </div>
                                            <div style={styles.eventAction}>
                                                <div>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>
                                                        {ev.attendeeCount} Katilimci
                                                    </span>
                                                    {ev.maxParticipants && (
                                                        <>
                                                            <span style={{ color: '#ccc', margin: '0 6px' }}>/</span>
                                                            <span style={{ fontSize: '13px', color: isFull ? '#e74c3c' : '#727271' }}>
                                                                {isFull ? 'Kontenjan Dolu' : `Maks. ${ev.maxParticipants}`}
                                                            </span>
                                                            {ev.maxParticipants && (
                                                                <div style={{ marginTop: '6px', height: '4px', borderRadius: '4px', backgroundColor: '#f0f2f5', width: '120px' }}>
                                                                    <div style={{ height: '100%', borderRadius: '4px', backgroundColor: isFull ? '#e74c3c' : '#262F59', width: Math.min(100, (ev.attendeeCount / ev.maxParticipants) * 100) + '%', transition: 'width 0.3s' }} />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleAttend(ev.id)}
                                                    disabled={isFull || isOrganizer || isPast}
                                                    style={{
                                                        ...styles.attendBtn,
                                                        backgroundColor: isPast ? '#e5e7eb' : isOrganizer ? '#f0f2f5' : isAttending ? '#fff' : isFull ? '#f0f2f5' : '#262F59',
                                                        color: isPast ? '#9ca3af' : isOrganizer ? '#727271' : isAttending ? '#262F59' : isFull ? '#bbb' : '#fff',
                                                        border: isAttending && !isOrganizer && !isPast ? '2px solid #262F59' : '2px solid transparent',
                                                        cursor: (isFull || isOrganizer || isPast) ? 'not-allowed' : 'pointer',
                                                    }}
                                                >
                                                    {isPast ? 'Sona Erdi' : isOrganizer ? 'Duzenleyen Sensin' : isAttending ? 'Katiliyorsun ✓' : isFull ? 'Kontenjan Dolu' : 'Katil'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <RightSidebar followStates={followStates} onFollow={() => {}} />

            {showModal && (
                <CreateEventModal
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
    filterBtnActive: { backgroundColor: 'rgba(38, 47, 89,0.12)', color: '#262F59', border: 'none', padding: '7px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },
    filterBtn: { backgroundColor: 'transparent', color: '#727271', border: 'none', padding: '7px 18px', borderRadius: '20px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
    catBtnActive: { backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' },
    catBtn: { backgroundColor: '#f0f2f5', color: '#555', border: 'none', padding: '5px 14px', borderRadius: '20px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' },
    createBtn: { backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(38, 47, 89,0.25)' },
    eventCard: { border: '1px solid #f0f2f5', borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '0', alignItems: 'stretch', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    eventImage: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f9fbfc', display: 'block', minHeight: '180px' },
    categoryBadge: { position: 'absolute', top: '10px', left: '10px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 },
    eventContent: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    eventTitle: { margin: '0 0 10px', fontSize: '17px', fontWeight: 800, color: '#262F59', lineHeight: '1.3' },
    eventMeta: { margin: '0 0 6px', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center' },
    eventAction: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #eee' },
    attendBtn: { padding: '9px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', transition: 'all 0.2s' },
};

const modalStyles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontSize: '20px', fontWeight: 800, color: '#262F59' },
    closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#727271', padding: '4px 8px', borderRadius: '8px' },
    field: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    submitBtn: { width: '100%', backgroundColor: '#262F59', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(38, 47, 89,0.3)' },
};
