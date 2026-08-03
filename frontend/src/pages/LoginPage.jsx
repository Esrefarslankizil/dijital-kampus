import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';
import MtuLogo from '../components/MtuLogo';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
          try {
              setLoading(true);
              const result = await authService.googleLogin(tokenResponse.access_token);
              console.log("Mock Google Login successful", result);
              if (result.isNewUser) {
                  navigate('/onboarding');
              } else {
                  navigate('/feed');
              }
          } catch (err) {
              setError("Google ile giriş yapılamadı.");
          } finally {
              setLoading(false);
          }
      },
      onError: () => setError("Google Girişi iptal edildi veya başarısız.")
  });

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
          const result = await authService.login(email, password);
          localStorage.setItem('token', result.token);
          localStorage.setItem('role', result.role);
          localStorage.setItem('email', result.email);
          if (result.avatarUrl) {
              localStorage.setItem('avatarUrl', result.avatarUrl);
          } else {
              localStorage.removeItem('avatarUrl');
          }
          navigate('/feed');
      } catch (err) {
          setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="row">
        <div 
            className="col-xl-6 d-none d-xl-block p-0 vh-100 bg-no-repeat position-relative overflow-hidden"
            style={{ backgroundColor: '#004F56', backgroundImage: `url('/images/campus-bg.webp')`, backgroundPosition: 'center', backgroundSize: 'contain' }}
        >
            {/* Subtle decorative shapes to fill green spaces */}
            <div className="floating-bubble bubble-1"></div>
            <div className="floating-bubble bubble-2"></div>
            <div className="floating-bubble bubble-3"></div>
            <div className="floating-bubble bubble-4"></div>
            <div className="floating-bubble bubble-5"></div>
            <div className="floating-bubble bubble-6"></div>
        </div>
        
        <div className="col-xl-6 vh-100 align-items-center d-flex animated-lines-bg rounded-3 overflow-hidden position-relative">
            {/* Animated Background Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            
            <div className="card shadow-none border-0 ms-auto me-auto login-card animate-fade-up animate-delay-1" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1 }}>
                <div className="card-body rounded-0 text-start">
                        <div className="mb-4 text-start">
                            <MtuLogo height={52} />
                            <h4 className="fw-700 text-grey-600 font-xss mt-3 mb-0 text-start">Öğrenci ve Personel Portalı</h4>
                        </div>
                        
                        {/* Form Container */}
                        <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
                            {error && <div className="text-danger font-xss fw-600 text-center">{error}</div>}
                            <div className="modern-input-group">
                                <i className="ti-email"></i>
                                <input 
                                    type="email" 
                                    className="modern-input form-control text-grey-900 font-xss fw-600" 
                                    placeholder="Your Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />                        
                            </div>
                            <div className="modern-input-group">
                                <i className="ti-lock"></i>
                                <input 
                                    type="password" 
                                    className="modern-input form-control text-grey-900 font-xss ls-3" 
                                    placeholder="Password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="d-flex align-items-center justify-content-between mt-1 mb-2">
                                <div className="form-check d-flex align-items-center mb-0">
                                    <input type="checkbox" className="form-check-input mt-0 me-2" id="exampleCheck1" />
                                    <label className="form-check-label font-xss text-grey-500 mb-0" htmlFor="exampleCheck1">Remember me</label>
                                </div>
                                <a href="#" className="fw-600 font-xss text-primary">Forgot your Password?</a>
                            </div>
                            
                            <button type="submit" className="form-control text-center modern-btn w-100" disabled={loading} style={{ border: 'none' }}>
                                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                            </button>
                            
                            <h6 className="text-grey-500 font-xss fw-500 mt-2 mb-0 lh-32 text-center">
                                Dont have account? <a href="#" className="fw-700 ms-1 text-primary">Register</a>
                            </h6>
                        </form>
                         
                        <div className="col-sm-12 p-0 text-center animate-fade-up animate-delay-2">
                            <div className="modern-divider">Or, Sign in with your social account</div>
                            <div className="d-flex flex-column gap-3">
                                <a href="#" className="form-control modern-social-btn" onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}><img src="/images/icon-1.png" alt="icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} /> Sign in with Google</a>
                                <a href="#" className="form-control modern-social-btn"><i className="ti-linkedin" style={{ fontSize: '24px', color: '#0077b5' }}></i> Sign in with LinkedIn</a>
                            </div>
                        </div>
                    </div>
            </div> 
        </div>
    </div>
  );
}

export default LoginPage;
