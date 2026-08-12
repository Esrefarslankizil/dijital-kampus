import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MtuLogo from '../MtuLogo';

// localStorage'dan görünen adı hesapla
const getDisplayNameFromStorage = () => {
    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || localStorage.getItem('displayName') || localStorage.getItem('email') || 'Kullanıcı';
};

function Header({ onOpenLogin, onOpenRegister }) {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [showRightSearch, setShowRightSearch] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [headerDisplayName, setHeaderDisplayName] = useState(getDisplayNameFromStorage);
    
    // Notifications State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const navigate = useNavigate();

    const currentUserId = parseInt(localStorage.getItem('userId') || '0', 10);

    // localStorage değiştiğinde ismi güncelle
    useEffect(() => {
        const handleStorageChange = () => {
            setHeaderDisplayName(getDisplayNameFromStorage());
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Load Notifications
    const loadNotifications = async () => {
        if (!currentUserId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5181/api/notifications/${currentUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error("Notifications err:", error);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5181/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = async (e) => {
        const val = e.target.value;
        setKeyword(val);
        if (val.length > 2) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5181/api/Follow/search?keyword=${val}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error("Arama hatası:", error);
            }
        } else {
            setResults([]);
        }
    };

    return (
        <div className="nav-header bg-white border-0" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: '60px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>

            {/* CSS SIFIRLAMA VE MİLİMETRİK EŞİTLEME */}
            <style>{`
            .custom-dropdown-menu {
                position: absolute !important;
                top: 50px !important;
                right: 0 !important;
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
                width: 160px !important;
                padding: 6px !important;
                z-index: 9999 !important;
            }

            .dropdown-btn {
                all: unset !important; /* Dışarıdan gelen tüm CSS'leri ezer */
                box-sizing: border-box !important;
                width: 100% !important;
                display: flex !important;
                align-items: center !important;
                padding: 8px 12px !important;
                border-radius: 8px !important;
                font-size: 13.5px !important;
                font-weight: 500 !important;
                color: #334155 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }

            .dropdown-btn i {
                font-size: 16px !important;
                margin-right: 10px !important;
                color: #64748b !important;
                transition: all 0.2s ease !important;
            }

            .dropdown-btn:hover {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
            }

            .dropdown-btn:hover i {
                color: var(--mtu-primary, #0284c7) !important;
            }

            .dropdown-btn.logout:hover {
                background-color: #fef2f2 !important;
                color: #dc2626 !important;
            }

            .dropdown-btn.logout:hover i {
                color: #dc2626 !important;
            }

            .menu-divider {
                height: 1px !important;
                background-color: #f1f5f9 !important;
                margin: 4px 0 !important;
                border: none !important;
            }
        `}</style>

            <div className="nav-top w-100 d-flex align-items-center" style={{ height: '60px', padding: '0 20px' }}>
                <a href="/feed" className="d-flex align-items-center text-decoration-none" style={{ flexShrink: 0 }}>
                    <MtuLogo height={38} />
                </a>

                {/* Arama */}
                <div className="d-none d-lg-block ms-4" style={{ flex: '0 1 320px' }}>
                    <div style={{ position: 'relative' }}>
                        <i className="feather-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '14px' }}></i>
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={keyword}
                            onChange={handleSearch}
                            style={{
                                width: '100%',
                                border: '1.5px solid #e8eaf0',
                                borderRadius: '24px',
                                padding: '8px 16px 8px 38px',
                                fontSize: '13px',
                                outline: 'none',
                                backgroundColor: '#f8f9fa',
                            }}
                        />
                        {results.length > 0 && (
                            <ul style={{
                                position: 'absolute',
                                top: '45px',
                                left: 0,
                                background: '#fff',
                                width: '100%',
                                listStyle: 'none',
                                border: '1px solid #ddd',
                                borderRadius: '12px',
                                padding: '10px',
                                margin: 0,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {results.map(user => {
                                    const displayName = (user.firstName || user.lastName)
                                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                        : (user.userName || user.email.split('@')[0]);
                                    const initial = displayName.charAt(0).toUpperCase();
                                    return (
                                        <li key={user.id} style={{ borderBottom: '1px solid #f0f2f5', margin: 0, padding: 0 }}>
                                            <Link
                                                to={`/profile/${user.id}`}
                                                onClick={() => { setKeyword(''); setResults([]); }}
                                                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '10px', textDecoration: 'none', gap: '12px' }}
                                            >
                                                {user.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
                                                    <img src={`http://localhost:5181${user.avatarUrl}`} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
                                                ) : (
                                                    <img src="/images/default-avatar.svg" alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block', backgroundColor: '#f0f2f5' }} />
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <strong style={{ fontSize: '13.5px', color: '#262F59', marginBottom: '2px', lineHeight: 1.2 }}>{displayName}</strong>
                                                    <span style={{ fontSize: '12px', color: '#727271', lineHeight: 1.2 }}>@{user.userName || user.email.split('@')[0]}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Sağ Simgeler */}
                <div className="d-flex align-items-center ms-auto" style={{ gap: '6px', position: 'relative' }}>
                    <Link to="/" style={{...iconBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#12A7CD'}}>
                        <i className="feather-home" style={{ fontSize: '18px' }}></i>
                    </Link>
                    
                    {/* Notifications Bell */}
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setIsProfileMenuOpen(false);
                            }} 
                            style={{...iconBtnStyle, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#262F59', position: 'relative'}}
                        >
                            <i className="feather-bell" style={{ fontSize: '18px' }}></i>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -4, backgroundColor: '#e74c3c', color: '#fff', fontSize: '10px', 
                                    fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div style={{
                                position: 'absolute', top: '50px', right: 0, width: '320px', backgroundColor: '#fff', 
                                borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
                            }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fbfc' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#262F59', fontWeight: 700 }}>Bildirimler</h4>
                                    {unreadCount > 0 && <span style={{ fontSize: '12px', color: '#12A7CD', cursor: 'pointer', fontWeight: 600 }}>Tümünü Okundu İşaretle</span>}
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#727271', fontSize: '14px' }}>
                                            Yeni bildiriminiz yok.
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                onClick={() => !n.isRead && markAsRead(n.id)}
                                                style={{ 
                                                    padding: '14px 16px', borderBottom: '1px solid #f0f2f5', cursor: 'pointer',
                                                    backgroundColor: n.isRead ? '#fff' : '#f0f8ff', display: 'flex', gap: '12px', alignItems: 'flex-start',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: n.isRead ? 'transparent' : '#12A7CD', marginTop: 6, flexShrink: 0 }}></div>
                                                <div>
                                                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#262F59', lineHeight: '1.4', fontWeight: n.isRead ? 500 : 600 }}>{n.content}</p>
                                                    <span style={{ fontSize: '11px', color: '#888' }}>
                                                        {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link to="/messages" style={{...iconBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#262F59'}}>
                        <i className="feather-message-square" style={{ fontSize: '18px' }}></i>
                    </Link>
                    
                    <button
                        type="button"
                        onClick={() => setShowRightSearch(!showRightSearch)}
                        className="d-flex align-items-center justify-content-center border-0"
                        style={iconBtnStyle}
                    >
                        <i className="feather-search" style={{ fontSize: '18px', color: showRightSearch ? 'var(--mtu-primary)' : '#555' }}></i>
                    </button>

                    {/* Sağ Butondan Açılan Hızlı Arama Kutusu */}
                    {showRightSearch && (
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            right: 0,
                            width: '280px',
                            background: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            border: '1px solid #e8eaf0',
                            padding: '12px',
                            zIndex: 1005
                        }}>
                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <i className="feather-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '13px' }}></i>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Kullanıcı ara..."
                                    value={keyword}
                                    onChange={handleSearch}
                                    style={{
                                        width: '100%',
                                        border: '1.5px solid #262F59',
                                        borderRadius: '20px',
                                        padding: '6px 12px 6px 34px',
                                        fontSize: '13px',
                                        outline: 'none',
                                        backgroundColor: '#fff',
                                    }}
                                />
                            </div>
                            {results.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '240px', overflowY: 'auto' }}>
                                    {results.map(user => {
                                        const displayName = (user.firstName || user.lastName)
                                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                            : (user.userName || user.email.split('@')[0]);
                                        const initial = displayName.charAt(0).toUpperCase();
                                        return (
                                            <li key={user.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                                                <Link
                                                    to={`/profile/${user.id}`}
                                                    onClick={() => { setKeyword(''); setResults([]); setShowRightSearch(false); }}
                                                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px', textDecoration: 'none', gap: '10px' }}
                                                >
                                                    {user.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
                                                        <img src={`http://localhost:5181${user.avatarUrl}`} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                    ) : (
                                                        <img src="/images/default-avatar.svg" alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, backgroundColor: '#f0f2f5' }} />
                                                    )}
                                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        <strong style={{ fontSize: '13px', color: '#262F59', lineHeight: 1.2 }}>{displayName}</strong>
                                                        <span style={{ fontSize: '11px', color: '#727271', lineHeight: 1.2 }}>@{user.userName || user.email.split('@')[0]}</span>
                                                    </div>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : keyword.length > 2 && (
                                <p style={{ margin: 0, padding: '8px', fontSize: '12px', color: '#727271', textAlign: 'center' }}>Sonuç bulunamadı.</p>
                            )}
                        </div>
                    )}

                    {/* PROFIL AVATARI VE SIFIRLANMIŞ EŞİT MENÜ */}
                    <div className="d-none d-md-block ms-1" style={{ position: 'relative' }}>
                        {(() => {
                            const rawAvatar = localStorage.getItem('avatarUrl');
                            const hasValidAvatar = rawAvatar && rawAvatar !== 'null' && rawAvatar !== 'undefined' && rawAvatar.trim() !== '';
                            const avatarSrc = hasValidAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `http://localhost:5181${rawAvatar}`) : null;
                            
                            if (avatarSrc) {
                                return (
                                    <img
                                        src={avatarSrc}
                                        alt="Profil"
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mtu-primary)', cursor: 'pointer' }}
                                        title={headerDisplayName}
                                        onError={(e) => {
                                            console.error("HEADER AVATAR LOAD ERROR for src:", avatarSrc);
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex');
                                        }}
                                    />
                                );
                            }
                            return (
                                <div
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    title={headerDisplayName}
                                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--mtu-primary)', cursor: 'pointer', backgroundColor: '#e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden' }}
                                >
                                    <div style={{ width: '40%', height: '38%', borderRadius: '50%', backgroundColor: '#9ba5b0', marginTop: '8%' }} />
                                    <div style={{ width: '68%', height: '44%', borderRadius: '50% 50% 0 0', backgroundColor: '#9ba5b0', marginTop: '4%' }} />
                                </div>
                            );
                        })()}

                        {isProfileMenuOpen && (
                            <div className="custom-dropdown-menu">

                                {/* Profilim Butonu */}
                                <div
                                    className="dropdown-btn"
                                    onClick={() => {
                                        setIsProfileMenuOpen(false);
                                        navigate('/profile');
                                    }}
                                >
                                    <i className="feather-user"></i>
                                    <span>Profilim</span>
                                </div>

                                <div className="menu-divider"></div>

                                {/* Çıkış Yap Butonu */}
                                <div
                                    className="dropdown-btn logout"
                                    onClick={() => {
                                        setIsProfileMenuOpen(false);
                                        localStorage.clear();
                                        navigate('/login');
                                    }}
                                >
                                    <i className="feather-log-out"></i>
                                    <span>Çıkış Yap</span>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const iconBtnStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#f0f2f5',
    textDecoration: 'none',
    transition: 'all 0.2s',
};

export default Header;
