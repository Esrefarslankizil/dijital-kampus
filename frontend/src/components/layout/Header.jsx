import React from 'react';
import MtuLogo from '../MtuLogo';

function Header({ onOpenLogin, onOpenRegister }) {
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
