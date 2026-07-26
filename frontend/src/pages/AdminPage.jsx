import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import MtuLogo from '../components/MtuLogo';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    
    // New states for moderation
    const [posts, setPosts] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [pendingGroups, setPendingGroups] = useState([]);
    
    const navigate = useNavigate();

    const userEmail = localStorage.getItem('email') || 'admin@kampus.com';
    const userRole = localStorage.getItem('role') || 'Admin';

    useEffect(() => {
        // If not admin, redirect
        if (userRole !== 'Admin') {
            navigate('/feed');
        }
    }, [userRole, navigate]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            if (activeTab === 'dashboard') {
                const s = await adminService.getStats();
                setStats(s);
            } else if (activeTab === 'users') {
                const u = await adminService.getUsers();
                setUsers(u);
            } else if (activeTab === 'content') {
                const p = await adminService.getPosts();
                setPosts(p);
            } else if (activeTab === 'approvals') {
                const e = await adminService.getPendingEvents();
                const g = await adminService.getPendingGroups();
                setPendingEvents(e);
                setPendingGroups(g);
            } else if (activeTab === 'logs') {
                const l = await adminService.getAuditLogs();
                setLogs(l);
            }
        } catch (e) {
            console.error("Veri yüklenemedi:", e);
        }
    };

    // User Actions
    const handleToggleStatus = async (userId, action) => {
        if (!window.confirm(`Kullanıcı için ${action} işlemi yapılsın mı?`)) return;
        try {
            await adminService.toggleUserStatus(userId, action);
            loadData(); // Yenile
        } catch (e) {
            alert("İşlem başarısız!");
        }
    };

    // Content Actions
    const handleDeletePost = async (id) => {
        if (!window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
        try {
            await adminService.deletePost(id);
            setPosts(posts.filter(p => p.id !== id));
        } catch (e) {
            alert("Gönderi silinemedi.");
        }
    };

    // Approval Actions
    const handleApproveEvent = async (id) => {
        try {
            await adminService.approveEvent(id);
            setPendingEvents(pendingEvents.filter(e => e.id !== id));
        } catch (e) { alert("Etkinlik onaylanamadı."); }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Bu etkinliği silmek/reddetmek istediğinize emin misiniz?")) return;
        try {
            await adminService.deleteEvent(id);
            setPendingEvents(pendingEvents.filter(e => e.id !== id));
        } catch (e) { alert("Etkinlik reddedilemedi."); }
    };

    const handleApproveGroup = async (id) => {
        try {
            await adminService.approveGroup(id);
            setPendingGroups(pendingGroups.filter(g => g.id !== id));
        } catch (e) { alert("Grup onaylanamadı."); }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("Bu grubu silmek/reddetmek istediğinize emin misiniz?")) return;
        try {
            await adminService.deleteGroup(id);
            setPendingGroups(pendingGroups.filter(g => g.id !== id));
        } catch (e) { alert("Grup reddedilemedi."); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        navigate('/login');
    };

    const COLORS = ['#10b981', '#ef4444']; // Green for active, Red for inactive

    const renderDashboard = () => {
        if (!stats) return <p style={{ color: '#fff' }}>Yükleniyor...</p>;

        const pieData = [
            { name: 'Aktif Kullanıcı', value: stats.activeUsers },
            { name: 'Pasif/Onaysız', value: stats.totalUsers - stats.activeUsers }
        ];

        return (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={styles.metricCard}>
                    <h3 style={styles.metricTitle}>Toplam Kullanıcı</h3>
                    <p style={styles.metricValue}>{stats.totalUsers}</p>
                </div>
                <div style={styles.metricCard}>
                    <h3 style={styles.metricTitle}>Toplam Gönderi</h3>
                    <p style={styles.metricValue}>{stats.totalPosts}</p>
                </div>
                <div style={styles.metricCard}>
                    <h3 style={styles.metricTitle}>Toplam Hikaye</h3>
                    <p style={styles.metricValue}>{stats.totalStories}</p>
                </div>

                <div style={{ ...styles.card, width: '100%', height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h4 style={{ color: '#fff', marginBottom: '20px' }}>Sistemdeki Kullanıcı Durumu</h4>
                    <div style={{ width: '100%', height: '80%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsers = () => (
        <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Sistem Kullanıcıları</h3>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>E-posta</th>
                        <th style={styles.th}>Rol</th>
                        <th style={styles.th}>Kayıt Tarihi</th>
                        <th style={styles.th}>Durum</th>
                        <th style={styles.th}>Aksiyon</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={styles.tr}>
                            <td style={styles.td}>{u.id}</td>
                            <td style={styles.td}>{u.email}</td>
                            <td style={styles.td}>
                                <span style={{ ...styles.roleBadge, backgroundColor: u.role === 'Admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: u.role === 'Admin' ? '#c4b5fd' : '#93c5fd' }}>
                                    {u.role}
                                </span>
                            </td>
                            <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                            <td style={styles.td}>
                                {u.isActive && u.isApproved ? (
                                    <span style={{ ...styles.statusBadge, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>Aktif</span>
                                ) : !u.isApproved ? (
                                    <span style={{ ...styles.statusBadge, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' }}>Onay Bekliyor</span>
                                ) : (
                                    <span style={{ ...styles.statusBadge, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>Pasif</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                {!u.isApproved && (
                                    <button onClick={() => handleToggleStatus(u.id, 'APPROVE')} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}>Onayla</button>
                                )}
                                {u.isActive && u.isApproved && u.role !== 'Admin' && (
                                    <button onClick={() => handleToggleStatus(u.id, 'DEACTIVATE')} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}>Dondur</button>
                                )}
                                {!u.isActive && u.isApproved && (
                                    <button onClick={() => handleToggleStatus(u.id, 'ACTIVATE')} style={{ ...styles.actionBtn, backgroundColor: '#3b82f6' }}>Aktifleştir</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderContent = () => (
        <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Gönderi Denetimi</h3>
            {posts.length === 0 ? <p style={{ color: '#94a3b8' }}>Hiç gönderi yok.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {posts.map(post => (
                        <div key={post.id} style={styles.contentItem}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{post.author}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(post.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{post.content}</p>
                            </div>
                            <button onClick={() => handleDeletePost(post.id)} style={styles.deleteBtn}>
                                <i className="feather-trash-2"></i> Sil
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderApprovals = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Onay Bekleyen Etkinlikler</h3>
                {pendingEvents.length === 0 ? <p style={{ color: '#94a3b8' }}>Bekleyen etkinlik yok.</p> : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Başlık</th>
                                <th style={styles.th}>Organizatör</th>
                                <th style={styles.th}>Tarih</th>
                                <th style={styles.th}>Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingEvents.map(e => (
                                <tr key={e.id} style={styles.tr}>
                                    <td style={styles.td}>{e.title}</td>
                                    <td style={styles.td}>{e.organizer}</td>
                                    <td style={styles.td}>{new Date(e.createdAt).toLocaleDateString('tr-TR')}</td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleApproveEvent(e.id)} style={{ ...styles.actionBtn, backgroundColor: '#10b981', marginRight: '8px' }}>Onayla</button>
                                        <button onClick={() => handleDeleteEvent(e.id)} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}>Reddet</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Onay Bekleyen Gruplar</h3>
                {pendingGroups.length === 0 ? <p style={{ color: '#94a3b8' }}>Bekleyen grup yok.</p> : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Grup Adı</th>
                                <th style={styles.th}>Kurucu</th>
                                <th style={styles.th}>Tarih</th>
                                <th style={styles.th}>Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingGroups.map(g => (
                                <tr key={g.id} style={styles.tr}>
                                    <td style={styles.td}>{g.name}</td>
                                    <td style={styles.td}>{g.creator}</td>
                                    <td style={styles.td}>{new Date(g.createdAt).toLocaleDateString('tr-TR')}</td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleApproveGroup(g.id)} style={{ ...styles.actionBtn, backgroundColor: '#10b981', marginRight: '8px' }}>Onayla</button>
                                        <button onClick={() => handleDeleteGroup(g.id)} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}>Reddet</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderLogs = () => (
        <div style={styles.card}>
            <h3 style={styles.sectionTitle}>İşlem Geçmişi (Audit Logs)</h3>
            {logs.length === 0 ? <p style={{ color: '#94a3b8' }}>Kayıt bulunamadı.</p> : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {logs.map(log => (
                        <li key={log.id} style={{ padding: '16px 0', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#38bdf8', marginRight: '12px' }}>[{log.action}]</span>
                                <span style={{ color: '#e2e8f0' }}>{log.details}</span>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                {new Date(log.createdAt).toLocaleString('tr-TR')}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div style={styles.layout}>
            {/* Admin Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <MtuLogo height={40} />
                    <h2 style={{ color: '#fff', fontSize: '18px', margin: '16px 0 0', fontWeight: '700' }}>Admin Portal</h2>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{userEmail}</p>
                </div>

                <nav style={styles.nav}>
                    <button style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab('dashboard')}>
                        <i className="feather-pie-chart" style={styles.navIcon}></i> Genel Bakış
                    </button>
                    <button style={activeTab === 'users' ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab('users')}>
                        <i className="feather-users" style={styles.navIcon}></i> Kullanıcılar
                    </button>
                    <button style={activeTab === 'content' ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab('content')}>
                        <i className="feather-file-text" style={styles.navIcon}></i> İçerik Denetimi
                    </button>
                    <button style={activeTab === 'approvals' ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab('approvals')}>
                        <i className="feather-check-circle" style={styles.navIcon}></i> Bekleyen Onaylar
                        {(pendingEvents.length + pendingGroups.length) > 0 && (
                            <span style={styles.badgeCount}>{pendingEvents.length + pendingGroups.length}</span>
                        )}
                    </button>
                    <button style={activeTab === 'logs' ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab('logs')}>
                        <i className="feather-activity" style={styles.navIcon}></i> İşlem Geçmişi
                    </button>
                </nav>

                <div style={{ marginTop: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button onClick={() => navigate('/feed')} style={styles.backBtn}>
                        <i className="feather-home" style={{ marginRight: '8px' }}></i> Siteye Dön
                    </button>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <i className="feather-log-out" style={{ marginRight: '8px' }}></i> Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Admin Main Content */}
            <main style={styles.main}>
                <header style={styles.header}>
                    <h1 style={styles.pageTitle}>
                        {activeTab === 'dashboard' && 'Genel Bakış'}
                        {activeTab === 'users' && 'Kullanıcı Yönetimi'}
                        {activeTab === 'content' && 'İçerik Denetimi'}
                        {activeTab === 'approvals' && 'Bekleyen Onaylar'}
                        {activeTab === 'logs' && 'İşlem Geçmişi'}
                    </h1>
                </header>

                <div style={styles.contentArea}>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'content' && renderContent()}
                    {activeTab === 'approvals' && renderApprovals()}
                    {activeTab === 'logs' && renderLogs()}
                </div>
            </main>
        </div>
    );
}

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: '280px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    sidebarHeader: { padding: '32px 24px', borderBottom: '1px solid #334155' },
    nav: { padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
    navBtn: { display: 'flex', alignItems: 'center', width: '100%', padding: '12px 16px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', color: '#94a3b8', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' },
    navBtnActive: { display: 'flex', alignItems: 'center', width: '100%', padding: '12px 16px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' },
    navIcon: { fontSize: '18px', marginRight: '12px', width: '20px', textAlign: 'center' },
    badgeCount: { marginLeft: 'auto', backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' },
    logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
    backBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { padding: '32px 48px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a' },
    pageTitle: { margin: 0, color: '#f8fafc', fontSize: '24px', fontWeight: '700' },
    contentArea: { padding: '48px', overflowY: 'auto', flex: 1 },
    
    // UI Elements
    card: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', overflowX: 'auto', border: '1px solid #334155' },
    sectionTitle: { margin: '0 0 24px', color: '#f8fafc', fontSize: '18px', fontWeight: '600' },
    metricCard: { flex: '1 1 200px', backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    metricTitle: { margin: '0 0 12px', color: '#94a3b8', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' },
    metricValue: { margin: 0, color: '#f8fafc', fontSize: '40px', fontWeight: '800' },
    
    // Tables
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px 12px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #334155' },
    td: { padding: '16px 12px', fontSize: '14px', color: '#e2e8f0', borderBottom: '1px solid #1e293b' },
    tr: { transition: 'background-color 0.2s' },
    
    // Badges & Buttons
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    roleBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    actionBtn: { border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'opacity 0.2s' },
    
    // Content Moderation
    contentItem: { padding: '20px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' },
    deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, transition: 'all 0.2s' }
};
