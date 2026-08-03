import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';

function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoogleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
          try {
              setLoading(true);
              const result = await authService.googleLogin(tokenResponse.access_token);
              console.log("Mock Google Login successful", result);
              onClose();
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
          
          console.log("Login successful, navigating to feed...");
          onClose(); // Modalı kapat
          navigate('/feed'); // Akış sayfasına yönlendir
      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="modal bottom fade show" style={{ overflowY: 'scroll', display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 bg-transparent">
                <button type="button" className="close" onClick={onClose} style={{ position: 'absolute', right: '15px', top: '15px', zIndex: 1, fontSize: '24px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <i className="ti-close text-grey-500"></i>
                </button>
                <div className="modal-body p-0 d-flex align-items-center">
                    <div className="card w-100 p-4 border-0 glass-modal animate-fade-up">
                        <div className="card-body rounded-0 text-left p-2">
                            <h2 className="fw-700 display1-size display2-md-size mb-4 text-center">Dijital Kampüs'e <br />Giriş Yap</h2>
                            
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
                                        <input type="checkbox" className="form-check-input mt-0 me-2" id="exampleCheck2" />
                                        <label className="form-check-label font-xss text-grey-500 mb-0" htmlFor="exampleCheck2">Remember me</label>
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
        </div>
    </div>
  );
}

export default LoginModal;
