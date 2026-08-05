import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // 🚀 1. Yönlendirme kancasını ekledik

// ASP.NET Core Backend adresiniz
const API_BASE = 'http://localhost:5181'; 

function RegisterModal({ isOpen, onClose }) {
    // Form verilerini tutacağımız state'ler
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate(); // 🚀 2. Navigate objesini oluşturduk

    if (!isOpen) return null;

    // Kayıt ol butonuna basıldığında çalışacak fonksiyon
    const handleRegister = async (e) => {
        e.preventDefault(); // Sayfanın yenilenmesini engeller
        localStorage.clear(); // 🚀 Eski hesaptan kalan ne varsa kökten siler!
        // Temel doğrulamalar (Validation)
        if (!name.trim() || !email.trim() || !password) {
            toast.error('Lütfen tüm alanları doldurun!');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Şifreler uyuşmuyor!');
            return;
        }
        if (password.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır!');
            return;
        }

        setLoading(true);
        try {
            // Backend'in beklediği DTO formatı
            const payload = {
                UserName: name,
                Email: email,
                Password: password
            };

            // Backend API'sine POST isteği atıyoruz
           // Backend API'sine POST isteği atıyoruz
    const response = await axios.post(`${API_BASE}/api/auth/register`, payload);

    toast.success('Kayıt başarılı! Giriş yapılıyor... 🚀');

    // Kayıttan hemen sonra arka planda otomatik LOGIN atıp token'ı alıyoruz:
    try {
        const loginRes = await authService.login(email, password);
        if (loginRes.token) {
            localStorage.setItem('token', loginRes.token);
            localStorage.setItem('role', loginRes.role);
            localStorage.setItem('email', loginRes.email);
            localStorage.setItem('displayName', name);
            
            // Onboarding veya Feed sayfasına tam yenilemeyle gönderiyoruz
            window.location.href = '/feed';
            return;
        }
    } catch (loginErr) {
        // Eğer oto-login olmazsa kullanıcıyı login sayfasına yönlendiririz
        window.location.href = '/login';
    }

        } catch (error) {
            console.error('Kayıt hatası:', error);
            // Backend'den dönen özel bir hata mesajı varsa onu göster, yoksa standart hata ver
            const errorMessage = error.response?.data?.message || error.response?.data || 'Kayıt olurken bir hata oluştu!';
            toast.error(typeof errorMessage === 'string' ? errorMessage : 'Kayıt işlemi başarısız!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal bottom fade show" style={{ overflowY: 'scroll', display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content border-0 bg-transparent">
                    <button type="button" className="close text-white position-absolute" style={{ right: '10px', top: '10px', zIndex: 10 }} onClick={onClose} aria-label="Close">
                        <i className="ti-close"></i>
                    </button>
                    <div className="modal-body p-0 d-flex align-items-center">
                        <div className="card w-100 p-4 border-0 glass-modal animate-fade-up">
                            <div className="card-body rounded-0 text-left p-2">
                                <h2 className="fw-700 display1-size display2-md-size mb-4 text-center">Dijital Kampüs'e <br />Kayıt Ol</h2>
                                
                                {/* Form Container */}
                                <form className="d-flex flex-column gap-3" onSubmit={handleRegister}>
                                    <div className="modern-input-group">
                                        <i className="ti-user"></i>
                                        <input 
                                            type="text" 
                                            className="modern-input form-control text-grey-900 font-xss fw-600" 
                                            placeholder="Ad Soyad (Örn: Seyrah)" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="modern-input-group">
                                        <i className="ti-email"></i>
                                        <input 
                                            type="email" 
                                            className="modern-input form-control text-grey-900 font-xss fw-600" 
                                            placeholder="E-posta Adresiniz" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="modern-input-group">
                                        <i className="ti-lock"></i>
                                        <input 
                                            type="password" 
                                            className="modern-input form-control text-grey-900 font-xss ls-3" 
                                            placeholder="Şifre" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="modern-input-group">
                                        <i className="ti-lock"></i>
                                        <input 
                                            type="password" 
                                            className="modern-input form-control text-grey-900 font-xss ls-3" 
                                            placeholder="Şifreyi Onayla" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="form-check d-flex align-items-center mt-1 mb-2">
                                        <input type="checkbox" className="form-check-input mt-0 me-2" id="termsCheck" required />
                                        <label className="form-check-label font-xss text-grey-500 mb-0" htmlFor="termsCheck">Şartları ve Koşulları Kabul Ediyorum</label>
                                    </div>
                                    
                                    {/* Submit Button */}
                                    <button 
                                        type="submit" 
                                        className="form-control text-center modern-btn w-100 border-0"
                                        disabled={loading}
                                        style={{ backgroundColor: '#006F79', color: 'white', fontWeight: 'bold' }}
                                    >
                                        {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                                    </button>
                                    
                                    <h6 className="text-grey-500 font-xss fw-500 mt-2 mb-0 lh-32 text-center">
                                        Zaten bir hesabın var mı? <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} className="fw-700 ms-1 text-primary">Giriş Yap</a>
                                    </h6>
                                </form>
                                 
                                <div className="col-sm-12 p-0 text-center animate-fade-up animate-delay-2 mt-4">
                                    <div className="modern-divider">Veya Sosyal Hesap ile Giriş Yap</div>
                                    <div className="d-flex flex-column gap-3 mt-3">
                                        <button className="form-control modern-social-btn bg-white border d-flex align-items-center justify-content-center gap-2">
                                            <img src="/images/icon-1.png" alt="Google" style={{ width: '24px', height: '24px', objectFit: 'contain' }} /> 
                                            Google ile Kayıt Ol
                                        </button>
                                        <button className="form-control modern-social-btn bg-white border d-flex align-items-center justify-content-center gap-2">
                                            <i className="ti-linkedin" style={{ fontSize: '24px', color: '#0077b5' }}></i> 
                                            LinkedIn ile Kayıt Ol
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>                    
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterModal;