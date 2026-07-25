import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import LeftSidebar from '../components/layout/LeftSidebar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    
    const userEmail = localStorage.getItem('email') || 'admin@kampus.com';
    const userRole = localStorage.getItem('role') || 'Admin';

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
            } else if (activeTab === 'logs') {
                const l = await adminService.getAuditLogs();
                setLogs(l);
            }
        } catch (e) {
            console.error("Veri yüklenemedi:", e);
        }
    };

    const handleToggleStatus = async (userId, action) => {
        try {
            await adminService.toggleUserStatus(userId, action);
            loadData(); // Yenile
        } catch (e) {
            alert("İşlem başarısız!");
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const renderDashboard = () => {
        if (!stats) return <p>Yükleniyor...</p>;

        const pieData = [
            { name: 'Aktif Kullanıcı', value: stats.activeUsers },
            { name: 'Pasif/Onaysız', value: stats.totalUsers - stats.activeUsers }
        ];

        return (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ ...styles.card, flex: '1 1 200px' }}>
                    <h3 style={{ margin: '0 0 10px', color: '#006F79' }}>Toplam Kullanıcı</h3>
                    <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>{stats.totalUsers}</p>
                </div>
                <div style={{ ...styles.card, flex: '1 1 200px' }}>
                    <h3 style={{ margin: '0 0 10px', color: '#006F79' }}>Toplam Gönderi</h3>
                    <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>{stats.totalPosts}</p>
                </div>
                <div style={{ ...styles.card, flex: '1 1 200px' }}>
                    <h3 style={{ margin: '0 0 10px', color: '#006F79' }}>Toplam Hikaye</h3>
                    <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>{stats.totalStories}</p>
                </div>

                <div style={{ ...styles.card, width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '50%', height: '100%' }}>
                        <h4 style={{ textAlign: 'center', color: '#333' }}>Kullanıcı Durumu</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsers = () => (
        <div style={styles.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>E-posta</th>
                        <th style={styles.th}>Rol</th>
                        <th style={styles.th}>Durum</th>
                        <th style={styles.th}>Aksiyon</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={styles.td}>{u.id}</td>
                            <td style={styles.td}>{u.email}</td>
                            <td style={styles.td}>{u.role}</td>
                            <td style={styles.td}>
                                {u.isActive && u.isApproved ? (
                                    <span style={{ ...styles.badge, backgroundColor: '#d4edda', color: '#155724' }}>Aktif</span>
                                ) : !u.isApproved ? (
                                    <span style={{ ...styles.badge, backgroundColor: '#fff3cd', color: '#856404' }}>Onay Bekliyor</span>
                                ) : (
                                    <span style={{ ...styles.badge, backgroundColor: '#f8d7da', color: '#721c24' }}>Pasif</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                {!u.isApproved && (
                                    <button onClick={() => handleToggleStatus(u.id, 'APPROVE')} style={{ ...styles.actionBtn, backgroundColor: '#28a745' }}>Onayla</button>
                                )}
                                {u.isActive && u.isApproved && (
                                    <button onClick={() => handleToggleStatus(u.id, 'DEACTIVATE')} style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }}>Pasife Al</button>
                                )}
                                {!u.isActive && u.isApproved && (
                                    <button onClick={() => handleToggleStatus(u.id, 'ACTIVATE')} style={{ ...styles.actionBtn, backgroundColor: '#17a2b8' }}>Aktifleştir</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderLogs = () => (
        <div style={styles.card}>
            {logs.length === 0 ? <p>Kayıt bulunamadı.</p> : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {logs.map(log => (
                        <li key={log.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#006F79', marginRight: '8px' }}>[{log.action}]</span>
                                {log.details}
                            </div>
                            <div style={{ color: '#888', fontSize: '12px' }}>
                                {new Date(log.createdAt).toLocaleString('tr-TR')}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div style={styles.page}>
            <LeftSidebar userEmail={userEmail} userRole={userRole} stats={{ followers: 0, following: 0, posts: 0 }} />
            <main style={styles.mainArea}>
                <div style={styles.headerCard}>
                    <h2 style={{ margin: 0, color: '#006F79', display: 'flex', alignItems: 'center' }}>
                        <i className="feather-shield" style={{ marginRight: '10px' }}></i>
                        Yönetici Paneli
                    </h2>
                </div>

                <div style={styles.tabs}>
                    <button style={activeTab === 'dashboard' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('dashboard')}>İstatistikler</button>
                    <button style={activeTab === 'users' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('users')}>Kullanıcı Yönetimi</button>
                    <button style={activeTab === 'logs' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('logs')}>İşlem Geçmişi (Audit Logs)</button>
                </div>

                <div style={{ transition: 'opacity 0.3s ease-in-out' }}>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'logs' && renderLogs()}
                </div>
            </main>
        </div>
    );
}

const styles = {
    page: { display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px', minHeight: '100vh', backgroundColor: '#f0f2f5', alignItems: 'flex-start' },
    mainArea: { flex: 1, minWidth: 0, maxWidth: '900px', margin: '0 auto' },
    headerCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: { padding: '12px 24px', backgroundColor: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#555', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
    activeTab: { padding: '12px 24px', backgroundColor: '#006F79', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(0,111,121,0.3)' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowX: 'auto' },
    th: { padding: '12px 8px', color: '#888', fontSize: '13px' },
    td: { padding: '12px 8px', fontSize: '14px', color: '#333' },
    badge: { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 },
    actionBtn: { border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '4px' }
};
