import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import MtuLogo from '../components/MtuLogo';

// --- Premium Inline Styles ---
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '900px',
        padding: '60px 40px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    title: {
        fontSize: '32px',
        fontWeight: '800',
        color: '#111827',
        letterSpacing: '-0.5px',
        marginBottom: '12px',
        textAlign: 'left'
    },
    subtitle: {
        fontSize: '16px',
        color: '#727271',
        marginBottom: '40px',
        lineHeight: '1.5',
        textAlign: 'left'
    },
    roleTile: {
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '32px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
    },
    roleIcon: {
        fontSize: '32px',
        marginBottom: '16px',
        color: '#374151'
    },
    roleTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '8px'
    },
    roleDesc: {
        fontSize: '13px',
        color: '#727271',
        textAlign: 'center',
        lineHeight: '1.4'
    },
    inputContainer: {
        position: 'relative',
        marginBottom: '32px'
    },
    inputLabel: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#727271',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    minimalInput: {
        width: '100%',
        border: 'none',
        borderBottom: '2px solid #e5e7eb',
        borderRadius: '0',
        padding: '8px 0 12px 0',
        fontSize: '16px',
        color: '#111827',
        backgroundColor: 'transparent',
        outline: 'none',
        transition: 'border-color 0.2s ease'
    },
    submitBtn: {
        backgroundColor: '#262F59',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 32px',
        fontSize: '16px',
        fontWeight: '600',
        width: '100%',
        cursor: 'pointer',
        transition: 'transform 0.1s ease, background-color 0.2s ease',
        boxShadow: '0 4px 12px rgba(38, 47, 89, 0.3)'
    },
    backBtn: {
        background: 'transparent',
        border: '1px solid #e5e7eb',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        marginRight: '16px',
        color: '#727271',
        transition: 'all 0.2s ease'
    }
};

const handleFocus = (e) => { e.target.style.borderBottom = '2px solid #262F59'; };
const handleBlur = (e) => { e.target.style.borderBottom = '2px solid #e5e7eb'; };

const InputField = ({ label, name, value, onChange, type = "text", placeholder }) => (
    <div style={styles.inputContainer} className="col-md-6">
        <label style={styles.inputLabel}>{label}</label>
        <input 
            type={type} 
            name={name} 
            value={value} 
            onChange={onChange} 
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={styles.minimalInput} 
            placeholder={placeholder}
            required 
        />
    </div>
);

function OnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const googleToken = location.state?.googleToken;
    
    const [step, setStep] = useState(1);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', faculty: '', department: '', studyYear: '',
        desiredSector: '', desiredPosition: '', graduationYear: '', currentSector: '',
        currentCompany: '', currentPosition: '', companyName: '', companySector: ''
    });

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep(2);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await authService.completeOnboarding(role, formData, googleToken);
            if (result.success) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('role', result.role);
                localStorage.setItem('email', result.email);
                navigate('/feed');
            } else {
                setError(result.message || 'Kayıt başarısız oldu.');
            }
        } catch (err) {
            console.error("Onboarding failed", err);
            setError(err.message || 'Onboarding sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const tileHoverEnter = (e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
    };
    const tileHoverLeave = (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'transparent';
    };

    return (
        <div style={styles.container}>
            <div style={styles.card} className="animate-fade-up">
                
                {step === 1 && (
                    <div>
                        <div className="d-flex justify-content-start mb-4">
                            <MtuLogo height={52} />
                        </div>
                        <h1 style={styles.title}>Rolünüzü Seçin</h1>
                        <p style={styles.subtitle}>Dijital Kampüs ağında yerinizi almak için profil türünüzü belirleyin.</p>
                        
                        <div className="row g-4">
                            <div className="col-md-4">
                                <div style={styles.roleTile} onMouseEnter={tileHoverEnter} onMouseLeave={tileHoverLeave} onClick={() => handleRoleSelect('student')}>
                                    <i className="feather-book-open" style={styles.roleIcon}></i>
                                    <div style={styles.roleTitle}>Öğrenci</div>
                                    <div style={styles.roleDesc}>Eğitimine devam eden ve staj/iş arayan yetenekler.</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div style={styles.roleTile} onMouseEnter={tileHoverEnter} onMouseLeave={tileHoverLeave} onClick={() => handleRoleSelect('alumni')}>
                                    <i className="feather-award" style={styles.roleIcon}></i>
                                    <div style={styles.roleTitle}>Mezun</div>
                                    <div style={styles.roleDesc}>Kariyerine başlamış ve kampüsle bağını koparmayanlar.</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div style={styles.roleTile} onMouseEnter={tileHoverEnter} onMouseLeave={tileHoverLeave} onClick={() => handleRoleSelect('employer')}>
                                    <i className="feather-briefcase" style={styles.roleIcon}></i>
                                    <div style={styles.roleTitle}>İş Veren</div>
                                    <div style={styles.roleDesc}>Geleceğin yeteneklerini arayan şirket temsilcileri.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-up">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
                            <button style={styles.backBtn} onClick={() => setStep(1)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor='transparent'}>
                                <i className="feather-arrow-left"></i>
                            </button>
                            <div>
                                <h2 style={{ ...styles.title, marginBottom: '4px', fontSize: '24px' }}>
                                    {role === 'student' && "Öğrenci Profili"}
                                    {role === 'alumni' && "Mezun Profili"}
                                    {role === 'employer' && "Şirket Profili"}
                                </h2>
                                <p style={{ fontSize: '14px', color: '#727271', margin: 0 }}>Lütfen bilgilerinizi eksiksiz doldurun.</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <InputField label="İsim" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Adınız" />
                                <InputField label="Soyisim" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Soyadınız" />

                                {role === 'student' && (
                                    <>
                                        <InputField label="Fakülte" name="faculty" value={formData.faculty} onChange={handleInputChange} placeholder="Örn: Mühendislik Fakültesi" />
                                        <InputField label="Bölüm" name="department" value={formData.department} onChange={handleInputChange} placeholder="Örn: Yazılım Mühendisliği" />
                                        
                                        <div style={styles.inputContainer} className="col-md-6">
                                            <label style={styles.inputLabel}>Kaçıncı Sınıf</label>
                                            <select 
                                                name="studyYear" 
                                                value={formData.studyYear} 
                                                onChange={handleInputChange}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                                style={{ ...styles.minimalInput, cursor: 'pointer' }}
                                                required
                                            >
                                                <option value="" disabled>Seçiniz...</option>
                                                <option value="Hazırlık">Hazırlık</option>
                                                <option value="1. Sınıf">1. Sınıf</option>
                                                <option value="2. Sınıf">2. Sınıf</option>
                                                <option value="3. Sınıf">3. Sınıf</option>
                                                <option value="4. Sınıf">4. Sınıf</option>
                                            </select>
                                        </div>
                                        
                                        <InputField label="Çalışmak İstediği Sektör" name="desiredSector" value={formData.desiredSector} onChange={handleInputChange} placeholder="Örn: Teknoloji, Sağlık" />
                                        <div className="col-md-12">
                                            <InputField label="Hedeflenen Pozisyon" name="desiredPosition" value={formData.desiredPosition} onChange={handleInputChange} placeholder="Örn: Frontend Developer, Proje Yöneticisi" />
                                        </div>
                                    </>
                                )}

                                {role === 'alumni' && (
                                    <>
                                        <InputField label="Mezuniyet Yılı" name="graduationYear" type="number" value={formData.graduationYear} onChange={handleInputChange} placeholder="Örn: 2022" />
                                        <InputField label="Şu Anki Sektör" name="currentSector" value={formData.currentSector} onChange={handleInputChange} placeholder="Örn: E-Ticaret" />
                                        <InputField label="Şu Anki Şirket" name="currentCompany" value={formData.currentCompany} onChange={handleInputChange} placeholder="Örn: Trendyol" />
                                        <InputField label="Mevcut Pozisyon" name="currentPosition" value={formData.currentPosition} onChange={handleInputChange} placeholder="Örn: Senior Backend Engineer" />
                                    </>
                                )}

                                {role === 'employer' && (
                                    <>
                                        <InputField label="Şirket Adı" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Resmi Şirket Ünvanı" />
                                        <InputField label="Faaliyet Gösterilen Sektör" name="companySector" value={formData.companySector} onChange={handleInputChange} placeholder="Örn: Finans, Otomotiv" />
                                    </>
                                )}
                            </div>
                            
                            <div className="row justify-content-end mt-4">
                                <div className="col-md-4">
                                    <button 
                                        type="submit" 
                                        style={styles.submitBtn} 
                                        disabled={loading}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#005860'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#262F59'}
                                    >
                                        {loading ? 'İşleniyor...' : 'Sisteme Gir'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OnboardingPage;
