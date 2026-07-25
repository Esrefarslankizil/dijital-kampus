import React from 'react';
import { Link } from 'react-router-dom';

const LeftSidebar = ({ userEmail, userRole, stats, activeMenu = 'feed' }) => {
    const navItems = [
        { id: 'feed', icon: 'feather-home', label: 'Ana Akış', path: '/feed' },
        { id: 'badges', icon: 'feather-award', label: 'Rozetler', path: '/badges' },
        { id: 'events', icon: 'feather-calendar', label: 'Etkinlikler', path: '/events' },
        { id: 'groups', icon: 'feather-users', label: 'Gruplar', path: '/groups' },
    ];

    return (
        <aside style={styles.leftSidebar}>
            <div style={styles.profileCard}>
                <div style={styles.profileBanner}></div>
                <div style={styles.profileAvatarWrap}>
                    <img src="/images/user-7.png" alt="profil" style={styles.profileAvatar} />
                </div>
                <div style={{ textAlign: 'center', padding: '8px 16px 16px' }}>
                    <p style={styles.profileName}>{userEmail.split('@')[0]}</p>
                    <span style={styles.profileRole}>{userRole}</span>
                    <div style={styles.profileStats}>
                        <div style={styles.stat}><strong style={{ color: '#006F79' }}>{stats?.followers || 0}</strong><br /><small>Takipçi</small></div>
                        <div style={styles.statDivider}></div>
                        <div style={styles.stat}><strong style={{ color: '#006F79' }}>{stats?.following || 0}</strong><br /><small>Takip</small></div>
                        <div style={styles.statDivider}></div>
                        <div style={styles.stat}><strong style={{ color: '#006F79' }}>{stats?.posts || 0}</strong><br /><small>Gönderi</small></div>
                    </div>
                </div>
            </div>
            <div style={styles.navCard}>
                <p style={styles.navCaption}>ANA MENÜ</p>
                {navItems.map((item) => (
                    <Link key={item.id} to={item.path} style={{ ...styles.navItem, ...(activeMenu === item.id ? styles.navItemActive : {}) }}>
                        <i className={item.icon} style={{ ...styles.navIcon, ...(activeMenu === item.id ? { color: '#006F79' } : {}) }}></i>
                        <span>{item.label}</span>
                        {activeMenu === item.id && <span style={styles.navDot}></span>}
                    </Link>
                ))}
                {userRole === 'Admin' && (
                    <Link to="/admin" style={{...styles.navItem, marginTop: '8px', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c'}}>
                        <i className="feather-shield" style={{...styles.navIcon, color: '#e74c3c'}}></i><span style={{fontWeight: 700}}>Yönetici Paneli</span>
                    </Link>
                )}
                <div style={{ borderTop: '1px solid #f0f2f5', margin: '8px 0' }}></div>
                <Link to="/login" style={styles.navItem} onClick={() => localStorage.clear()}>
                    <i className="feather-log-out" style={{ ...styles.navIcon, color: '#e74c3c' }}></i>
                    <span style={{ color: '#e74c3c' }}>Çıkış Yap</span>
                </Link>
            </div>

            <div style={{ ...styles.navCard, marginTop: '12px' }}>
                <p style={styles.navCaption}>KISAYOLLAR</p>
                <a href="https://kutuphane.ozal.edu.tr/" target="_blank" rel="noopener noreferrer" style={styles.shortcutItem}>
                    <div style={{ ...styles.shortcutIconWrap, backgroundColor: 'rgba(39,174,96,0.1)', color: '#27ae60' }}><i className="feather-book-open"></i></div>
                    <span style={styles.shortcutText}>Kütüphane Sistemi</span>
                </a>
                <a href="https://sks.ozal.edu.tr/yemek-menusu/" target="_blank" rel="noopener noreferrer" style={styles.shortcutItem}>
                    <div style={{ ...styles.shortcutIconWrap, backgroundColor: 'rgba(214,163,39,0.1)', color: '#D6A327' }}><i className="feather-coffee"></i></div>
                    <span style={styles.shortcutText}>Yemekhane Menüsü</span>
                </a>
                <a href="https://obs.ozal.edu.tr/" target="_blank" rel="noopener noreferrer" style={styles.shortcutItem}>
                    <div style={{ ...styles.shortcutIconWrap, backgroundColor: 'rgba(0,111,121,0.1)', color: '#006F79' }}><i className="feather-file-text"></i></div>
                    <span style={styles.shortcutText}>Öğrenci İşleri (OBS)</span>
                </a>
                <a href="#" style={styles.shortcutItem}>
                    <div style={{ ...styles.shortcutIconWrap, backgroundColor: 'rgba(142,68,173,0.1)', color: '#8e44ad' }}><i className="feather-headphones"></i></div>
                    <span style={styles.shortcutText}>IT Destek Masası</span>
                </a>
            </div>
        </aside>
    );
};

const styles = {
    leftSidebar: { width: '260px', flexShrink: 0, position: 'sticky', top: '80px' },
    profileCard: { backgroundColor: '#fff', borderRadius: '16px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    profileBanner: { height: '60px', background: 'linear-gradient(135deg, #006F79 0%, var(--mtu-primary-hover) 100%)' },
    profileAvatarWrap: { display: 'flex', justifyContent: 'center', marginTop: '-24px' },
    profileAvatar: { width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    profileName: { margin: '8px 0 2px', fontWeight: 700, fontSize: '14px', color: '#1a1a2e' },
    profileRole: { fontSize: '11px', color: '#006F79', backgroundColor: 'rgba(0,111,121,0.08)', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 },
    profileStats: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f2f5' },
    stat: { textAlign: 'center', fontSize: '11px', color: '#888' },
    statDivider: { width: '1px', height: '30px', backgroundColor: '#f0f2f5' },
    navCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '12px 8px', boxShadow: '0 4px 20px rgba(0,111,121,0.08)' },
    navCaption: { fontSize: '11px', fontWeight: 800, color: '#888', letterSpacing: '1px', padding: '4px 12px 12px', margin: 0 },
    navItem: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', color: '#555', textDecoration: 'none', fontSize: '13.5px', fontWeight: 600, transition: 'all 0.15s' },
    navItemActive: { backgroundColor: 'rgba(0,111,121,0.08)', color: '#006F79', fontWeight: 700 },
    navIcon: { width: '20px', marginRight: '12px', fontSize: '18px', color: '#999' },
    navDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006F79', marginLeft: 'auto' },
    shortcutItem: { display: 'flex', alignItems: 'center', padding: '8px 12px', textDecoration: 'none', transition: 'all 0.2s', borderRadius: '10px' },
    shortcutIconWrap: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '14px' },
    shortcutText: { fontSize: '13px', color: '#444', fontWeight: 600 }
};

export default LeftSidebar;
