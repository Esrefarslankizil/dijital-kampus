import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MtuLogo from '../MtuLogo';

function Header({ onOpenLogin, onOpenRegister }) {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [showRightSearch, setShowRightSearch] = useState(false);

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
    <div className="nav-header bg-white shadow-xs border-0" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: '60px' }}>
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
                                            {user.avatarUrl ? (
                                                <img src={`http://localhost:5181${user.avatarUrl}`} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
                                            ) : (
                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #006F79, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 14, flexShrink: 0 }}>
                                                    {initial}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <strong style={{ fontSize: '13.5px', color: '#1a1a2e', marginBottom: '2px', lineHeight: 1.2 }}>{displayName}</strong> 
                                                <span style={{ fontSize: '12px', color: '#888', lineHeight: 1.2 }}>@{user.userName || user.email.split('@')[0]}</span>
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
                <Link to="/feed" className="d-none d-md-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-home" style={{ fontSize: '18px', color: 'var(--mtu-primary)' }}></i>
                </Link>
                <Link to="/messages" className="d-none d-md-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-message-circle" style={{ fontSize: '18px', color: '#555' }}></i>
                </Link>
                <a href="#" className="d-none d-md-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-video" style={{ fontSize: '18px', color: '#555' }}></i>
                </a>
                <a href="#" className="d-none d-md-flex align-items-center justify-content-center position-relative" style={iconBtnStyle}>
                    <i className="feather-bell" style={{ fontSize: '18px', color: '#555' }}></i>
                    <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--mtu-secondary)' }}></span>
                </a>
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
                                    border: '1.5px solid #006F79', 
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
                                                {user.avatarUrl ? (
                                                    <img src={`http://localhost:5181${user.avatarUrl}`} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #006F79, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 13, flexShrink: 0 }}>
                                                        {initial}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <strong style={{ fontSize: '13px', color: '#1a1a2e', lineHeight: 1.2 }}>{displayName}</strong> 
                                                    <span style={{ fontSize: '11px', color: '#888', lineHeight: 1.2 }}>@{user.userName || user.email.split('@')[0]}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : keyword.length > 2 && (
                            <p style={{ margin: 0, padding: '8px', fontSize: '12px', color: '#888', textAlign: 'center' }}>Sonuç bulunamadı.</p>
                        )}
                    </div>
                )}

                <div className="d-none d-md-block ms-1">
                    <img src="/images/user-7.png" alt="profil" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mtu-primary)', cursor: 'pointer' }} />
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
    transition: 'background 0.15s',
};

export default Header;
