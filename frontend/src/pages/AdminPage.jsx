import React, { useState, useEffect } from 'react';
import { adminService, authService } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import MtuLogo from '../components/MtuLogo';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    
    // Logs filtering and pagination
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logActionFilter, setLogActionFilter] = useState('Tümü');
    const [logCurrentPage, setLogCurrentPage] = useState(1);
    const logsPerPage = 15;
    
    // New states for moderation
    // New states for moderation
    const [posts, setPosts] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [pendingGroups, setPendingGroups] = useState([]);
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [approvedGroups, setApprovedGroups] = useState([]);
    
    // Posts filtering
    const [postSearchTerm, setPostSearchTerm] = useState('');
    const [postRoleFilter, setPostRoleFilter] = useState('Tümü');
    
    // Approvals filtering and tabs
    const [approvalSearchTerm, setApprovalSearchTerm] = useState('');
    const [approvalTab, setApprovalTab] = useState('pending'); // 'pending' | 'approved'
    
    // Users filtering and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('Tümü');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    
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
                const ae = await adminService.getApprovedEvents();
                const ag = await adminService.getApprovedGroups();
                setPendingEvents(e);
                setPendingGroups(g);
                setApprovedEvents(ae);
                setApprovedGroups(ag);
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
            const approved = pendingEvents.find(e => e.id === id);
            if (approved) {
                setApprovedEvents([approved, ...approvedEvents]);
            }
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
            const approved = pendingGroups.find(g => g.id === id);
            if (approved) {
                setApprovedGroups([approved, ...approvedGroups]);
            }
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

    const handleDeleteLog = async (id) => {
        if (!window.confirm("Bu işlem kaydını silmek istediğinize emin misiniz?")) return;
        try {
            await adminService.deleteLog(id);
            setLogs(logs.filter(l => l.id !== id));
        } catch (e) { alert("Log silinemedi."); }
    };

    const handleLogout = async () => {
        const email = localStorage.getItem('email');
        if (email) {
            await authService.logout(email);
        }
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

    const renderUsers = () => {
        // Filtreleme
        let filteredUsers = users.filter(u => {
            const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchRole = roleFilter === 'Tümü' || u.role === roleFilter;
            
            let userStatus = 'Pasif';
            if (u.isActive && u.isApproved) userStatus = 'Aktif';
            else if (!u.isApproved) userStatus = 'Onay Bekliyor';

            const matchStatus = statusFilter === 'Tümü' || userStatus === statusFilter;
            
            return matchSearch && matchRole && matchStatus;
        });

        // Sayfalama
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        const indexOfLastUser = currentPage * usersPerPage;
        const indexOfFirstUser = indexOfLastUser - usersPerPage;
        const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

        const paginate = (pageNumber) => setCurrentPage(pageNumber);

        return (
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Sistem Kullanıcıları</h3>
                
                {/* Filtreleme Çubuğu */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <i className="feather-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                        <input 
                            type="text" 
                            placeholder="E-posta ile ara..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <select 
                        value={roleFilter} 
                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', minWidth: '140px' }}
                    >
                        <option value="Tümü">Tüm Roller</option>
                        <option value="Admin">Admin</option>
                        <option value="Öğrenci">Öğrenci</option>
                        <option value="Mezun">Mezun</option>
                        <option value="Akademisyen">Akademisyen</option>
                    </select>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', minWidth: '150px' }}
                    >
                        <option value="Tümü">Tüm Durumlar</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Pasif">Pasif</option>
                        <option value="Onay Bekliyor">Onay Bekliyor</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
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
                        {currentUsers.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Sonuç bulunamadı.</td></tr>
                        ) : currentUsers.map(u => (
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

                {/* Sayfalama Butonları */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => paginate(currentPage - 1)}
                            style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Önceki
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => paginate(i + 1)}
                                style={{ ...styles.pageBtn, backgroundColor: currentPage === i + 1 ? '#3b82f6' : 'transparent', color: currentPage === i + 1 ? '#fff' : '#94a3b8', border: currentPage === i + 1 ? '1px solid #3b82f6' : '1px solid #334155' }}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => paginate(currentPage + 1)}
                            style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Sonraki
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        let filteredPosts = posts.filter(p => {
            const searchContent = p.content?.toLowerCase() || '';
            const searchAuthor = p.author?.toLowerCase() || '';
            const searchEmail = p.authorEmail?.toLowerCase() || '';
            const term = postSearchTerm.toLowerCase();
            
            const matchSearch = searchContent.includes(term) || searchAuthor.includes(term) || searchEmail.includes(term);
            const matchRole = postRoleFilter === 'Tümü' || p.role === postRoleFilter;
            
            return matchSearch && matchRole;
        });

        return (
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Gönderi Denetimi</h3>
                
                {/* Content Filtering Bar */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <i className="feather-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                        <input 
                            type="text" 
                            placeholder="İçerik, yazar adı veya e-posta ile ara..." 
                            value={postSearchTerm}
                            onChange={(e) => setPostSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <select 
                        value={postRoleFilter} 
                        onChange={(e) => setPostRoleFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', minWidth: '140px' }}
                    >
                        <option value="Tümü">Tüm Roller</option>
                        <option value="Öğrenci">Öğrenci</option>
                        <option value="Mezun">Mezun</option>
                        <option value="Akademisyen">Akademisyen</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>

                {filteredPosts.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>Kriterlere uygun gönderi bulunamadı.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Yazar Bilgisi</th>
                                    <th style={styles.th}>İçerik Özeti</th>
                                    <th style={styles.th}>Tarih</th>
                                    <th style={styles.th}>Medya</th>
                                    <th style={styles.th}>Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map(post => (
                                    <tr key={post.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>{post.author}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{post.authorEmail}</div>
                                            <span style={{ ...styles.roleBadge, backgroundColor: post.role === 'Admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: post.role === 'Admin' ? '#c4b5fd' : '#93c5fd', fontSize: '10px', padding: '2px 8px' }}>
                                                {post.role || 'Bilinmiyor'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                {post.content || <span style={{color: '#64748b', fontStyle: 'italic'}}>İçerik yok (sadece medya olabilir)</span>}
                                            </p>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '13px' }}>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(post.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td style={styles.td}>
                                            {post.mediaCount > 0 ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                    <i className="feather-image"></i> {post.mediaCount}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#64748b', fontSize: '12px' }}>Yok</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <button onClick={() => handleDeletePost(post.id)} style={{ ...styles.actionBtn, backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="feather-trash-2"></i> Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderApprovals = () => {
        const term = approvalSearchTerm.toLowerCase();

        const filteredEvents = pendingEvents.filter(e => 
            (e.title?.toLowerCase().includes(term) || e.organizer?.toLowerCase().includes(term) || e.organizerEmail?.toLowerCase().includes(term))
        );
        const filteredGroups = pendingGroups.filter(g => 
            (g.name?.toLowerCase().includes(term) || g.creator?.toLowerCase().includes(term) || g.creatorEmail?.toLowerCase().includes(term))
        );
        const filteredApprovedEvents = approvedEvents.filter(e => 
            (e.title?.toLowerCase().includes(term) || e.organizer?.toLowerCase().includes(term) || e.organizerEmail?.toLowerCase().includes(term))
        );
        const filteredApprovedGroups = approvedGroups.filter(g => 
            (g.name?.toLowerCase().includes(term) || g.creator?.toLowerCase().includes(term) || g.creatorEmail?.toLowerCase().includes(term))
        );

        const EmptyState = ({ message, icon }) => (
            <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed #334155' }}>
                <i className={icon} style={{ fontSize: '32px', color: '#475569', marginBottom: '12px', display: 'block' }}></i>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>{message}</p>
            </div>
        );

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ ...styles.card, paddingBottom: '0' }}>
                    <h3 style={styles.sectionTitle}>Onay Yönetimi</h3>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <i className="feather-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                            <input 
                                type="text" 
                                placeholder="Etkinlik, grup adı veya kurucu ile ara..." 
                                value={approvalSearchTerm}
                                onChange={(e) => setApprovalSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                    
                    {/* Modern Segmented Control for Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #334155', gap: '24px' }}>
                        <button 
                            onClick={() => setApprovalTab('pending')}
                            style={{ background: 'none', border: 'none', padding: '12px 4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderBottom: approvalTab === 'pending' ? '2px solid #3b82f6' : '2px solid transparent', color: approvalTab === 'pending' ? '#fff' : '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            Bekleyen Onaylar
                            {(pendingEvents.length + pendingGroups.length) > 0 && (
                                <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '12px' }}>{pendingEvents.length + pendingGroups.length}</span>
                            )}
                        </button>
                        <button 
                            onClick={() => setApprovalTab('approved')}
                            style={{ background: 'none', border: 'none', padding: '12px 4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderBottom: approvalTab === 'approved' ? '2px solid #10b981' : '2px solid transparent', color: approvalTab === 'approved' ? '#fff' : '#94a3b8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            Geçmiş Onaylar
                        </button>
                    </div>
                </div>

                {approvalTab === 'pending' && (
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.sectionTitle}>Etkinlikler</h3>
                            {filteredEvents.length === 0 ? <EmptyState message="Bekleyen etkinlik onayı bulunmuyor." icon="feather-calendar" /> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Organizatör</th>
                                                <th style={styles.th}>Etkinlik Detayları</th>
                                                <th style={styles.th}>Tarih</th>
                                                <th style={styles.th}>Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEvents.map(e => (
                                                <tr key={e.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>{e.organizer}</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{e.organizerEmail}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 600, fontSize: '14px' }}>{e.title}</p>
                                                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {e.description || <span style={{color: '#64748b', fontStyle: 'italic'}}>Açıklama yok</span>}
                                                        </p>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{ fontSize: '13px' }}>{new Date(e.createdAt).toLocaleDateString('tr-TR')}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => handleApproveEvent(e.id)} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}><i className="feather-check"></i> Onayla</button>
                                                            <button onClick={() => handleDeleteEvent(e.id)} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}><i className="feather-x"></i> Reddet</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={styles.card}>
                            <h3 style={styles.sectionTitle}>Gruplar</h3>
                            {filteredGroups.length === 0 ? <EmptyState message="Bekleyen grup onayı bulunmuyor." icon="feather-users" /> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Kurucu</th>
                                                <th style={styles.th}>Grup Detayları</th>
                                                <th style={styles.th}>Tarih</th>
                                                <th style={styles.th}>Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredGroups.map(g => (
                                                <tr key={g.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>{g.creator}</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{g.creatorEmail}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 600, fontSize: '14px' }}>{g.name}</p>
                                                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {g.description || <span style={{color: '#64748b', fontStyle: 'italic'}}>Açıklama yok</span>}
                                                        </p>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{ fontSize: '13px' }}>{new Date(g.createdAt).toLocaleDateString('tr-TR')}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => handleApproveGroup(g.id)} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}><i className="feather-check"></i> Onayla</button>
                                                            <button onClick={() => handleDeleteGroup(g.id)} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}><i className="feather-x"></i> Reddet</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {approvalTab === 'approved' && (
                    <>
                        <div style={styles.card}>
                            <h3 style={styles.sectionTitle}>Onaylanan Etkinlikler</h3>
                            {filteredApprovedEvents.length === 0 ? <EmptyState message="Onaylanmış etkinlik bulunmuyor." icon="feather-calendar" /> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Organizatör</th>
                                                <th style={styles.th}>Etkinlik Detayları</th>
                                                <th style={styles.th}>Tarih</th>
                                                <th style={styles.th}>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApprovedEvents.map(e => (
                                                <tr key={e.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>{e.organizer}</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{e.organizerEmail}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 600, fontSize: '14px' }}>{e.title}</p>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{ fontSize: '13px' }}>{new Date(e.createdAt).toLocaleDateString('tr-TR')}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="feather-check-circle"></i> Onaylandı</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={styles.card}>
                            <h3 style={styles.sectionTitle}>Onaylanan Gruplar</h3>
                            {filteredApprovedGroups.length === 0 ? <EmptyState message="Onaylanmış grup bulunmuyor." icon="feather-users" /> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Kurucu</th>
                                                <th style={styles.th}>Grup Detayları</th>
                                                <th style={styles.th}>Tarih</th>
                                                <th style={styles.th}>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApprovedGroups.map(g => (
                                                <tr key={g.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>{g.creator}</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{g.creatorEmail}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 600, fontSize: '14px' }}>{g.name}</p>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{ fontSize: '13px' }}>{new Date(g.createdAt).toLocaleDateString('tr-TR')}</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="feather-check-circle"></i> Onaylandı</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderLogs = () => {
        // Dinamik filtre seçenekleri (Tüm olası işlemleri sabit olarak da ekleyelim)
        const ALL_POSSIBLE_ACTIONS = [
            'KULLANICI_ONAYLANDI', 'KULLANICI_PASIFE_ALINDI', 'KULLANICI_AKTIFLESTIRILDI',
            'ETKINLIK_ONAYLANDI', 'ETKINLIK_SILINDI',
            'GRUP_ONAYLANDI', 'GRUP_SILINDI',
            'GONDERI_SILINDI',
            'KAYIT_OLUNDU'
        ];
        const uniqueActions = ['Tümü', ...new Set([...ALL_POSSIBLE_ACTIONS, ...logs.map(log => log.action)])].filter(Boolean);

        // Filtreleme
        const filteredLogs = logs.filter(log => {
            const matchSearch = log.details?.toLowerCase().includes(logSearchTerm.toLowerCase()) || 
                                log.action?.toLowerCase().includes(logSearchTerm.toLowerCase());
            const matchAction = logActionFilter === 'Tümü' || log.action === logActionFilter;
            return matchSearch && matchAction;
        });

        // Sayfalama
        const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
        const indexOfLastLog = logCurrentPage * logsPerPage;
        const indexOfFirstLog = indexOfLastLog - logsPerPage;
        const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

        const paginate = (pageNumber) => setLogCurrentPage(pageNumber);

        // İkon eşleştirme (Aksiyon türüne göre)
        const getActionIcon = (action) => {
            if (action?.includes('USER') || action?.includes('KULLANICI')) return 'feather-user';
            if (action?.includes('POST') || action?.includes('GÖNDERİ')) return 'feather-file-text';
            if (action?.includes('EVENT') || action?.includes('ETKİNLİK')) return 'feather-calendar';
            if (action?.includes('GROUP') || action?.includes('GRUP')) return 'feather-users';
            if (action?.includes('LOGIN') || action?.includes('AUTH')) return 'feather-log-in';
            if (action?.includes('DELETE') || action?.includes('SİL')) return 'feather-trash-2';
            return 'feather-activity';
        };

        const getActionColor = (action) => {
            if (action?.includes('DEACTIVATED') || action?.includes('DELETE') || action?.includes('REJECT')) return '#ef4444'; // Red
            if (action?.includes('ACTIVATED') || action?.includes('APPROVE') || action?.includes('CREATE')) return '#10b981'; // Green
            if (action?.includes('UPDATE') || action?.includes('EDIT')) return '#f59e0b'; // Orange
            return '#3b82f6'; // Blue
        };

        return (
            <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>İşlem Geçmişi (Audit Logs)</h3>
                    <div style={{ fontSize: '13px', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px' }}>
                        Toplam <span style={{ color: '#fff', fontWeight: 'bold' }}>{filteredLogs.length}</span> kayıt
                    </div>
                </div>

                {/* Filtreleme Çubuğu */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <i className="feather-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                        <input 
                            type="text" 
                            placeholder="Detaylarda veya işlemlerde ara..." 
                            value={logSearchTerm}
                            onChange={(e) => { setLogSearchTerm(e.target.value); setLogCurrentPage(1); }}
                            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box', transition: 'all 0.3s' }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                    </div>
                    <div style={{ position: 'relative', minWidth: '180px' }}>
                        <i className="feather-filter" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}></i>
                        <select 
                            value={logActionFilter} 
                            onChange={(e) => { setLogActionFilter(e.target.value); setLogCurrentPage(1); }}
                            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontSize: '14px', appearance: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        >
                            {uniqueActions.map((action, idx) => (
                                <option key={idx} value={action}>{action}</option>
                            ))}
                        </select>
                        <i className="feather-chevron-down" style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8', pointerEvents: 'none' }}></i>
                    </div>
                </div>

                {currentLogs.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed #334155' }}>
                        <i className="feather-file-minus" style={{ fontSize: '32px', color: '#475569', marginBottom: '12px', display: 'block' }}></i>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Kriterlere uygun kayıt bulunamadı.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #1e293b' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#0f172a' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#1e293b' }}>
                                        <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid #334155' }}>İşlem Tipi</th>
                                        <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid #334155' }}>Detaylar</th>
                                        <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid #334155', width: '180px' }}>Tarih / Saat</th>
                                        <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', borderBottom: '1px solid #334155', width: '80px' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLogs.map((log, index) => {
                                        const actionColor = getActionColor(log.action);
                                        return (
                                            <tr key={log.id || index} style={{ borderBottom: '1px solid #1e293b', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                                    <span style={{ 
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                                        backgroundColor: `${actionColor}15`, color: actionColor, 
                                                        padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: `1px solid ${actionColor}30`
                                                    }}>
                                                        <i className={getActionIcon(log.action)}></i>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5', verticalAlign: 'middle' }}>
                                                    {log.details}
                                                </td>
                                                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ color: '#cbd5e1' }}><i className="feather-calendar" style={{ marginRight: '6px', fontSize: '12px' }}></i>{new Date(log.createdAt).toLocaleDateString('tr-TR')}</span>
                                                        <span><i className="feather-clock" style={{ marginRight: '6px', fontSize: '12px' }}></i>{new Date(log.createdAt).toLocaleTimeString('tr-TR')}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <button 
                                                        onClick={() => handleDeleteLog(log.id)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        title="Bu kaydı sil"
                                                    >
                                                        <i className="feather-trash-2" style={{ fontSize: '16px' }}></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Sayfalama Butonları */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>
                                    Sayfa {logCurrentPage} / {totalPages}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        disabled={logCurrentPage === 1}
                                        onClick={() => paginate(logCurrentPage - 1)}
                                        style={{ ...styles.pageBtn, opacity: logCurrentPage === 1 ? 0.5 : 1, cursor: logCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        <i className="feather-chevron-left"></i> Önceki
                                    </button>
                                    
                                    <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
                                        {[...Array(totalPages)].map((_, i) => {
                                            if (i === 0 || i === totalPages - 1 || (i >= logCurrentPage - 2 && i <= logCurrentPage)) {
                                                return (
                                                    <button 
                                                        key={i}
                                                        onClick={() => paginate(i + 1)}
                                                        style={{ 
                                                            ...styles.pageBtn, 
                                                            backgroundColor: logCurrentPage === i + 1 ? '#3b82f6' : 'transparent', 
                                                            color: logCurrentPage === i + 1 ? '#fff' : '#94a3b8', 
                                                            border: logCurrentPage === i + 1 ? '1px solid #3b82f6' : '1px solid #334155',
                                                            minWidth: '36px',
                                                            padding: '6px'
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                )
                                            }
                                            if (i === 1 && logCurrentPage > 3) return <span key={i} style={{ color: '#64748b', padding: '6px' }}>...</span>;
                                            if (i === totalPages - 2 && logCurrentPage < totalPages - 2) return <span key={i} style={{ color: '#64748b', padding: '6px' }}>...</span>;
                                            return null;
                                        })}
                                    </div>

                                    <button 
                                        disabled={logCurrentPage === totalPages}
                                        onClick={() => paginate(logCurrentPage + 1)}
                                        style={{ ...styles.pageBtn, opacity: logCurrentPage === totalPages ? 0.5 : 1, cursor: logCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                    >
                                        Sonraki <i className="feather-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={styles.layout}>
            {/* Admin Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <MtuLogo height={40} lightText={true} />
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
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    roleBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    actionBtn: { border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'opacity 0.2s' },
    pageBtn: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
    
    // Content Moderation
    contentItem: { padding: '20px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' },
    deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, transition: 'all 0.2s' }
};
