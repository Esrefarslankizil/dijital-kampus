import React from 'react';

function MtuLogo({ height = 48, className = "", showText = true, lightText = false }) {
    return (
        <div className={`d-flex align-items-center ${className}`} style={{ height: `${height}px` }}>
            <img 
                src="/images/mtu-logo.jpg" 
                alt="Malatya Turgut Özal Üniversitesi" 
                style={{ 
                    height: `${height}px`, 
                    width: `${height}px`, 
                    objectFit: 'contain',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(12, 35, 64, 0.15)',
                    flexShrink: 0,
                }} 
            />
            {showText && (
                <div className="ms-2" style={{ whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    <span style={{ 
                        display: 'block',
                        fontWeight: 800, 
                        fontSize: '13px', 
                        color: lightText ? '#ffffff' : '#1a1a2e', 
                        letterSpacing: '0.3px',
                    }}>
                        MALATYA TURGUT ÖZAL
                    </span>
                    <span style={{ 
                        display: 'block',
                        fontWeight: 700, 
                        fontSize: '10px', 
                        color: lightText ? '#e2e8f0' : 'var(--mtu-primary)', 
                        letterSpacing: '2.5px',
                    }}>
                        ÜNİVERSİTESİ
                    </span>
                </div>
            )}
        </div>
    );
}

export default MtuLogo;
