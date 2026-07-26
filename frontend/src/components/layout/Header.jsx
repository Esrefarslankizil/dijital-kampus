import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Link yerine navigate kullanıyoruz ki CSS çakmasın
import MtuLogo from '../MtuLogo';

function Header({ onOpenLogin, onOpenRegister }) {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); 
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        const val = e.target.value;
        setKeyword(val);
        if (val.length > 2) {
            try {
                const response = await fetch(`http://localhost:5181/api/Follow/search?keyword=${val}`);
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
                            zIndex: 1000
                        }}>
                            {results.map(user => (
                                <li key={user.id} style={{ padding: '10px 8px', borderBottom: '1px solid #f0f2f5', display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: '13px', color: '#1a1a2e' }}>{user.firstName} {user.lastName}</strong> 
                                    <span style={{ fontSize: '11px', color: '#888' }}>{user.email}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Sağ Simgeler */}
            <div className="d-flex align-items-center ms-auto" style={{ gap: '6px' }}>
                <a href="#" className="d-none d-md-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-home" style={{ fontSize: '18px', color: 'var(--mtu-primary)' }}></i>
                </a>
                <a href="#" className="d-none d-md-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-message-circle" style={{ fontSize: '18px', color: '#555' }}></i>
                </a>
                <a href="#" className="d-none d-md-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-video" style={{ fontSize: '18px', color: '#555' }}></i>
                </a>
                <a href="#" className="d-none d-md-flex align-items-center justify-content-center position-relative" style={iconBtnStyle}>
                    <i className="feather-bell" style={{ fontSize: '18px', color: '#555' }}></i>
                    <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--mtu-secondary)' }}></span>
                </a>
                <a href="#" className="d-flex align-items-center justify-content-center" style={iconBtnStyle}>
                    <i className="feather-search d-lg-none" style={{ fontSize: '18px', color: '#555' }}></i>
                </a>
                
                {/* PROFIL AVATARI VE SIFIRLANMIŞ EŞİT MENÜ */}
                <div className="d-none d-md-block ms-1" style={{ position: 'relative' }}>
                    <img 
                        src="/images/user-7.png" 
                        alt="profil" 
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mtu-primary)', cursor: 'pointer' }} 
                    />
                    
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
                                    // Çıkış mantığı buraya gelecek
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