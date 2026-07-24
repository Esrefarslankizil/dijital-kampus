import React from 'react';

function RegisterModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal bottom fade show" style={{ overflowY: 'scroll', display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 bg-transparent">
                <button type="button" className="close text-white position-absolute" style={{ right: '10px', top: '10px', zIndex: 10 }} onClick={onClose} aria-label="Close"><i className="ti-close"></i></button>
                <div className="modal-body p-0 d-flex align-items-center">
                    <div className="card w-100 p-4 border-0 glass-modal animate-fade-up">
                        <div className="card-body rounded-0 text-left p-2">
                            <h2 className="fw-700 display1-size display2-md-size mb-4 text-center">Dijital Kampüs'e <br />Kayıt Ol</h2>                        
                            
                            {/* Form Container */}
                            <form className="d-flex flex-column gap-3">
                                <div className="modern-input-group">
                                    <i className="ti-user"></i>
                                    <input type="text" className="modern-input form-control text-grey-900 font-xss fw-600" placeholder="Your Name" />                        
                                </div>
                                <div className="modern-input-group">
                                    <i className="ti-email"></i>
                                    <input type="text" className="modern-input form-control text-grey-900 font-xss fw-600" placeholder="Your Email Address" />                        
                                </div>
                                <div className="modern-input-group">
                                    <i className="ti-lock"></i>
                                    <input type="password" className="modern-input form-control text-grey-900 font-xss ls-3" placeholder="Password" />
                                </div>
                                <div className="modern-input-group">
                                    <i className="ti-lock"></i>
                                    <input type="password" className="modern-input form-control text-grey-900 font-xss ls-3" placeholder="Confirm Password" />
                                </div>
                                
                                <div className="form-check d-flex align-items-center mt-1 mb-2">
                                    <input type="checkbox" className="form-check-input mt-0 me-2" id="exampleCheck3" />
                                    <label className="form-check-label font-xss text-grey-500 mb-0" htmlFor="exampleCheck3">Accept Terms and Conditions</label>
                                </div>
                                
                                <a href="#" className="form-control text-center modern-btn w-100">Register</a>
                                
                                <h6 className="text-grey-500 font-xss fw-500 mt-2 mb-0 lh-32 text-center">
                                    Already have account? <a href="#" className="fw-700 ms-1 text-primary">Login</a>
                                </h6>
                            </form>
                             
                            <div className="col-sm-12 p-0 text-center animate-fade-up animate-delay-2">
                                <div className="modern-divider">Or, Sign in with your social account</div>
                                <div className="d-flex flex-column gap-3">
                                    <a href="#" className="form-control modern-social-btn"><img src="/images/icon-1.png" alt="icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} /> Sign in with Google</a>
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

export default RegisterModal;
