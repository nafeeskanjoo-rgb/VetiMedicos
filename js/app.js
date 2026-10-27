/**
 * ==============================================================================
 * VetiMedicos - UI Logic & Interaction Controller
 * Features:
 * - Login adjusted into Navbar User Icon (Dropdown/Modal)
 * - Dual Role Switching: Client / Pet Parent vs Veti Doctor
 * - View Navigation (Sign In, Sign Up, Forgot Password, Dashboard)
 * - Realtime Firebase & Demo Simulation Support
 * ==============================================================================
 */

// Early global stubs so inline onclick or early clicks never fail
window.openCartDrawer = function() {
    window._cartOpenRequested = true;
    if (typeof window._openCartDrawerImpl === 'function') {
        window._openCartDrawerImpl();
    }
};
window.closeCartDrawer = function() {
    if (typeof window._closeCartDrawerImpl === 'function') {
        window._closeCartDrawerImpl();
    }
};

// Global Suppression of all popup toast notifications across the application
window.showToast = function() { return; };
function showToast() { return; }


document.addEventListener('DOMContentLoaded', () => {
    // Universal Modal Scroll Lock helper
    window.setModalScrollLock = function(locked) {
        if (locked) {
            document.documentElement.classList.add('modal-active');
            document.body.classList.add('modal-active');
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            const anyModalOpen = document.querySelector(
                '.facility-modal-wrapper.open, .facility-success-modal-wrapper.open, .doctors-duty-backdrop.open, .auth-modal-wrapper.open'
            );
            if (!anyModalOpen) {
                document.documentElement.classList.remove('modal-active');
                document.body.classList.remove('modal-active');
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
            }
        }
    };

    // Block background scrolling while any modal is active
    window.addEventListener('wheel', (e) => {
        if (document.body.classList.contains('modal-active')) {
            const isScrollable = e.target.closest(
                '.facility-success-card, .facility-modal-card, .doctors-duty-box, .auth-card, .cart-drawer-box, .cart-items-list, .quickview-card'
            );
            if (!isScrollable) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (document.body.classList.contains('modal-active')) {
            const isScrollable = e.target.closest(
                '.facility-success-card, .facility-modal-card, .doctors-duty-box, .auth-card, .cart-drawer-box, .cart-items-list, .quickview-card'
            );
            if (!isScrollable) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // Current Active Role State ('client' | 'doctor')
    let currentRole = 'client';

    // Ensure Auth Modal markup exists in DOM across all pages (except standalone login portal page)
    function ensureAuthModalMarkup() {
        if (!document.getElementById('auth-modal-wrapper') && !document.querySelector('.login-portal-stage')) {
            const modalHtml = `
            <div class="auth-modal-wrapper" id="auth-modal-wrapper" role="dialog" aria-modal="true" aria-labelledby="signin-heading-title">
                <div class="auth-modal-backdrop" id="auth-modal-backdrop"></div>
                <div class="auth-floating-container">
                    <div class="auth-card">
                        <button type="button" class="auth-close-btn" id="auth-close-btn" aria-label="Close Login Modal">&times;</button>
                        
                        <div class="auth-brand-badge" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(223, 162, 67, 0.2);">
                            <img src="assets/images/vetimedicos_official_logo.png" alt="VetiMedicos Official Crest EST. 2026" style="width: 38px; height: 38px; border-radius: 50%; box-shadow: 0 3px 10px rgba(223, 162, 67, 0.35); border: 1.5px solid rgba(223, 162, 67, 0.5); object-fit: contain; background: #ffffff;">
                            <div style="text-align: left; line-height: 1.15;">
                                <div style="font-weight: 800; font-size: 0.95rem; color: #0c1e28;">Veti<span style="color:#df9c30;">Medicos</span></div>
                                <div style="font-size: 0.62rem; color: #b45309; font-weight: 800; letter-spacing: 0.6px;">SECURE GATEWAY &bull; EST. 2026</div>
                            </div>
                        </div>

                        <div class="role-selector-bar" role="tablist" aria-label="Select Login Role">
                            <button type="button" class="role-chip active" data-role="client" id="role-chip-client" role="tab" aria-selected="true">
                                <span class="role-icon">🐾</span>
                                <span>Client / Pet Parent</span>
                            </button>
                            <button type="button" class="role-chip" data-role="doctor" id="role-chip-doctor" role="tab" aria-selected="false">
                                <span class="role-icon">🩺</span>
                                <span>Veti Doctor</span>
                            </button>
                        </div>

                        <!-- View 1: Sign In -->
                        <div id="view-signin" class="card-view active">
                            <div class="card-header">
                                <h2 class="card-title" id="signin-heading-title">Client <span>Sign In</span></h2>
                                <p class="card-desc" id="signin-heading-subtitle">Welcome Pet Parent! Manage your pets &amp; clinic appointments</p>
                            </div>

                            <form id="form-signin" novalidate>
                                <div class="form-group">
                                    <label for="signin-email" class="input-label">Email Address</label>
                                    <div class="input-box">
                                        <input type="email" id="signin-email" placeholder="client@example.com" required autocomplete="email">
                                    </div>
                                </div>

                                <div class="doctor-signin-field" id="doctor-signin-spec-box" style="display: none;">
                                    <div class="doctor-spec-compact-box">
                                        <div class="doctor-spec-header">
                                            <span>🩺 Specified Doctor Details <span class="spec-req-badge">Required</span></span>
                                            <a href="doctors.html" class="btn-spec-link" id="auth-duty-link" title="View Doctors On Duty">📋 OPD Roster</a>
                                        </div>
                                        <div class="spec-grid-2">
                                            <div>
                                                <label for="signin-doctor-name" class="input-label">Doctor Name *</label>
                                                <div class="input-box">
                                                    <input type="text" id="signin-doctor-name" placeholder="e.g. Dr. Farhan Qureshi">
                                                </div>
                                            </div>
                                            <div>
                                                <label for="signin-license" class="input-label">License / Reg *</label>
                                                <div class="input-box">
                                                    <input type="text" id="signin-license" placeholder="e.g. VET-PK-2026-DVM">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="spec-grid-2">
                                            <div>
                                                <label for="signin-doctor-specialty" class="input-label">Specialization</label>
                                                <div class="input-box">
                                                    <select id="signin-doctor-specialty">
                                                        <option value="Chief Veterinary Surgeon|Department of Surgery & Orthopedics">Chief Veterinary Surgeon</option>
                                                        <option value="Canine Health & Dog Diagnostics|Canine Wellness OPD Block A">Canine &amp; Dog Specialist</option>
                                                        <option value="Feline (Cat) & Small Pet Medicine|Cat Care & Vaccination Wing">Feline &amp; Small Pet Specialist</option>
                                                        <option value="Emergency Veterinary Physician|24/7 Trauma & Emergency ICU">Emergency &amp; Trauma ICU</option>
                                                        <option value="Clinical Pet Nutrition & Dietetics|Pet Nutrition & Preventive Care">Clinical Pet Nutrition</option>
                                                        <option value="Birds, Parrots & Exotic Mammals|Exotic Animals & Aviary Unit">Avian &amp; Exotic Species</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label for="signin-doctor-room" class="input-label">Chamber</label>
                                                <div class="input-box">
                                                    <select id="signin-doctor-room">
                                                        <option value="Executive Surgery Suite 101">Suite 101</option>
                                                        <option value="Canine OPD Room 103">Room 103</option>
                                                        <option value="Feline Clinic Room 105">Room 105</option>
                                                        <option value="Dietary Clinic Room 108">Room 108</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="spec-grid-2">
                                            <div>
                                                <label for="signin-doctor-shift" class="input-label">Duty Shift</label>
                                                <div class="input-box">
                                                    <select id="signin-doctor-shift">
                                                        <option value="08:00 AM - 04:00 PM (Morning)">Morning (08:00 AM - 04:00 PM)</option>
                                                        <option value="10:00 AM - 06:00 PM (General)">General (10:00 AM - 06:00 PM)</option>
                                                        <option value="02:00 PM - 10:00 PM (Evening)">Evening (02:00 PM - 10:00 PM)</option>
                                                        <option value="12:00 PM - 08:00 PM (Emergency Shift)">Emergency (12:00 PM - 08:00 PM)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label for="signin-doctor-status" class="input-label">Initial Status</label>
                                                <div class="input-box">
                                                    <select id="signin-doctor-status">
                                                        <option value="onduty">🟢 On Duty Now</option>
                                                        <option value="surgery">🟡 In Surgery</option>
                                                        <option value="consultation">🔵 In Consultation</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="client-signin-field" id="client-signin-pet-box">
                                    <div class="client-spec-compact-box">
                                        <div class="client-spec-header">
                                            <span>🐾 Pet Details (Client Profile) <span class="spec-req-badge client-badge">Required</span></span>
                                            <a href="clients.html" class="btn-spec-link client-link" id="auth-clients-link" title="View Registered Clients">🐾 Live Directory</a>
                                        </div>
                                        <div class="spec-grid-3">
                                            <div>
                                                <label for="signin-pet-name" class="input-label">Pet Name *</label>
                                                <div class="input-box">
                                                    <input type="text" id="signin-pet-name" placeholder="e.g. Rocky, Bella">
                                                </div>
                                            </div>
                                            <div>
                                                <label for="signin-pet-type" class="input-label">Species</label>
                                                <div class="input-box">
                                                    <select id="signin-pet-type">
                                                        <option value="Dog">🐕 Dog</option>
                                                        <option value="Cat">🐈 Cat</option>
                                                        <option value="Bird">🦜 Bird</option>
                                                        <option value="Rabbit">🐇 Rabbit</option>
                                                        <option value="Other">🐾 Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label for="signin-pet-breed" class="input-label">Breed / Age</label>
                                                <div class="input-box">
                                                    <input type="text" id="signin-pet-breed" placeholder="Golden Retriever, 2 yrs">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="signin-password" class="input-label">Password</label>
                                    <div class="input-box">
                                        <input type="password" id="signin-password" placeholder="enter your password" required autocomplete="current-password">
                                        <button type="button" class="input-toggle-pw" data-target="signin-password" aria-label="Toggle password visibility">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div class="form-options">
                                    <label class="remember-label">
                                        <input type="checkbox" id="remember-me" checked>
                                        <span>Remember me</span>
                                    </label>
                                    <a href="#" id="btn-to-forgot" class="forgot-link">Forgot password ?</a>
                                </div>

                                <button type="submit" class="btn-submit" id="btn-submit-signin">
                                    <span class="btn-text" id="signin-btn-label">Sign In as Client 🐾</span>
                                    <span class="spinner"></span>
                                </button>

                                <div class="auth-divider">
                                    <span>or continue with</span>
                                </div>

                                <button type="button" class="btn-google" id="btn-google-signin">
                                    <svg viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    <span>Sign In with Google</span>
                                </button>

                                <div class="card-footer">
                                    <span class="footer-text">New to VetiMedicos?</span>
                                    <button type="button" id="btn-to-signup" class="footer-switch-btn">Sign Up</button>
                                </div>
                            </form>
                        </div>

                        <!-- View 2: Sign Up -->
                        <div id="view-signup" class="card-view">
                            <div class="card-header">
                                <h2 class="card-title" id="signup-heading-title">Create <span>Pet Account</span></h2>
                                <p class="card-desc" id="signup-heading-subtitle">Join VetiMedicos for professional pet care &amp; nutrition</p>
                            </div>

                            <form id="form-signup" novalidate>
                                <div class="form-group">
                                    <label for="signup-name" class="input-label">Full Name</label>
                                    <div class="input-box">
                                        <input type="text" id="signup-name" placeholder="John Doe / Dr. Sarah" required autocomplete="name">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="signup-email" class="input-label">Email Address</label>
                                    <div class="input-box">
                                        <input type="email" id="signup-email" placeholder="client@example.com" required autocomplete="email">
                                    </div>
                                </div>
                                <div class="spec-grid-2">
                                    <div>
                                        <label for="signup-password" class="input-label">Password</label>
                                        <div class="input-box">
                                            <input type="password" id="signup-password" placeholder="Min 6 chars" required autocomplete="new-password">
                                        </div>
                                    </div>
                                    <div>
                                        <label for="signup-confirm" class="input-label">Confirm</label>
                                        <div class="input-box">
                                            <input type="password" id="signup-confirm" placeholder="Repeat password" required autocomplete="new-password">
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" class="btn-submit" id="btn-submit-signup">
                                    <span class="btn-text" id="signup-btn-label">Create Pet Account 🐾</span>
                                    <span class="spinner"></span>
                                </button>
                                <div class="card-footer">
                                    <span class="footer-text">Already registered?</span>
                                    <button type="button" id="btn-to-signin-from-up" class="footer-switch-btn">Sign In</button>
                                </div>
                            </form>
                        </div>

                        <!-- View 3: Forgot Password -->
                        <div id="view-forgot" class="card-view">
                            <div class="card-header">
                                <h2 class="card-title">Reset <span>Password</span></h2>
                                <p class="card-desc">Enter your email to receive recovery instructions</p>
                            </div>
                            <form id="form-forgot" novalidate>
                                <div class="form-group">
                                    <label for="forgot-email" class="input-label">Registered Email</label>
                                    <div class="input-box">
                                        <input type="email" id="forgot-email" placeholder="enter your email" required autocomplete="email">
                                    </div>
                                </div>
                                <button type="submit" class="btn-submit" id="btn-submit-forgot">
                                    <span class="btn-text">Send Reset Link</span>
                                    <span class="spinner"></span>
                                </button>
                                <div class="card-footer" style="justify-content: center;">
                                    <button type="button" id="btn-to-signin-from-forgot" class="footer-switch-btn">&larr; Back to Sign In</button>
                                </div>
                            </form>
                        </div>

                        <!-- View 4: Authenticated User -->
                        <div id="view-user" class="card-view">
                            <div class="card-header" style="text-align: center;">
                                <div style="width: 58px; height: 58px; background: #e0f2fe; color: #0284c7; border-radius: 50%; display: grid; place-content: center; font-size: 1.7rem; margin: 0 auto 10px auto;">
                                    🐾
                                </div>
                                <span class="role-badge client-badge" id="user-role-badge">🐾 Pet Parent VIP</span>
                                <h2 class="card-title" id="user-display-name">Welcome Back</h2>
                                <p class="card-desc" id="user-display-email" style="color: #64748b; font-size: 0.82rem;">user@example.com</p>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.6); border: 1.5px solid rgba(223, 162, 67, 0.35); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 12px;">
                                <div id="user-role-details"></div>
                            </div>
                            <div class="doctor-quick-actions" style="margin-bottom: 12px;">
                                <a href="checkup.html" class="btn-role-action" style="text-decoration:none; text-align:center;">🩺 Online Checkup</a>
                                <a href="doctors.html" class="btn-role-action" style="text-decoration:none; text-align:center;">📋 Doctors Roster</a>
                            </div>
                            <button type="button" class="btn-submit" id="btn-signout" style="background: #ef4444; border-color: #dc2626;">
                                <span class="btn-text">Sign Out of Session</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    }
    ensureAuthModalMarkup();

    // DOM Elements - Auth Modal Wrapper & Triggers
    let authModal = document.getElementById('auth-modal-wrapper');
    let authBackdrop = document.getElementById('auth-modal-backdrop');
    let navUserBtn = document.getElementById('nav-user-btn');
    let authCloseBtn = document.getElementById('auth-close-btn');

    // Quick open buttons from Hero / Nav
    const heroDoctorBtn = document.getElementById('hero-secondary-btn');
    const heroLoginQuickBtn = document.getElementById('hero-login-quick-btn');

    // Views inside the Auth Card
    const viewSignIn = document.getElementById('view-signin');
    const viewSignUp = document.getElementById('view-signup');
    const viewForgot = document.getElementById('view-forgot');
    const viewUser = document.getElementById('view-user');

    // Forms
    const formSignIn = document.getElementById('form-signin');
    const formSignUp = document.getElementById('form-signup');
    const formForgot = document.getElementById('form-forgot');

    // Switch View Buttons
    const btnToSignUp = document.getElementById('btn-to-signup');
    const btnToSignInFromUp = document.getElementById('btn-to-signin-from-up');
    const btnToForgot = document.getElementById('btn-to-forgot');
    const btnToSignInFromForgot = document.getElementById('btn-to-signin-from-forgot');

    // Google Buttons
    const btnGoogleSignIn = document.getElementById('btn-google-signin');
    const btnGoogleSignUp = document.getElementById('btn-google-signup');

    // Password Toggles
    const toggleButtons = document.querySelectorAll('.input-toggle-pw');

    // Firebase Status Pill & Help Modal
    const firebasePill = document.getElementById('firebase-status-pill');
    const firebaseHelpModal = document.getElementById('firebase-help-modal');
    const helpModalCloseBtn = document.getElementById('modal-close-btn');

    // User Profile Display Elements
    const userRoleBadge = document.getElementById('user-role-badge');
    const userNameSpan = document.getElementById('user-display-name');
    const userEmailSpan = document.getElementById('user-display-email');
    const userRoleDetails = document.getElementById('user-role-details');
    const btnSignOut = document.getElementById('btn-signout');

    // -------------------------------------------------------------
    // Auth Modal Open / Close Controller
    // -------------------------------------------------------------
    window.openAuthModal = function(targetRole = null, targetView = 'signin') {
        if (!authModal) {
            authModal = document.getElementById('auth-modal-wrapper');
        }
        if (!authModal) {
            if (!document.querySelector('.login-portal-stage')) {
                window.location.href = 'login.html';
            }
            return;
        }
        
        if (targetRole) {
            setRole(targetRole);
        }

        if (targetView === 'signup') {
            switchView(viewSignUp);
        } else if (targetView === 'forgot') {
            switchView(viewForgot);
        } else {
            switchView(viewSignIn);
        }

        authModal.classList.add('open');
        window.setModalScrollLock(true);
    };

    window.closeAuthModal = function() {
        if (!authModal) return;
        authModal.classList.remove('open');
        window.setModalScrollLock(false);
    };

    // Delegated click listener for all Nav User Login triggers & modal close
    document.addEventListener('click', (e) => {
        if (e.target.closest('#nav-user-btn, .nav-user-trigger')) {
            e.preventDefault();
            if (document.querySelector('.login-portal-stage')) {
                const emailInp = document.getElementById('signin-email');
                if (emailInp) emailInp.focus();
                return;
            }
            const modal = document.getElementById('auth-modal-wrapper');
            if (modal && modal.classList.contains('open')) {
                window.closeAuthModal();
            } else {
                window.openAuthModal();
            }
        } else if (e.target.closest('#auth-close-btn')) {
            e.preventDefault();
            window.closeAuthModal();
        } else if (e.target && e.target.id === 'auth-modal-backdrop') {
            window.closeAuthModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal && authModal.classList.contains('open')) {
            closeAuthModal();
        }
    });

    // Hero 24/7 Emergency Call button
    const heroEmergencyBtn = document.getElementById('hero-emergency-btn');
    if (heroEmergencyBtn) {
        heroEmergencyBtn.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('info', '24/7 Emergency Helpline', 'Dialing VetiMedicos Critical Trauma Line: 0326-4223100...');
            }
        });
    }

    if (heroLoginQuickBtn) {
        heroLoginQuickBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('client', 'signin');
        });
    }

    // -------------------------------------------------------------
    // Role Switching Logic: Client / Pet Parent vs Veti Doctor
    // -------------------------------------------------------------
    function setRole(role) {
        currentRole = role;

        // Update all role chips in the UI (both in signin & signup)
        document.querySelectorAll('.role-chip').forEach(chip => {
            if (chip.getAttribute('data-role') === role) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });

        // Sign In View Elements
        const signinTitle = document.getElementById('signin-heading-title');
        const signinSubtitle = document.getElementById('signin-heading-subtitle');
        const signinEmailInput = document.getElementById('signin-email');
        const signinDoctorFields = document.querySelectorAll('.doctor-signin-field');
        const btnSubmitSigninText = document.getElementById('signin-btn-label');

        // Sign Up View Elements
        const signupTitle = document.getElementById('signup-heading-title');
        const signupSubtitle = document.getElementById('signup-heading-subtitle');
        const signupDoctorFields = document.querySelectorAll('.doctor-signup-field');
        const btnSubmitSignupText = document.getElementById('signup-btn-label');

        const clientSigninFields = document.querySelectorAll('.client-signin-field');
        const clientSignupFields = document.querySelectorAll('.client-signup-field');

        if (role === 'doctor') {
            // DOCTOR MODE
            if (signinTitle) signinTitle.innerHTML = `Veti Doctor <span>Sign In</span>`;
            if (signinSubtitle) signinSubtitle.textContent = `Veterinary Portal - Consultations, prescriptions & medical records`;
            if (signinEmailInput) signinEmailInput.placeholder = `doctor@veticare.com`;
            if (btnSubmitSigninText) btnSubmitSigninText.textContent = `Sign In as Veti Doctor 🩺`;

            signinDoctorFields.forEach(f => f.style.display = 'block');

            if (signupTitle) signupTitle.innerHTML = `Doctor <span>Registration</span>`;
            if (signupSubtitle) signupSubtitle.textContent = `Join the verified VetiMedicos medical specialist panel`;
            if (btnSubmitSignupText) btnSubmitSignupText.textContent = `Register as Doctor 🩺`;

            signupDoctorFields.forEach(f => f.style.display = 'block');
            clientSigninFields.forEach(f => f.style.display = 'none');
            clientSignupFields.forEach(f => f.style.display = 'none');

        } else {
            // CLIENT / PET PARENT MODE
            if (signinTitle) signinTitle.innerHTML = `Client <span>Sign In</span>`;
            if (signinSubtitle) signinSubtitle.textContent = `Welcome Pet Parent! Manage your pets & clinic appointments`;
            if (signinEmailInput) signinEmailInput.placeholder = `client@example.com`;
            if (btnSubmitSigninText) btnSubmitSigninText.textContent = `Sign In as Client 🐾`;

            signinDoctorFields.forEach(f => f.style.display = 'none');

            if (signupTitle) signupTitle.innerHTML = `Create <span>Pet Account</span>`;
            if (signupSubtitle) signupSubtitle.textContent = `Join VetiMedicos for professional pet care & nutrition`;
            if (btnSubmitSignupText) btnSubmitSignupText.textContent = `Create Pet Account 🐾`;

            signupDoctorFields.forEach(f => f.style.display = 'none');
            clientSigninFields.forEach(f => f.style.display = 'block');
            clientSignupFields.forEach(f => f.style.display = 'block');
        }
    }

    // Attach click listeners to role chips
    document.querySelectorAll('.role-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedRole = chip.getAttribute('data-role');
            setRole(selectedRole);
        });
    });

    // -------------------------------------------------------------
    // Card Views Switcher (Sign In, Sign Up, Forgot, Dashboard)
    // -------------------------------------------------------------
    function switchView(targetView) {
        [viewSignIn, viewSignUp, viewForgot, viewUser].forEach(view => {
            if (view) view.classList.remove('active');
        });
        if (targetView) {
            targetView.classList.add('active');
        }
    }

    if (btnToSignUp) {
        btnToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(viewSignUp);
        });
    }

    if (btnToSignInFromUp) {
        btnToSignInFromUp.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(viewSignIn);
        });
    }

    if (btnToForgot) {
        btnToForgot.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(viewForgot);
        });
    }

    if (btnToSignInFromForgot) {
        btnToSignInFromForgot.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(viewSignIn);
        });
    }

    // Password Show/Hide Toggle
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetInputId = btn.getAttribute('data-target');
            const input = document.getElementById(targetInputId);
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            btn.innerHTML = isPassword 
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        });
    });

    // Toast Notification System - COMPLETELY DISABLED ACROSS APPLICATION
    window.showToast = function(type, title, message, duration = 4000) {
        // Suppress all toast popup notifications as requested
        return;
    };

    // Firebase Status Indicator Initializer
    function updateFirebaseStatusUI() {
        if (!firebasePill) return;
        const dot = firebasePill.querySelector('.status-dot');
        const text = firebasePill.querySelector('.status-text');

        if (window.VetiAuth && window.VetiAuth.isLive()) {
            if (dot) dot.classList.add('connected');
            if (text) text.textContent = 'Firebase: Live';
        } else {
            if (dot) dot.classList.remove('connected');
            if (text) text.textContent = 'Firebase: Demo';
        }
    }

    if (firebasePill) {
        firebasePill.addEventListener('click', () => {
            if (firebaseHelpModal) firebaseHelpModal.classList.add('open');
        });
    }

    if (helpModalCloseBtn) {
        helpModalCloseBtn.addEventListener('click', () => {
            if (firebaseHelpModal) firebaseHelpModal.classList.remove('open');
        });
    }

    if (firebaseHelpModal) {
        firebaseHelpModal.addEventListener('click', (e) => {
            if (e.target === firebaseHelpModal) {
                firebaseHelpModal.classList.remove('open');
            }
        });
    }

    function setBtnLoading(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    }

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Handle User Logged In UI & Role Presentation
    // -------------------------------------------------------------
    function handleLoginSuccess(user, userRole = 'client', isDemo = false, extraData = {}) {
        const isDoctor = userRole === 'doctor';
        let displayName = user.displayName;
        if (isDoctor && extraData.doctorName && extraData.doctorName.trim()) {
            displayName = extraData.doctorName.trim();
        }
        if (!displayName) {
            displayName = user.email ? user.email.split('@')[0] : (isDoctor ? 'Veti Doctor' : 'Client');
        }
        if (isDoctor && !displayName.toLowerCase().startsWith('dr.')) {
            displayName = `Dr. ${displayName.charAt(0).toUpperCase() + displayName.slice(1)}`;
        }

        // Store active session metadata
        sessionStorage.setItem('veti_current_user_email', user.email);
        sessionStorage.setItem('veti_current_user_role', userRole);
        sessionStorage.setItem('veti_current_user_uid', user.uid || ('uid-' + Date.now()));

        if (userNameSpan) userNameSpan.textContent = displayName;
        if (userEmailSpan) userEmailSpan.textContent = user.email;

        // Update Role Badge and Details
        if (userRoleBadge) {
            userRoleBadge.className = isDoctor ? 'role-badge doctor-badge' : 'role-badge client-badge';
            userRoleBadge.innerHTML = isDoctor ? `🩺 Licensed Veti Doctor` : `🐾 Registered Pet Parent`;
        }

        if (userRoleDetails) {
            if (isDoctor) {
                const docLicense = extraData.license || user.license || 'VET-2026-ACTIVE';
                const docSpec = extraData.specialty || user.specialty || 'Veterinary Specialist & Surgeon';
                const docRoom = extraData.room || 'Executive Surgery Suite 101';
                const docShift = extraData.shift || '08:00 AM - 04:00 PM (Morning)';
                const docStatusVal = extraData.status || 'onduty';
                const statusBadge = docStatusVal === 'surgery' ? '🟡 In Surgery' :
                                    docStatusVal === 'consultation' ? '🔵 In Consultation' : '🟢 On Duty (Live in Portal)';

                userRoleDetails.innerHTML = `
                    <div class="user-role-info">
                        <span class="info-label">Doctor Name:</span>
                        <span class="info-val" style="color: #ea580c; font-weight: 700;">${displayName}</span>
                    </div>
                    <div class="user-role-info" style="margin-top: 4px;">
                        <span class="info-label">Clinic License:</span>
                        <span class="info-val">${docLicense}</span>
                    </div>
                    <div class="user-role-info" style="margin-top: 4px;">
                        <span class="info-label">Specialization:</span>
                        <span class="info-val">${docSpec}</span>
                    </div>
                    <div class="user-role-info" style="margin-top: 4px;">
                        <span class="info-label">Chamber &amp; Shift:</span>
                        <span class="info-val" style="color: #0284c7;">${docRoom} &bull; ${docShift}</span>
                    </div>
                    <div class="user-role-info" style="margin-top: 4px;">
                        <span class="info-label">Duty Status:</span>
                        <span class="info-val" style="color: #059669; font-weight: 700;">${statusBadge}</span>
                    </div>
                    <div class="doctor-quick-actions">
                        <button class="btn-role-action" id="btn-dash-view-roster">🩺 View Duty Portal</button>
                        <button class="btn-role-action" id="btn-dash-clients-view">🐾 View Clients Portal</button>
                    </div>
                `;

                const btnDashView = document.getElementById('btn-dash-view-roster');
                if (btnDashView) {
                    btnDashView.addEventListener('click', () => {
                        closeAuthModal();
                        openDutyModal();
                    });
                }

                const btnDashClients = document.getElementById('btn-dash-clients-view');
                if (btnDashClients) {
                    btnDashClients.addEventListener('click', () => {
                        closeAuthModal();
                        openClientsModal();
                    });
                }
            } else {
                // Client Pets Determination
                let clientPets = [];
                if (extraData.pets && Array.isArray(extraData.pets) && extraData.pets.length > 0) {
                    clientPets = extraData.pets;
                } else if (extraData.petName) {
                    const pType = extraData.petType || 'Dog';
                    const pIcon = pType === 'Cat' ? '🐈' : pType === 'Bird' ? '🦜' : pType === 'Rabbit' ? '🐇' : '🐕';
                    clientPets = [{
                        name: extraData.petName,
                        type: pType,
                        breed: extraData.petBreed || 'Mixed Breed',
                        age: extraData.petAge || '1 Year',
                        icon: pIcon,
                        status: 'Registered Pet 💉'
                    }];
                } else {
                    clientPets = [{
                        name: "Rocky",
                        type: "Dog",
                        breed: "Golden Retriever",
                        age: "2.5 Years",
                        icon: "🐕",
                        status: "Vaccinated 💉"
                    }];
                }

                userRoleDetails.innerHTML = `
                    <div class="user-role-info">
                        <span class="info-label">Membership:</span>
                        <span class="info-val">Active Pet Parent Pass</span>
                    </div>
                    <div class="user-role-info" style="margin-top: 4px;">
                        <span class="info-label">Registered Pets:</span>
                        <span class="info-val" style="color: #0284c7; font-weight: 700;">${clientPets.map(p => `${p.icon || '🐾'} ${p.name} (${p.type})`).join(', ')}</span>
                    </div>
                    <div class="doctor-quick-actions">
                        <button class="btn-role-action" id="btn-dash-view-clients">🐾 View Clients Portal</button>
                        <button class="btn-role-action" id="btn-dash-book-vet">📅 Book Vet</button>
                    </div>
                `;

                const btnDashClients = document.getElementById('btn-dash-view-clients');
                if (btnDashClients) {
                    btnDashClients.addEventListener('click', () => {
                        closeAuthModal();
                        openClientsModal();
                    });
                }

                const btnDashBook = document.getElementById('btn-dash-book-vet');
                if (btnDashBook) {
                    btnDashBook.addEventListener('click', () => {
                        closeAuthModal();
                        openDutyModal();
                        showToast('info', 'Choose Doctor', 'Select any available on-duty doctor to book consultation.');
                    });
                }
            }
        }

        // IF LOGGED IN AS A DOCTOR: Add to Live Doctors Duty Roster!
        if (isDoctor) {
            const docSpecialty = extraData.specialty || user.specialty || 'Veterinary Specialist & Surgeon';
            const docLicense = extraData.license || user.license || 'VET-REG-2026';
            const docRoom = extraData.room || ('OPD Room ' + (Math.floor(Math.random() * 5) + 101));
            const docShift = extraData.shift || `Active Shift (Logged in ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
            const docStatus = extraData.status || 'onduty';

            let statusLabel = 'On Duty Now';
            let statusClass = 'status-onduty';
            if (docStatus === 'surgery') {
                statusLabel = 'In Surgery';
                statusClass = 'status-surgery';
            } else if (docStatus === 'consultation') {
                statusLabel = 'In Consultation';
                statusClass = 'status-consultation';
            }

            const doctorRecord = {
                id: user.uid || ('doc-' + Date.now()),
                uid: user.uid,
                name: displayName,
                email: user.email,
                credentials: `DVM (${docLicense})`,
                specialty: docSpecialty,
                dept: extraData.dept || "Department of Surgery & Clinical Care",
                avatar: extraData.avatar || (displayName.includes('Ayesha') || displayName.includes('Sana') || displayName.includes('Zainab') ? "👩‍⚕️" : "👨‍⚕️"),
                status: docStatus,
                statusLabel: statusLabel,
                statusClass: statusClass,
                shift: docShift,
                room: docRoom,
                queueCount: 0,
                phoneOpd: "Ext: " + (Math.floor(Math.random() * 20) + 100),
                loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isCurrentSession: true
            };

            addDoctorToRoster(doctorRecord);
            renderDoctors(currentDutyFilter, currentDutySearch);
        } else {
            // IF LOGGED IN AS A CLIENT: Add to Live Clients & Pets Directory!
            let clientPets = [];
            if (extraData.pets && Array.isArray(extraData.pets) && extraData.pets.length > 0) {
                clientPets = extraData.pets;
            } else if (extraData.petName) {
                const pType = extraData.petType || 'Dog';
                const pIcon = pType === 'Cat' ? '🐈' : pType === 'Bird' ? '🦜' : pType === 'Rabbit' ? '🐇' : '🐕';
                clientPets = [{
                    name: extraData.petName,
                    type: pType,
                    breed: extraData.petBreed || 'Mixed Breed',
                    age: extraData.petAge || '1 Year',
                    icon: pIcon,
                    status: 'Active Client Pet 💉'
                }];
            } else {
                clientPets = [{
                    name: "Rocky",
                    type: "Dog",
                    breed: "Golden Retriever",
                    age: "2.5 Years",
                    icon: "🐕",
                    status: "Vaccinated 💉"
                }];
            }

            const clientRecord = {
                id: user.uid || ('client-' + Date.now()),
                uid: user.uid,
                name: displayName,
                email: user.email,
                phone: extraData.phone || '+92 321 4455667',
                pets: clientPets,
                avatar: extraData.avatar || '👤',
                loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                signedInAt: Date.now(),
                isCurrentSession: true
            };

            addClientToRoster(clientRecord);
            renderClients(currentClientFilter, currentClientSearch);
        }

        switchView(viewUser);

        // Update nav login button label to user name
        const navPill = document.querySelector('.nav-login-pill');
        if (navPill) {
            navPill.textContent = displayName.split(' ')[0];
        }

        const modeMsg = isDemo ? "(Demo Mode Simulation)" : "(Live Firebase Session)";
        showToast('success', `Welcome, ${displayName}!`, `Logged in as ${isDoctor ? 'Veti Doctor (Added to Duty Roster)' : 'Client (Added to Pets Directory)'} ${modeMsg}.`);
    }

    // 1. SIGN IN SUBMISSION
    if (formSignIn) {
        formSignIn.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formSignIn.querySelector('.btn-submit');
            const email = document.getElementById('signin-email').value.trim();
            const password = document.getElementById('signin-password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            // Doctor Specified Information Fields
            const docNameInput = document.getElementById('signin-doctor-name');
            const docName = docNameInput ? docNameInput.value.trim() : '';
            const licenseInput = document.getElementById('signin-license');
            const license = licenseInput ? licenseInput.value.trim() : '';
            const docSpecSelect = document.getElementById('signin-doctor-specialty');
            const specVal = docSpecSelect ? docSpecSelect.value : 'Chief Veterinary Surgeon|Department of Surgery & Orthopedics';
            const [docSpecialty, docDept] = specVal.split('|');
            const docRoomSelect = document.getElementById('signin-doctor-room');
            const docRoom = docRoomSelect ? docRoomSelect.value : 'Executive Surgery Suite 101';
            const docShiftSelect = document.getElementById('signin-doctor-shift');
            const docShift = docShiftSelect ? docShiftSelect.value : '08:00 AM - 04:00 PM (Morning)';
            const docStatusSelect = document.getElementById('signin-doctor-status');
            const docStatus = docStatusSelect ? docStatusSelect.value : 'onduty';

            // Client Pet Registration Fields on Sign In
            const petNameInput = document.getElementById('signin-pet-name');
            const petName = petNameInput ? petNameInput.value.trim() : '';
            const petTypeSelect = document.getElementById('signin-pet-type');
            const petType = petTypeSelect ? petTypeSelect.value : 'Dog';
            const petBreedInput = document.getElementById('signin-pet-breed');
            const petBreed = petBreedInput ? petBreedInput.value.trim() : '';

            // Role-specific Validations
            if (currentRole === 'doctor') {
                if (!docName) {
                    showToast('warning', 'Doctor Name Required 🩺', 'Doctor login ke liye apna Doctor Name enter karen.');
                    if (docNameInput) docNameInput.focus();
                    return;
                }
                if (!license) {
                    showToast('warning', 'License Required 🩺', 'Apna Medical License ya PVMC Registration number enter karen.');
                    if (licenseInput) licenseInput.focus();
                    return;
                }
            } else {
                if (!petName) {
                    showToast('warning', 'Pet Info Required 🐾', 'Pet Parent login ke liye apne Pet ka naam enter karen.');
                    if (petNameInput) petNameInput.focus();
                    return;
                }
            }

            if (!email || !password) {
                showToast('error', 'Fields Required', 'Please enter your email and password.');
                return;
            }

            try {
                setBtnLoading(btn, true);
                const extraPayload = {
                    license,
                    doctorName: docName,
                    specialty: docSpecialty || 'Chief Veterinary Surgeon',
                    dept: docDept || 'Department of Surgery & Orthopedics',
                    room: docRoom,
                    shift: docShift,
                    status: docStatus,
                    petName,
                    petType,
                    petBreed
                };
                const result = await window.VetiAuth.signIn(email, password, rememberMe, currentRole, license, extraPayload);
                const role = result.userRole || currentRole;
                handleLoginSuccess(result.user, role, result.isDemo, extraPayload);
            } catch (err) {
                showToast('error', 'Sign In Failed', err.message || 'Incorrect email or password.');
            } finally {
                setBtnLoading(btn, false);
            }
        });
    }

    // 2. SIGN UP SUBMISSION
    if (formSignUp) {
        formSignUp.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formSignUp.querySelector('.btn-submit');
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;

            const licenseInput = document.getElementById('signup-license');
            const license = licenseInput ? licenseInput.value.trim() : '';
            const specialtySelect = document.getElementById('signup-specialty');
            const specialty = specialtySelect ? specialtySelect.value : '';

            // Client Pet Registration Fields
            const petNameInput = document.getElementById('signup-pet-name');
            const petName = petNameInput ? petNameInput.value.trim() : '';
            const petTypeSelect = document.getElementById('signup-pet-type');
            const petType = petTypeSelect ? petTypeSelect.value : 'Dog';
            const petBreedInput = document.getElementById('signup-pet-breed');
            const petBreed = petBreedInput ? petBreedInput.value.trim() : '';
            const petAgeInput = document.getElementById('signup-pet-age');
            const petAge = petAgeInput ? petAgeInput.value.trim() : '';

            if (password !== confirm) {
                showToast('error', 'Password Mismatch', 'Passwords do not match. Please re-enter.');
                return;
            }

            try {
                setBtnLoading(btn, true);
                const extraPayload = { license, specialty, petName, petType, petBreed, petAge };
                const result = await window.VetiAuth.signUp(name, email, password, currentRole, extraPayload);
                const role = result.userRole || currentRole;
                handleLoginSuccess(result.user, role, result.isDemo, extraPayload);
            } catch (err) {
                showToast('error', 'Registration Failed', err.message);
            } finally {
                setBtnLoading(btn, false);
            }
        });
    }

    // 3. FORGOT PASSWORD SUBMISSION
    if (formForgot) {
        formForgot.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formForgot.querySelector('.btn-submit');
            const email = document.getElementById('forgot-email').value.trim();

            if (!email) {
                showToast('error', 'Email Required', 'Please enter your registered email address.');
                return;
            }

            try {
                setBtnLoading(btn, true);
                const result = await window.VetiAuth.resetPassword(email);
                showToast('success', 'Reset Link Dispatched', result.isDemo ? 'Demo Mode: Reset simulated!' : 'Check your inbox for password reset instructions.');
                setTimeout(() => switchView(viewSignIn), 1600);
            } catch (err) {
                showToast('error', 'Reset Failed', err.message);
            } finally {
                setBtnLoading(btn, false);
            }
        });
    }

    // 4. GOOGLE AUTH HANDLER
    async function handleGoogleAuth() {
        try {
            const result = await window.VetiAuth.signInWithGoogle(currentRole);
            const role = result.userRole || currentRole;
            handleLoginSuccess(result.user, role, result.isDemo);
        } catch (err) {
            showToast('error', 'Google Sign In Failed', err.message);
        }
    }

    if (btnGoogleSignIn) btnGoogleSignIn.addEventListener('click', handleGoogleAuth);
    if (btnGoogleSignUp) btnGoogleSignUp.addEventListener('click', handleGoogleAuth);

    // 5. SIGN OUT HANDLER
    if (btnSignOut) {
        btnSignOut.addEventListener('click', async () => {
            const currentUid = sessionStorage.getItem('veti_current_user_uid');
            const currentEmail = sessionStorage.getItem('veti_current_user_email');
            const currentRole = sessionStorage.getItem('veti_current_user_role');

            if (currentRole === 'doctor') {
                removeDoctorFromRoster(currentUid || currentEmail);
                renderDoctors(currentDutyFilter, currentDutySearch);
                showToast('info', 'Doctor Off Duty', 'Doctor signed out and removed from live duty roster.');
            } else if (currentRole === 'client') {
                removeClientFromRoster(currentUid || currentEmail);
                renderClients(currentClientFilter, currentClientSearch);
                showToast('info', 'Client Logged Out', 'Client and pet profile signed out.');
            }

            sessionStorage.removeItem('veti_current_user_uid');
            sessionStorage.removeItem('veti_current_user_email');
            sessionStorage.removeItem('veti_current_user_role');

            await window.VetiAuth.signOut();
            showToast('info', 'Logged Out', 'You have been safely signed out.');
            if (formSignIn) formSignIn.reset();
            if (formSignUp) formSignUp.reset();
            const navPill = document.querySelector('.nav-login-pill');
            if (navPill) navPill.textContent = 'Sign In';
            switchView(viewSignIn);
        });
    }

    // =============================================================
    // Dynamic Signed-In Doctors Live Roster System
    // =============================================================
    // Dynamic Doctors On-Duty Live Directory System
    // Verified Veterinary Faculty & Live Real-Time Roster
    // =============================================================
    const DOCTORS_STORAGE_KEY = 'veti_active_doctors';

    const DEFAULT_VERIFIED_DOCTORS = [
        {
            id: "doc-farhan-qureshi",
            uid: "doc-farhan-qureshi",
            name: "Dr. Farhan Qureshi",
            email: "dr.farhan@vetimedicos.com",
            specialty: "Chief Veterinary Surgeon & Orthopedics",
            license: "VET-PK-2026-DVM",
            dept: "Department of Surgery & Advanced Orthopedics",
            avatar: "👨‍⚕️",
            room: "Executive Surgery Suite 101",
            status: "onduty",
            statusLabel: "On Duty",
            statusClass: "on-duty",
            experience: "16+ Yrs Exp",
            loginTime: "08:30 AM"
        },
        {
            id: "doc-ayesha-malik",
            uid: "doc-ayesha-malik",
            name: "Dr. Ayesha Malik",
            email: "dr.ayesha@vetimedicos.com",
            specialty: "Senior Canine Diagnostics & Cardiology Lead",
            license: "VET-PK-102-DVM",
            dept: "Canine Wellness OPD Block A",
            avatar: "👩‍⚕️",
            room: "OPD Room 103",
            status: "onduty",
            statusLabel: "On Duty",
            statusClass: "on-duty",
            experience: "12+ Yrs Exp",
            loginTime: "09:00 AM"
        },
        {
            id: "doc-hamza-tariq",
            uid: "doc-hamza-tariq",
            name: "Dr. Hamza Tariq",
            email: "dr.hamza@vetimedicos.com",
            specialty: "Senior Feline & Exotic Avian Specialist",
            license: "VET-PK-308-DVM",
            dept: "Feline Sanctuary & Avian Surgery",
            avatar: "👨‍⚕️",
            room: "Cat Sanctuary Suite 202",
            status: "surgery",
            statusLabel: "In Surgery",
            statusClass: "in-surgery",
            experience: "10+ Yrs Exp",
            loginTime: "09:15 AM"
        },
        {
            id: "doc-zainab-bilal",
            uid: "doc-zainab-bilal",
            name: "Dr. Zainab Bilal",
            email: "dr.zainab@vetimedicos.com",
            specialty: "Veterinary Dermatology & Allergy Consultant",
            license: "VET-PK-415-DVM",
            dept: "Dermatology & Clinical Aesthetics",
            avatar: "👩‍⚕️",
            room: "Consultation Suite 105",
            status: "consultation",
            statusLabel: "In Consult",
            statusClass: "in-consultation",
            experience: "8+ Yrs Exp",
            loginTime: "09:45 AM"
        },
        {
            id: "doc-bilal-rehman",
            uid: "doc-bilal-rehman",
            name: "Dr. Bilal Rehman",
            email: "dr.bilal@vetimedicos.com",
            specialty: "Critical Care & Emergency ICU Director",
            license: "VET-PK-520-DVM",
            dept: "24/7 Rapid Emergency Trauma Wing",
            avatar: "👨‍⚕️",
            room: "Trauma Resuscitation E-1",
            status: "onduty",
            statusLabel: "On Duty",
            statusClass: "on-duty",
            experience: "14+ Yrs Exp",
            loginTime: "08:00 AM"
        },
        {
            id: "doc-mahnoor-shah",
            uid: "doc-mahnoor-shah",
            name: "Dr. Mahnoor Shah",
            email: "dr.mahnoor@vetimedicos.com",
            specialty: "Veterinary Dentist & Dental Reconstruction",
            license: "VET-PK-633-DVM",
            dept: "Oral Health & Dental Lab",
            avatar: "👩‍⚕️",
            room: "Dental Lab 108",
            status: "onduty",
            statusLabel: "On Duty",
            statusClass: "on-duty",
            experience: "9+ Yrs Exp",
            loginTime: "10:00 AM"
        }
    ];

    function getActiveDoctors() {
        try {
            const raw = localStorage.getItem(DOCTORS_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Error reading active doctors from storage", e);
        }
        // Seed default verified faculty so directory is full & authentic
        try {
            localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(DEFAULT_VERIFIED_DOCTORS));
        } catch (e) {}
        return DEFAULT_VERIFIED_DOCTORS;
    }

    function saveActiveDoctors(doctors) {
        try {
            localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(doctors));
        } catch (e) {
            console.error("Error saving active doctors to storage", e);
        }
        updateFilterCounts();
    }

    function addDoctorToRoster(doctorData) {
        const doctors = getActiveDoctors();
        const existingIdx = doctors.findIndex(d => 
            (d.id && d.id === doctorData.id) || 
            (d.email && d.email.toLowerCase() === doctorData.email.toLowerCase())
        );

        if (existingIdx >= 0) {
            doctors[existingIdx] = { ...doctors[existingIdx], ...doctorData };
        } else {
            doctors.unshift(doctorData);
        }

        saveActiveDoctors(doctors);

        // Sync to Firebase Realtime Database if live
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            try {
                const db = window.firebase.database();
                db.ref('active_doctors/' + (doctorData.id || doctorData.uid)).set(doctorData);
            } catch (err) {
                console.warn("Firebase active_doctors sync skipped:", err);
            }
        }
    }

    function removeDoctorFromRoster(doctorIdOrEmail) {
        if (!doctorIdOrEmail) return;
        const doctors = getActiveDoctors();
        const updated = doctors.filter(d => 
            d.id !== doctorIdOrEmail && 
            d.uid !== doctorIdOrEmail && 
            d.email !== doctorIdOrEmail
        );

        saveActiveDoctors(updated);

        // Remove from Firebase Realtime Database if live
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            try {
                const db = window.firebase.database();
                db.ref('active_doctors/' + doctorIdOrEmail).remove();
            } catch (err) {
                console.warn("Firebase active_doctors removal skipped:", err);
            }
        }
    }

    function updateDoctorStatus(doctorId, newStatus, newLabel, newClass) {
        const doctors = getActiveDoctors();
        const doc = doctors.find(d => d.id === doctorId || d.uid === doctorId);
        if (doc) {
            doc.status = newStatus;
            doc.statusLabel = newLabel;
            doc.statusClass = newClass;
            saveActiveDoctors(doctors);
            renderDoctors(currentDutyFilter, currentDutySearch);
            showToast('info', 'Status Updated', `${doc.name} duty status is now: ${newLabel}`);
        }
    }

    function updateFilterCounts() {
        const docs = getActiveDoctors();
        const allCount = docs.length;
        const onDutyCount = docs.filter(d => d.status === 'onduty').length;
        const surgeryCount = docs.filter(d => d.status === 'surgery').length;
        const consultCount = docs.filter(d => d.status === 'consultation').length;

        const chipAll = document.querySelector('.duty-filter-chip[data-filter="all"]');
        const chipOnDuty = document.querySelector('.duty-filter-chip[data-filter="onduty"]');
        const chipSurgery = document.querySelector('.duty-filter-chip[data-filter="surgery"]');
        const chipConsult = document.querySelector('.duty-filter-chip[data-filter="consultation"]');

        if (chipAll) chipAll.textContent = `All Signed In (${allCount})`;
        if (chipOnDuty) chipOnDuty.textContent = `🟢 On Duty (${onDutyCount})`;
        if (chipSurgery) chipSurgery.textContent = `🟡 In Surgery (${surgeryCount})`;
        if (chipConsult) chipConsult.textContent = `🔵 In Consult (${consultCount})`;

        // Standalone Page Stats Counters
        const statTotal = document.getElementById('roster-stat-total');
        const statOnDuty = document.getElementById('roster-stat-onduty');
        const statSurgery = document.getElementById('roster-stat-surgery');
        const statConsult = document.getElementById('roster-stat-consult');

        if (statTotal) statTotal.textContent = allCount;
        if (statOnDuty) statOnDuty.textContent = onDutyCount;
        if (statSurgery) statSurgery.textContent = surgeryCount;
        if (statConsult) statConsult.textContent = consultCount;

        const liveBadge = document.querySelector('.duty-live-badge');
        if (liveBadge) {
            if (allCount > 0) {
                liveBadge.innerHTML = `<span class="pulse-green"></span> Live OPD Roster (${allCount} Online)`;
                liveBadge.style.background = '#ecfdf5';
                liveBadge.style.color = '#065f46';
                liveBadge.style.borderColor = '#a7f3d0';
            } else {
                liveBadge.innerHTML = `<span style="width:8px;height:8px;background:#94a3b8;border-radius:50%;display:inline-block;"></span> No Doctors Online`;
                liveBadge.style.background = '#f1f5f9';
                liveBadge.style.color = '#64748b';
                liveBadge.style.borderColor = '#cbd5e1';
            }
        }
    }

    // Quick Test Doctor Login Simulation
    window.quickTestDoctorLogin = function(doctorChoice = 'farhan') {
        let testDoc;
        if (doctorChoice === 'ayesha') {
            testDoc = {
                displayName: "Dr. Ayesha Malik",
                email: "dr.ayesha@veticare.com",
                uid: "demo-doc-ayesha-" + Math.floor(Math.random() * 1000),
                userRole: "doctor"
            };
            handleLoginSuccess(testDoc, 'doctor', true, {
                specialty: "Canine Health & Dog Diagnostics",
                license: "VET-PK-102-DVM",
                dept: "Canine Wellness OPD Block A",
                avatar: "👩‍⚕️",
                room: "OPD Room 103"
            });
        } else {
            testDoc = {
                displayName: "Dr. Farhan Qureshi",
                email: "dr.farhan@veticare.com",
                uid: "demo-doc-farhan-" + Math.floor(Math.random() * 1000),
                userRole: "doctor"
            };
            handleLoginSuccess(testDoc, 'doctor', true, {
                specialty: "Chief Veterinary Surgeon",
                license: "VET-PK-2026-DVM",
                dept: "Department of Surgery & Orthopedics",
                avatar: "👨‍⚕️",
                room: "Executive Surgery Suite 101"
            });
        }
        openDutyModal();
        showToast('success', 'Doctor Signed In! 🩺', `${testDoc.displayName} signed in as Doctor and is now active on duty.`);
    };

    // Doctors Modal DOM Elements
    const dutyModal = document.getElementById('doctors-duty-modal');
    const dutyModalCloseBtn = document.getElementById('duty-modal-close-btn');
    const dutyGrid = document.getElementById('doctors-duty-grid');
    const dutySearchInput = document.getElementById('duty-search-input');
    const dutyFilterChips = document.querySelectorAll('.duty-filter-chip');
    const dutyQuickDemoBtn = document.getElementById('duty-quick-demo-btn');

    // Trigger Elements
    const navTeamLink = document.getElementById('nav-team-link');
    const heroDutyRosterBtn = document.getElementById('hero-duty-roster-btn');
    const pillDutyTrigger = document.getElementById('pill-duty-trigger');
    const authDutyLink = document.getElementById('auth-duty-link');

    let currentDutyFilter = 'all';
    let currentDutySearch = '';

    function openDutyModal() {
        if (!dutyModal) return;
        renderDoctors(currentDutyFilter, currentDutySearch);
        dutyModal.classList.add('open');
        window.setModalScrollLock(true);
    }

    function closeDutyModal() {
        if (!dutyModal) return;
        dutyModal.classList.remove('open');
        window.setModalScrollLock(false);
    }

    function renderDoctors(filter = 'all', search = '') {
        if (!dutyGrid) return;
        updateFilterCounts();

        const allActive = getActiveDoctors();

        // 1. EMPTY STATE: When NO doctor has signed in yet
        if (allActive.length === 0) {
            dutyGrid.innerHTML = `
                <div class="duty-empty-container">
                    <div class="duty-empty-icon-ring">
                        <span class="duty-empty-emoji">🩺</span>
                    </div>
                    <h3 class="duty-empty-title">Koi Doctor Is Waqt Signed In Nahi Hai</h3>
                    <p class="duty-empty-sub">
                        Is list mein sirf wahi veterinary doctors show honge jinhon ne <strong>"Veti Doctor"</strong> role se Sign In kiya ho. Jab koi doctor login karega, wo foran yahan live show ho jayega.
                    </p>
                    <div class="duty-empty-btns">
                        <button type="button" class="btn-duty-empty-login" id="btn-empty-doctor-login">
                            <span>🔐</span> Doctor Staff Sign In
                        </button>
                        <button type="button" class="btn-duty-empty-quick" id="btn-quick-doctor-demo">
                            <span>⚡</span> Quick Test Sign In (Dr. Farhan Qureshi)
                        </button>
                    </div>
                </div>
            `;

            // Attach listeners to empty state buttons
            const btnEmptyLogin = document.getElementById('btn-empty-doctor-login');
            if (btnEmptyLogin) {
                btnEmptyLogin.addEventListener('click', () => {
                    closeDutyModal();
                    openAuthModal('doctor', 'signin');
                });
            }

            const btnEmptyQuick = document.getElementById('btn-quick-doctor-demo');
            if (btnEmptyQuick) {
                btnEmptyQuick.addEventListener('click', () => {
                    window.quickTestDoctorLogin('farhan');
                });
            }
            return;
        }

        // 2. FILTERING SIGNED-IN DOCTORS
        const filtered = allActive.filter(doc => {
            // Status Filter
            let matchesStatus = true;
            if (filter === 'onduty') matchesStatus = doc.status === 'onduty';
            else if (filter === 'surgery') matchesStatus = doc.status === 'surgery';
            else if (filter === 'consultation') matchesStatus = doc.status === 'consultation';

            // Search Filter
            let matchesSearch = true;
            if (search.trim()) {
                const q = search.toLowerCase();
                matchesSearch = doc.name.toLowerCase().includes(q) ||
                                (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
                                (doc.dept && doc.dept.toLowerCase().includes(q)) ||
                                (doc.room && doc.room.toLowerCase().includes(q));
            }

            return matchesStatus && matchesSearch;
        });

        if (filtered.length === 0) {
            dutyGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.7); border-radius: 16px;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
                    <h3 style="color: #0f172a; margin-bottom: 4px;">No Signed-In Doctor Matches Filter</h3>
                    <p style="color: #64748b; font-size: 0.85rem;">Try selecting "All Signed In" or clearing search terms.</p>
                </div>
            `;
            return;
        }

        // 3. RENDER ACTIVE SIGNED-IN DOCTORS
        dutyGrid.innerHTML = filtered.map(doc => {
            const onlineClass = doc.status === 'onduty' ? 'on-duty' :
                               doc.status === 'surgery' ? 'in-surgery' :
                               doc.status === 'consultation' ? 'in-consultation' : 'off-duty';

            return `
                <div class="duty-doctor-card" data-doctor-id="${doc.id}">
                    <div class="doctor-card-top">
                        <div class="doctor-avatar-wrap">
                            ${doc.avatar || '👨‍⚕️'}
                            <span class="doctor-online-dot ${onlineClass}" title="${doc.statusLabel}"></span>
                        </div>
                        <div class="doctor-info-wrap">
                            <div class="doctor-name-row">
                                <h3 class="doctor-name">${doc.name}</h3>
                                <span class="doctor-signed-in-pill">Active Live</span>
                            </div>
                            <div class="doctor-specialty">${doc.specialty || 'Veterinary Surgeon'}</div>
                            <div class="doctor-dept">${doc.dept || 'Department of Clinical Care'}</div>
                        </div>
                    </div>

                    <div class="doctor-duty-meta">
                        <div class="meta-row">
                            <span class="meta-label">
                                <span>🩺</span> Current Duty:
                            </span>
                            <span class="status-pill-badge ${doc.statusClass || 'status-onduty'}">
                                <span class="pulse-green" style="width:6px; height:6px; background:currentColor; border-radius:50%; display:inline-block;"></span>
                                ${doc.statusLabel || 'On Duty Now'}
                            </span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">
                                <span>⏰</span> Shift Details:
                            </span>
                            <span class="meta-value">${doc.shift || 'Logged In Shift'}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">
                                <span>📍</span> Clinic Chamber:
                            </span>
                            <span class="meta-value" style="color: #0284c7;">${doc.room || 'Room 101'}</span>
                        </div>
                    </div>

                    <div class="doctor-card-footer">
                        <div class="doctor-actions-row">
                            <button type="button" class="btn-doc-status-toggle" data-doc-id="${doc.id}" title="Toggle between On Duty, Surgery, Consultation">
                                🔄 Status
                            </button>
                            <button type="button" class="btn-doc-offduty" data-doc-id="${doc.id}" title="Sign Out this doctor from active duty">
                                🚪 Sign Out
                            </button>
                        </div>
                        <button type="button" class="btn-book-consult" data-doctor-name="${doc.name}" data-room="${doc.room || 'Room 101'}">
                            Consult Now 💬
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach listeners to Consult buttons
        dutyGrid.querySelectorAll('.btn-book-consult').forEach(btn => {
            btn.addEventListener('click', () => {
                const docName = btn.getAttribute('data-doctor-name');
                const room = btn.getAttribute('data-room');
                const tokenNum = Math.floor(Math.random() * 20) + 1;
                showToast('success', 'OPD Token Issued', `Token #${tokenNum} generated for ${docName} at ${room}. Please proceed to reception.`);
            });
        });

        // Attach listeners for doctor status toggle
        dutyGrid.querySelectorAll('.btn-doc-status-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc-id');
                const doctors = getActiveDoctors();
                const doc = doctors.find(d => d.id === docId || d.uid === docId);
                if (!doc) return;

                if (doc.status === 'onduty') {
                    updateDoctorStatus(docId, 'surgery', 'In Surgery', 'status-surgery');
                } else if (doc.status === 'surgery') {
                    updateDoctorStatus(docId, 'consultation', 'In Consultation', 'status-consult');
                } else {
                    updateDoctorStatus(docId, 'onduty', 'On Duty Now', 'status-onduty');
                }
            });
        });

        // Attach listeners for doctor off-duty / sign out
        dutyGrid.querySelectorAll('.btn-doc-offduty').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc-id');
                const doc = getActiveDoctors().find(d => d.id === docId || d.uid === docId);
                removeDoctorFromRoster(docId);
                renderDoctors(currentDutyFilter, currentDutySearch);
                showToast('info', 'Doctor Off Duty', `${doc ? doc.name : 'Doctor'} has signed out and was removed from the live roster.`);
            });
        });
    }

    // Attach trigger listeners
    if (navTeamLink) {
        navTeamLink.addEventListener('click', (e) => {
            const href = navTeamLink.getAttribute('href') || '';
            if (href.includes('doctors.html')) {
                return;
            }
            e.preventDefault();
            window.location.href = 'doctors.html';
        });
    }

    // Staff login switch inside Doctor Portal
    const dutyToStaffLoginBtn = document.getElementById('duty-to-staff-login-btn');
    if (dutyToStaffLoginBtn) {
        dutyToStaffLoginBtn.addEventListener('click', () => {
            if (dutyModal) closeDutyModal();
            openAuthModal('doctor', 'signin');
            showToast('info', 'Staff Access', 'Opening Doctor Staff Login Portal.');
        });
    }

    // Header Quick Test Doctor button
    if (dutyQuickDemoBtn) {
        dutyQuickDemoBtn.addEventListener('click', () => {
            const docs = getActiveDoctors();
            const hasFarhan = docs.some(d => d.name && d.name.includes('Farhan'));
            if (hasFarhan) {
                window.quickTestDoctorLogin('ayesha');
            } else {
                window.quickTestDoctorLogin('farhan');
            }
        });
    }

    if (pillDutyTrigger) {
        pillDutyTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'doctors.html';
        });
    }

    const heroSecondaryBtn = document.getElementById('hero-secondary-btn');
    if (heroSecondaryBtn) {
        heroSecondaryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'doctors.html';
        });
    }

    if (authDutyLink) {
        authDutyLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAuthModal();
            openDutyModal();
        });
    }

    const authClientsLink = document.getElementById('auth-clients-link');
    if (authClientsLink) {
        authClientsLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAuthModal();
            openClientsModal();
        });
    }

    if (dutyModalCloseBtn) {
        dutyModalCloseBtn.addEventListener('click', closeDutyModal);
    }

    if (dutyModal) {
        dutyModal.addEventListener('click', (e) => {
            if (e.target === dutyModal) {
                closeDutyModal();
            }
        });
    }

    // Search Input Listener
    if (dutySearchInput) {
        dutySearchInput.addEventListener('input', (e) => {
            currentDutySearch = e.target.value;
            renderDoctors(currentDutyFilter, currentDutySearch);
        });
    }

    // Filter Chips Listeners
    dutyFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            dutyFilterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentDutyFilter = chip.getAttribute('data-filter');
            renderDoctors(currentDutyFilter, currentDutySearch);
        });
    });

    // Cross-tab synchronization via storage event
    window.addEventListener('storage', (e) => {
        if (e.key === DOCTORS_STORAGE_KEY) {
            renderDoctors(currentDutyFilter, currentDutySearch);
        }
    });

    // =============================================================
    // Dynamic Signed-In Clients & Pets Live Directory System
    // Verified VIP Pet Parents & Companions Registry
    // =============================================================
    const CLIENTS_STORAGE_KEY = 'veti_active_clients';

    const DEFAULT_VERIFIED_CLIENTS = [
        {
            id: "client-hamza-khan",
            uid: "client-hamza-khan",
            name: "Hamza Khan",
            email: "hamza.khan@petparent.com",
            tier: "Diamond VIP Member",
            avatar: "👨",
            phone: "+92 300 8541290",
            loginTime: "09:30 AM",
            pets: [
                {
                    name: "Rocky",
                    type: "Dog",
                    breed: "Golden Retriever",
                    age: "2.5 Years",
                    status: "Fully Vaccinated 💉 • Microchipped",
                    icon: "🐕"
                },
                {
                    name: "Max",
                    type: "Dog",
                    breed: "German Shepherd",
                    age: "4 Years",
                    status: "Fit for Agility & Patrol 🩺",
                    icon: "🐕"
                }
            ]
        },
        {
            id: "client-sara-malik",
            uid: "client-sara-malik",
            name: "Sara Malik",
            email: "sara.malik@petparent.com",
            tier: "Platinum Royal Member",
            avatar: "👩",
            phone: "+92 321 9845123",
            loginTime: "10:15 AM",
            pets: [
                {
                    name: "Bella",
                    type: "Cat",
                    breed: "Persian Cat",
                    age: "1.5 Years",
                    status: "Royal Spa & Coat Polished ✨",
                    icon: "🐈"
                },
                {
                    name: "Milo",
                    type: "Cat",
                    breed: "British Shorthair",
                    age: "8 Months",
                    status: "Vaccine Booster Complete 💉",
                    icon: "🐈"
                }
            ]
        },
        {
            id: "client-daniyal-ahmed",
            uid: "client-daniyal-ahmed",
            name: "Daniyal Ahmed",
            email: "daniyal.ahmed@petparent.com",
            tier: "Gold Sanctuary Pass",
            avatar: "👨",
            phone: "+92 333 4455667",
            loginTime: "11:00 AM",
            pets: [
                {
                    name: "Coco",
                    type: "Bird",
                    breed: "African Grey Parrot",
                    age: "3 Years",
                    status: "Beak & Feather Check Normal 🦜",
                    icon: "🦜"
                }
            ]
        },
        {
            id: "client-zoya-qureshi",
            uid: "client-zoya-qureshi",
            name: "Zoya Qureshi",
            email: "zoya.q@petparent.com",
            tier: "Platinum Royal Member",
            avatar: "👩",
            phone: "+92 312 7788990",
            loginTime: "11:45 AM",
            pets: [
                {
                    name: "Leo",
                    type: "Dog",
                    breed: "Siberian Husky",
                    age: "3 Years",
                    status: "Cardiac Endurance Verified 🩺",
                    icon: "🐕"
                }
            ]
        },
        {
            id: "client-usman-maria",
            uid: "client-usman-maria",
            name: "Usman & Maria Ali",
            email: "usman.maria@petparent.com",
            tier: "Diamond VIP Member",
            avatar: "👫",
            phone: "+92 345 1122334",
            loginTime: "12:10 PM",
            pets: [
                {
                    name: "Fluffy",
                    type: "Rabbit",
                    breed: "Angora Bunny",
                    age: "1 Year",
                    status: "Dental Check & Grooming 🐇",
                    icon: "🐇"
                },
                {
                    name: "Oliver",
                    type: "Cat",
                    breed: "Ragdoll Feline",
                    age: "2 Years",
                    status: "Annual Ultrasound Clear 🩺",
                    icon: "🐈"
                }
            ]
        }
    ];

    function getActiveClients() {
        try {
            const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Error reading active clients from storage", e);
        }
        // Seed default verified clients
        try {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_VERIFIED_CLIENTS));
        } catch (e) {}
        return DEFAULT_VERIFIED_CLIENTS;
    }

    function saveActiveClients(clients) {
        try {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
        } catch (e) {
            console.error("Error saving active clients to storage", e);
        }
        updateClientFilterCounts();
    }

    function addClientToRoster(clientData) {
        const clients = getActiveClients();
        const existingIdx = clients.findIndex(c => 
            (c.id && c.id === clientData.id) || 
            (c.email && c.email.toLowerCase() === clientData.email.toLowerCase())
        );

        if (existingIdx >= 0) {
            clients[existingIdx] = { ...clients[existingIdx], ...clientData };
        } else {
            clients.unshift(clientData);
        }

        saveActiveClients(clients);

        // Sync to Firebase Realtime Database if live
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            try {
                const db = window.firebase.database();
                db.ref('active_clients/' + (clientData.id || clientData.uid)).set(clientData);
            } catch (err) {
                console.warn("Firebase active_clients sync skipped:", err);
            }
        }
    }

    function removeClientFromRoster(clientIdOrEmail) {
        if (!clientIdOrEmail) return;
        const clients = getActiveClients();
        const updated = clients.filter(c => 
            c.id !== clientIdOrEmail && 
            c.uid !== clientIdOrEmail && 
            c.email !== clientIdOrEmail
        );

        saveActiveClients(updated);

        // Remove from Firebase Realtime Database if live
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            try {
                const db = window.firebase.database();
                db.ref('active_clients/' + clientIdOrEmail).remove();
            } catch (err) {
                console.warn("Firebase active_clients removal skipped:", err);
            }
        }
    }

    function updateClientFilterCounts() {
        const clients = getActiveClients();
        const allCount = clients.length;

        let dogCount = 0;
        let catCount = 0;
        let otherCount = 0;

        clients.forEach(c => {
            (c.pets || []).forEach(p => {
                const pType = (p.type || '').toLowerCase();
                if (pType.includes('dog')) dogCount++;
                else if (pType.includes('cat')) catCount++;
                else otherCount++;
            });
        });

        const chipAll = document.querySelector('.client-filter-chip[data-filter="all"]');
        const chipDog = document.querySelector('.client-filter-chip[data-filter="Dog"]');
        const chipCat = document.querySelector('.client-filter-chip[data-filter="Cat"]');
        const chipOther = document.querySelector('.client-filter-chip[data-filter="other"]');

        if (chipAll) chipAll.textContent = `All Clients (${allCount})`;
        if (chipDog) chipDog.textContent = `🐕 Dogs (${dogCount})`;
        if (chipCat) chipCat.textContent = `🐈 Cats (${catCount})`;
        if (chipOther) chipOther.textContent = `🦜 Birds & Others (${otherCount})`;

        // Standalone Page Stats Counters
        const cStatTotal = document.getElementById('clients-stat-total');
        const cStatDogs = document.getElementById('clients-stat-dogs');
        const cStatCats = document.getElementById('clients-stat-cats');
        const cStatOthers = document.getElementById('clients-stat-others');

        if (cStatTotal) cStatTotal.textContent = allCount;
        if (cStatDogs) cStatDogs.textContent = dogCount;
        if (cStatCats) cStatCats.textContent = catCount;
        if (cStatOthers) cStatOthers.textContent = otherCount;

        const liveBadge = document.getElementById('clients-live-badge');
        if (liveBadge) {
            if (allCount > 0) {
                liveBadge.innerHTML = `<span class="pulse-green" style="background:#0284c7; box-shadow:0 0 10px #0284c7;"></span> Live Clients (${allCount} Online)`;
                liveBadge.style.background = '#e0f2fe';
                liveBadge.style.color = '#0369a1';
                liveBadge.style.borderColor = '#bae6fd';
            } else {
                liveBadge.innerHTML = `<span style="width:8px;height:8px;background:#94a3b8;border-radius:50%;display:inline-block;"></span> No Clients Online`;
                liveBadge.style.background = '#f1f5f9';
                liveBadge.style.color = '#64748b';
                liveBadge.style.borderColor = '#cbd5e1';
            }
        }
    }

    // Quick Test Client Login Simulation
    window.quickTestClientLogin = function(clientChoice = 'hamza') {
        let testClient;
        if (clientChoice === 'sara') {
            testClient = {
                displayName: "Sara Malik",
                email: "sara.malik@petparent.com",
                uid: "demo-client-sara-" + Math.floor(Math.random() * 1000),
                userRole: "client"
            };
            handleLoginSuccess(testClient, 'client', true, {
                pets: [
                    {
                        name: "Bella",
                        type: "Cat",
                        breed: "Persian Cat",
                        age: "1.5 Years",
                        icon: "🐈",
                        status: "Vaccinated 💉"
                    },
                    {
                        name: "Mochi",
                        type: "Rabbit",
                        breed: "Holland Lop",
                        age: "8 Months",
                        icon: "🐇",
                        status: "Healthy 🥕"
                    }
                ],
                phone: "+92 301 5558899"
            });
        } else {
            testClient = {
                displayName: "Hamza Khan",
                email: "hamza.khan@petparent.com",
                uid: "demo-client-hamza-" + Math.floor(Math.random() * 1000),
                userRole: "client"
            };
            handleLoginSuccess(testClient, 'client', true, {
                pets: [
                    {
                        name: "Rocky",
                        type: "Dog",
                        breed: "Golden Retriever",
                        age: "2.5 Years",
                        icon: "🐕",
                        status: "Up to Date 💉"
                    }
                ],
                phone: "+92 321 7766554"
            });
        }
        openClientsModal();
        showToast('success', 'Client Signed In! 🐾', `${testClient.displayName} and pets are now live in the Clients Directory.`);
    };

    // Clients Modal DOM Elements
    const clientsModal = document.getElementById('clients-directory-modal');
    const clientsModalCloseBtn = document.getElementById('clients-modal-close-btn');
    const clientsGrid = document.getElementById('clients-directory-grid');
    const clientsSearchInput = document.getElementById('clients-search-input');
    const clientFilterChips = document.querySelectorAll('.client-filter-chip');
    const clientsQuickDemoBtn = document.getElementById('clients-quick-demo-btn');
    const clientsToLoginBtn = document.getElementById('clients-to-login-btn');
    const navClientsLink = document.getElementById('nav-clients-link');

    let currentClientFilter = 'all';
    let currentClientSearch = '';

    function openClientsModal() {
        if (!clientsModal) return;
        renderClients(currentClientFilter, currentClientSearch);
        clientsModal.classList.add('open');
        window.setModalScrollLock(true);
    }

    function closeClientsModal() {
        if (!clientsModal) return;
        clientsModal.classList.remove('open');
        window.setModalScrollLock(false);
    }

    function renderClients(filter = 'all', search = '') {
        if (!clientsGrid) return;
        updateClientFilterCounts();

        const allActive = getActiveClients();

        // 1. EMPTY STATE: When NO client has signed in yet
        if (allActive.length === 0) {
            clientsGrid.innerHTML = `
                <div class="duty-empty-container" style="background: rgba(240, 249, 255, 0.88); border-color: #93c5fd;">
                    <div class="duty-empty-icon-ring" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #bfdbfe;">
                        <span class="duty-empty-emoji">🐾</span>
                    </div>
                    <h3 class="duty-empty-title">Koi Client Is Waqt Signed In Nahi Hai</h3>
                    <p class="duty-empty-sub">
                        Is list mein sirf wahi Pet Parents &amp; Clients show honge jinhon ne <strong>"Client"</strong> account se Sign In kiya ho, sath hi unke registered pets ki mukammal profile show hogi.
                    </p>
                    <div class="duty-empty-btns">
                        <button type="button" class="btn-duty-empty-login" id="btn-empty-client-login" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
                            <span>🔐</span> Client Sign In / Register
                        </button>
                        <button type="button" class="btn-duty-empty-quick" id="btn-quick-client-demo">
                            <span>⚡</span> Quick Test Sign In (Hamza &amp; Rocky 🐕)
                        </button>
                    </div>
                </div>
            `;

            // Attach listeners to empty state buttons
            const btnEmptyLogin = document.getElementById('btn-empty-client-login');
            if (btnEmptyLogin) {
                btnEmptyLogin.addEventListener('click', () => {
                    closeClientsModal();
                    openAuthModal('client', 'signin');
                });
            }

            const btnEmptyQuick = document.getElementById('btn-quick-client-demo');
            if (btnEmptyQuick) {
                btnEmptyQuick.addEventListener('click', () => {
                    window.quickTestClientLogin('hamza');
                });
            }
            return;
        }

        // 2. FILTERING SIGNED-IN CLIENTS
        const filtered = allActive.filter(client => {
            // Species Filter
            let matchesSpecies = true;
            if (filter === 'Dog') {
                matchesSpecies = (client.pets || []).some(p => (p.type || '').toLowerCase().includes('dog'));
            } else if (filter === 'Cat') {
                matchesSpecies = (client.pets || []).some(p => (p.type || '').toLowerCase().includes('cat'));
            } else if (filter === 'other') {
                matchesSpecies = (client.pets || []).some(p => {
                    const t = (p.type || '').toLowerCase();
                    return !t.includes('dog') && !t.includes('cat');
                });
            }

            // Search Filter
            let matchesSearch = true;
            if (search.trim()) {
                const q = search.toLowerCase();
                const petsMatch = (client.pets || []).some(p => 
                    (p.name && p.name.toLowerCase().includes(q)) || 
                    (p.breed && p.breed.toLowerCase().includes(q)) ||
                    (p.type && p.type.toLowerCase().includes(q))
                );
                matchesSearch = (client.name && client.name.toLowerCase().includes(q)) ||
                                (client.email && client.email.toLowerCase().includes(q)) ||
                                petsMatch;
            }

            return matchesSpecies && matchesSearch;
        });

        if (filtered.length === 0) {
            clientsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.7); border-radius: 16px;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
                    <h3 style="color: #0f172a; margin-bottom: 4px;">No Signed-In Clients Match Filter</h3>
                    <p style="color: #64748b; font-size: 0.85rem;">Try selecting "All Clients" or clearing search terms.</p>
                </div>
            `;
            return;
        }

        // 3. RENDER ACTIVE SIGNED-IN CLIENTS & PETS
        clientsGrid.innerHTML = filtered.map(client => {
            const petsList = client.pets && client.pets.length > 0 ? client.pets : [
                { name: "Pet", type: "Dog", breed: "Beloved Pet", age: "1 Year", icon: "🐕", status: "Healthy" }
            ];

            return `
                <div class="duty-client-card" data-client-id="${client.id}">
                    <div class="client-card-top">
                        <div class="client-avatar-wrap">
                            ${client.avatar || '👤'}
                            <span class="doctor-online-dot on-duty" title="Signed In Now"></span>
                        </div>
                        <div class="client-info-wrap">
                            <div class="doctor-name-row">
                                <h3 class="doctor-name">${client.name}</h3>
                                <span class="client-verified-pill">🐾 Pet Parent</span>
                            </div>
                            <div class="client-contact-row">
                                <span>📧 ${client.email}</span>
                                ${client.phone ? `<span> • 📞 ${client.phone}</span>` : ''}
                            </div>
                            <div class="client-login-time">
                                <span>⏰ Active Session • Logged in ${client.loginTime || 'Recently'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Pets Box -->
                    <div class="client-pets-container">
                        <div class="pets-section-header">
                            <span class="pets-header-title">🐾 Registered Pets (${petsList.length})</span>
                            <span class="pets-badge-live">Live Active</span>
                        </div>
                        <div class="pets-list-grid">
                            ${petsList.map(pet => `
                                <div class="pet-mini-card">
                                    <div class="pet-mini-avatar">${pet.icon || ((pet.type || '').toLowerCase().includes('cat') ? '🐈' : (pet.type || '').toLowerCase().includes('bird') ? '🦜' : (pet.type || '').toLowerCase().includes('rabbit') ? '🐇' : '🐕')}</div>
                                    <div class="pet-mini-details">
                                        <div class="pet-mini-name">
                                           ${pet.name} 
                                           <span class="pet-species-pill">${pet.type || 'Pet'}</span>
                                        </div>
                                        <div class="pet-mini-sub">${pet.breed || 'Breed'} • ${pet.age || '1 yr'}</div>
                                        <div class="pet-mini-status">🩺 ${pet.status || 'Vaccinated 💉'}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Card Footer -->
                    <div class="doctor-card-footer">
                        <button type="button" class="btn-client-signout" data-client-id="${client.id}" title="Sign Out this client">
                            🚪 Sign Out
                        </button>
                        <button type="button" class="btn-book-vet-for-pet" data-client-name="${client.name}" data-pet-names="${petsList.map(p => p.name).join(', ')}">
                            Book Vet Consultation 📅
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach listeners to Book Vet Consultation buttons
        clientsGrid.querySelectorAll('.btn-book-vet-for-pet').forEach(btn => {
            btn.addEventListener('click', () => {
                const clientName = btn.getAttribute('data-client-name');
                const petNames = btn.getAttribute('data-pet-names');
                const tokenNum = Math.floor(Math.random() * 30) + 1;
                showToast('success', 'Appointment Reserved', `Token #${tokenNum} issued for ${clientName}'s pet (${petNames}) with on-duty veterinary doctor.`);
            });
        });

        // Attach listeners to Client Sign Out button
        clientsGrid.querySelectorAll('.btn-client-signout').forEach(btn => {
            btn.addEventListener('click', () => {
                const clientId = btn.getAttribute('data-client-id');
                const client = getActiveClients().find(c => c.id === clientId || c.uid === clientId);
                removeClientFromRoster(clientId);
                renderClients(currentClientFilter, currentClientSearch);
                showToast('info', 'Client Signed Out', `${client ? client.name : 'Client'} and pet profile removed from live directory.`);
            });
        });
    }

    // Attach Clients Trigger listeners
    if (navClientsLink) {
        navClientsLink.addEventListener('click', (e) => {
            const href = navClientsLink.getAttribute('href') || '';
            if (href.includes('clients.html')) {
                return;
            }
            e.preventDefault();
            window.location.href = 'clients.html';
        });
    }

    if (clientsModalCloseBtn) {
        clientsModalCloseBtn.addEventListener('click', closeClientsModal);
    }

    if (clientsModal) {
        clientsModal.addEventListener('click', (e) => {
            if (e.target === clientsModal) {
                closeClientsModal();
            }
        });
    }

    // Header Quick Test Client button
    if (clientsQuickDemoBtn) {
        clientsQuickDemoBtn.addEventListener('click', () => {
            const clients = getActiveClients();
            const hasHamza = clients.some(c => c.name && c.name.includes('Hamza'));
            if (hasHamza) {
                window.quickTestClientLogin('sara');
            } else {
                window.quickTestClientLogin('hamza');
            }
        });
    }

    // Switch to Client Login form from inside modal
    if (clientsToLoginBtn) {
        clientsToLoginBtn.addEventListener('click', () => {
            closeClientsModal();
            openAuthModal('client', 'signin');
            showToast('info', 'Client Login', 'Opening Pet Parent Sign In & Registration.');
        });
    }

    // Search Input Listener for Clients
    if (clientsSearchInput) {
        clientsSearchInput.addEventListener('input', (e) => {
            currentClientSearch = e.target.value;
            renderClients(currentClientFilter, currentClientSearch);
        });
    }

    // Filter Chips Listeners for Clients
    clientFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            clientFilterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentClientFilter = chip.getAttribute('data-filter');
            renderClients(currentClientFilter, currentClientSearch);
        });
    });

    // Cross-tab synchronization for clients
    window.addEventListener('storage', (e) => {
        if (e.key === CLIENTS_STORAGE_KEY) {
            renderClients(currentClientFilter, currentClientSearch);
        }
    });

    // Close clients modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && clientsModal && clientsModal.classList.contains('open')) {
            closeClientsModal();
        }
    });

    // Quick Test Client button (Header / Clients Directory)
    if (clientsQuickDemoBtn) {
        clientsQuickDemoBtn.addEventListener('click', () => {
            const currentClients = (typeof getStoredClients === 'function') ? getStoredClients() : [];
            const hasHamza = currentClients.some(c => c.name && c.name.includes('Hamza'));
            if (hasHamza) {
                window.quickTestClientLogin('sara');
            } else {
                window.quickTestClientLogin('hamza');
            }
        });
    }

    // Dedicated Login Page 1-Click Demo Buttons
    const loginQuickDoc = document.getElementById('login-quick-demo-doctor');
    if (loginQuickDoc) {
        loginQuickDoc.addEventListener('click', (e) => {
            e.preventDefault();
            setRole('doctor');
            const email = document.getElementById('signin-email');
            const docName = document.getElementById('signin-doctor-name');
            const license = document.getElementById('signin-license');
            const specialty = document.getElementById('signin-doctor-specialty');
            const room = document.getElementById('signin-doctor-room');
            const shift = document.getElementById('signin-doctor-shift');
            const status = document.getElementById('signin-doctor-status');
            const pw = document.getElementById('signin-password');

            if (email) email.value = 'dr.farhan@veticare.com';
            if (docName) docName.value = 'Dr. Farhan Qureshi';
            if (license) license.value = 'PVMC-VET-2026-9812';
            if (specialty) specialty.value = 'Chief Veterinary Surgeon|Department of Surgery & Orthopedics';
            if (room) room.value = 'Executive Surgery Suite 101';
            if (shift) shift.value = '08:00 AM - 04:00 PM (Morning)';
            if (status) status.value = 'onduty';
            if (pw) pw.value = 'VetiDoctor@2026';

            showToast('info', 'Doctor Demo Loaded 🩺', 'Credentials filled for Dr. Farhan Qureshi. Click Sign In to enter.');
        });
    }

    const loginQuickClient = document.getElementById('login-quick-demo-client');
    if (loginQuickClient) {
        loginQuickClient.addEventListener('click', (e) => {
            e.preventDefault();
            setRole('client');
            const email = document.getElementById('signin-email');
            const petName = document.getElementById('signin-pet-name');
            const petType = document.getElementById('signin-pet-type');
            const petBreed = document.getElementById('signin-pet-breed');
            const pw = document.getElementById('signin-password');

            if (email) email.value = 'hamza.client@gmail.com';
            if (petName) petName.value = 'Rocky';
            if (petType) petType.value = 'Dog';
            if (petBreed) petBreed.value = 'German Shepherd (3 Yrs)';
            if (pw) pw.value = 'VetiPet@2026';

            showToast('info', 'Client Demo Loaded 🐾', 'Credentials filled for Hamza & Rocky 🐕. Click Sign In to enter.');
        });
    }

    // Firebase Auth State Listener
    if (window.VetiAuth && window.VetiAuth.isLive()) {
        window.VetiAuth.onAuthStateChanged(user => {
            if (user) {
                handleLoginSuccess(user, user.userRole || 'client', false);
            }
        });
    }

    // Initialize UI
    setRole('client');
    updateFirebaseStatusUI();

    // =============================================================
    // VETIMEDICOS ROYAL PET EMPORIUM (E-COMMERCE ENGINE)
    // =============================================================
    const VET_PRODUCTS = [
        {
            id: 'vm-kitten',
            title: 'VetiMedicos Kitten Vitality & Growth (4-12 Months)',
            brand: 'VetiMedicos Royal Nutrition',
            category: 'cats',
            subcat: 'kitten',
            image: 'assets/images/vm_kitten.jpg',
            rating: 4.9,
            reviewsCount: 142,
            badge: '👑 ROYAL BESTSELLER',
            description: 'Scientifically balanced nutrition for kittens during their key growth stage. Formulated with highly digestible L.I.P. proteins, prebiotics (FOS & MOS), and patented antioxidants (Vitamin E & C).',
            specs: {
                protein: '36.0%',
                fat: '18.0%',
                fiber: '2.3%',
                omega: '0.85% (Omega-3 & DHA)',
                origin: 'VetiMedicos Swiss-Formulated (Imported)',
                feeding: '4-6 months: 55g/day | 7-12 months: 65g/day'
            },
            variants: [
                { name: '400g Pouch', price: 3850, oldPrice: 4200, discount: '-8%' },
                { name: '2kg Bag', price: 8950, oldPrice: 9800, discount: '-9%', selected: true },
                { name: '4kg Bag', price: 16800, oldPrice: 18500, discount: '-9%' }
            ]
        },
        {
            id: 'vm-persian',
            title: 'VetiMedicos Persian Royal Adult (Long Hair & Coat Health)',
            brand: 'VetiMedicos Royal Nutrition',
            category: 'cats',
            subcat: 'persian',
            image: 'assets/images/vm_persian.jpg',
            rating: 4.95,
            reviewsCount: 218,
            badge: '⭐ PERSIAN CHOICE',
            description: 'Tailored for adult Persian cats (>12 months). Exclusive almond-shaped kibble designed specifically for the Persian flat brachycephalic jaw. Contains psyllium husk to naturally eliminate hairballs.',
            specs: {
                protein: '30.0%',
                fat: '22.0%',
                fiber: '4.7%',
                omega: '1.02% (Borage Oil & Biotin)',
                origin: 'VetiMedicos Swiss-Formulated (Imported)',
                feeding: 'Normal Activity: 50g/day | High Activity: 60g/day'
            },
            variants: [
                { name: '400g Pouch', price: 4250, oldPrice: 4600, discount: '-8%' },
                { name: '2kg Bag', price: 9450, oldPrice: 10400, discount: '-9%', selected: true },
                { name: '4kg Bag', price: 17900, oldPrice: 19500, discount: '-8%' }
            ]
        },
        {
            id: 'vm-maxi-dog',
            title: 'VetiMedicos Maxi Canine Adult (Large Breed Dogs 26-44kg)',
            brand: 'VetiMedicos Royal Nutrition',
            category: 'dogs',
            subcat: 'maxi',
            image: 'assets/images/vm_maxi_dog.jpg',
            rating: 4.88,
            reviewsCount: 176,
            badge: '🐕 CANINE ROYAL',
            description: 'Optimal nutrition for German Shepherds, Labradors, Rottweilers & Golden Retrievers. Fortified with Glucosamine & Chondroitin to safeguard high-impact joint cartilage and cardiac health.',
            specs: {
                protein: '26.0%',
                fat: '17.0%',
                fiber: '1.3%',
                omega: '0.77% (EPA & DHA)',
                origin: 'VetiMedicos Swiss-Formulated (Imported)',
                feeding: '30kg Dog: 340g/day | 40kg Dog: 420g/day'
            },
            variants: [
                { name: '4kg Bag', price: 8800, oldPrice: 9600, discount: '-8%', selected: true },
                { name: '15kg Jumbo', price: 27500, oldPrice: 29900, discount: '-8%' }
            ]
        },
        {
            id: 'vm-gastro',
            title: 'VetiMedicos Clinical Care Rx (Gastrointestinal Diet)',
            brand: 'VetiMedicos Clinical Diets',
            category: 'clinical',
            subcat: 'rx',
            image: 'assets/images/vm_clinical_diet.jpg',
            rating: 4.96,
            reviewsCount: 89,
            badge: '🩺 CLINICAL RX',
            description: 'Prescription-grade veterinary diet for acute and chronic gastrointestinal sensitivities, vomiting, diarrhea, and convalescence. High energy density allows reduced meal volume.',
            specs: {
                protein: '32.0%',
                fat: '22.0%',
                fiber: '5.2%',
                omega: 'Prebiotic FOS + MOS & EPA',
                origin: 'VetiMedicos Clinical Laboratory',
                feeding: 'Follow on-duty veterinarian prescribed dosage'
            },
            variants: [
                { name: '2kg Bag', price: 6200, oldPrice: 6800, discount: '-9%', selected: true },
                { name: '4kg Bag', price: 11800, oldPrice: 12900, discount: '-9%' }
            ]
        },
        {
            id: 'vm-hair-skin',
            title: 'VetiMedicos Dermal Gloss & Coat Shield (Intense Fur Gloss)',
            brand: 'VetiMedicos Royal Nutrition',
            category: 'cats',
            subcat: 'coat',
            image: 'assets/images/vm_persian.jpg',
            rating: 4.85,
            reviewsCount: 112,
            badge: '✨ VISIBLE SHINE',
            description: 'Clinically proven to deliver over 90% increased coat shine and silky fur in just 21 days. Enriched with specific amino acids, zinc, and gamma-linolenic acid (GLA) from borage oil.',
            specs: {
                protein: '33.0%',
                fat: '22.0%',
                fiber: '5.0%',
                omega: 'Omega-3 (0.9%) & Omega-6 (4.2%)',
                origin: 'VetiMedicos Swiss-Formulated (Imported)',
                feeding: 'Normal Weight: 45g/day'
            },
            variants: [
                { name: '400g Pouch', price: 4100, oldPrice: 4500, discount: '-9%' },
                { name: '2kg Bag', price: 9200, oldPrice: 10100, discount: '-9%', selected: true }
            ]
        },
        {
            id: 'vm-mini-puppy',
            title: 'VetiMedicos Mini Canine Puppy Starter (Small Breed Puppies up to 10kg)',
            brand: 'VetiMedicos Royal Nutrition',
            category: 'dogs',
            subcat: 'puppy',
            image: 'assets/images/vm_maxi_dog.jpg',
            rating: 4.9,
            reviewsCount: 94,
            badge: '🐾 SMALL BREEDS',
            description: 'Specially engineered for Shih Tzu, Poodle, Pug, and Pomeranian puppies (up to 10 months). High energy density sustains rapid skeletal development with customized tiny kibble.',
            specs: {
                protein: '31.0%',
                fat: '20.0%',
                fiber: '1.4%',
                omega: 'DHA brain support',
                origin: 'VetiMedicos Swiss-Formulated (Imported)',
                feeding: '5kg Puppy: 90g/day | 8kg Puppy: 130g/day'
            },
            variants: [
                { name: '800g Pouch', price: 4400, oldPrice: 4800, discount: '-8%' },
                { name: '2kg Bag', price: 8600, oldPrice: 9400, discount: '-9%', selected: true }
            ]
        },
        {
            id: 'acc-smart-litter',
            title: 'VetiMedicos Deluxe Smart Self-Cleaning Cat Litter Box',
            brand: 'VetiMedicos Tech Series',
            category: 'accessories',
            subcat: 'hygiene',
            image: 'assets/images/pet_accessories_luxury.jpg',
            rating: 4.98,
            reviewsCount: 65,
            badge: '🔥 HOT TECH',
            description: 'Automatic self-sifting smart cat toilet with triple infrared safety sensors, active carbon odor-sealing chamber, and ultra-quiet motor (<35dB). Includes 3 rolls of bio-degradable waste liners.',
            specs: {
                capacity: '65L Cabin / 9L Waste Bin',
                sensors: '4 Weight Sensors + Thermal Radar',
                noise: '< 35dB Whisper Quiet',
                warranty: '1-Year Official VetiMedicos Replacement',
                power: '12V Safe Low Voltage'
            },
            variants: [
                { name: 'Standard Intelligent Unit', price: 14500, oldPrice: 16800, discount: '-14%', selected: true }
            ]
        },
        {
            id: 'acc-space-carrier',
            title: 'Royal Panoramic Space Capsule Pet Carrier Backpack',
            brand: 'VetiMedicos VIP Travel',
            category: 'accessories',
            subcat: 'travel',
            image: 'assets/images/pet_accessories_luxury.jpg',
            rating: 4.92,
            reviewsCount: 88,
            badge: '🎒 VIP TRAVEL',
            description: 'Airline-approved luxury pet backpack featuring clear bubble panoramic window, 9 reinforced metallic ventilation eyelets, scratch-resistant Oxford fabric, and ergonomic chest-clip straps.',
            specs: {
                maxWeight: 'Up to 8kg (Cats & Small Dogs)',
                materials: 'Waterproof Oxford + Eco-Acrylic',
                ventilation: '9 Air Holes + Breathable Mesh',
                dimensions: '33cm x 28cm x 42cm'
            },
            variants: [
                { name: 'Camel & Leather Edition', price: 5900, oldPrice: 6800, discount: '-13%', selected: true }
            ]
        },
        {
            id: 'acc-leather-leash',
            title: 'Handcrafted Braided Italian Leather Dog Collar & Leash Set',
            brand: 'VetiMedicos Royal Gear',
            category: 'accessories',
            subcat: 'gear',
            image: 'assets/images/pet_accessories_luxury.jpg',
            rating: 4.94,
            reviewsCount: 104,
            badge: '👑 REAL LEATHER',
            description: '100% genuine full-grain cowhide leather braided by master craftsmen. Equipped with heavy-duty solid brass 360° swivel hardware and padded interior lining to prevent neck fur breakage.',
            specs: {
                leather: '100% Vegetable-Tanned Cowhide',
                hardware: 'Rustproof Solid Brass',
                leashLength: '5 Feet (150cm)',
                durability: 'Tested up to 60kg Pull Force'
            },
            variants: [
                { name: 'Medium (Neck 14-18")', price: 3200, oldPrice: 3800, discount: '-16%', selected: true },
                { name: 'Large (Neck 18-24")', price: 3600, oldPrice: 4200, discount: '-14%' }
            ]
        },
        {
            id: 'acc-tea-tree-shampoo',
            title: 'Bio-Active Medicated Tea Tree & Oatmeal Pet Shampoo (500ml)',
            brand: 'VetiMedicos Dermacare',
            category: 'hygiene',
            subcat: 'grooming',
            image: 'assets/images/pet_accessories_luxury.jpg',
            rating: 4.87,
            reviewsCount: 145,
            badge: '🌿 VET DERMA',
            description: 'Clinically formulated for Pakistani weather conditions. Natural organic Australian tea tree oil relieves hot spots, fungal dandruff, and flea itchiness, while colloidal oatmeal deeply hydrates the skin.',
            specs: {
                volume: '500ml Ergonomic Pump',
                pH: '6.5 - 7.0 Balanced for Pets',
                scent: 'Natural Herbal Tea Tree & Lavender',
                safety: 'Paraben-Free, Sulfate-Free, Cruelty-Free'
            },
            variants: [
                { name: '500ml Bottle', price: 1850, oldPrice: 2200, discount: '-16%', selected: true }
            ]
        },
        {
            id: 'acc-ortho-bowls',
            title: 'Orthopedic Non-Slip Stainless Steel Elevated Double Bowls',
            brand: 'VetiMedicos Comfort Feed',
            category: 'accessories',
            subcat: 'feeding',
            image: 'assets/images/pet_accessories_luxury.jpg',
            rating: 4.89,
            reviewsCount: 78,
            badge: '🥣 ERGONOMIC',
            description: '15° ergonomically tilted design reduces cervical spine pressure and prevents digestive regurgitation in cats and dogs. Made of food-grade 304 surgical stainless steel with non-slip silicone base.',
            specs: {
                material: 'Food-Grade SUS304 Steel',
                tiltAngle: '15° Cervical Protection Angle',
                capacity: '2x 450ml (Food & Water)',
                cleaning: 'Dishwasher Safe Detachable Bowls'
            },
            variants: [
                { name: 'Matte Charcoal & Gold', price: 2800, oldPrice: 3300, discount: '-15%', selected: true }
            ]
        },
        {
            id: 'acc-slicker-brush',
            title: 'Professional Self-Cleaning Undercoat Slicker De-Shedding Brush',
            brand: 'VetiMedicos Grooming Master',
            category: 'hygiene',
            subcat: 'grooming',
            image: 'assets/images/pet_accessories_luxury.jpg',
            rating: 4.91,
            reviewsCount: 119,
            badge: '✨ 95% LESS SHED',
            description: 'Fine stainless-steel bent wires penetrate thick undercoats without scratching sensitive skin. One-touch press button retracts pins to effortlessly wipe clean collected fur in one second.',
            specs: {
                handle: 'Natural Beechwood Ergonomic Grip',
                pins: 'Fine 135° Angled Stainless Steel',
                mechanism: '1-Click Quick Hair Release Button',
                suitability: 'All Long & Short Hair Cats and Dogs'
            },
            variants: [
                { name: 'Classic Wooden Edition', price: 1550, oldPrice: 1900, discount: '-18%', selected: true }
            ]
        }
    ];

    // Shopping Cart State (Backed by localStorage)
    const CART_STORAGE_KEY = 'vetimedicos_cart_items';
    let cart = [];
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) cart = JSON.parse(storedCart);
    } catch (e) {
        cart = [];
    }

    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {}
        updateCartBadges();
        renderCartDrawer();
    }

    function updateCartBadges() {
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        document.querySelectorAll('.cart-count, #header-cart-count').forEach(el => {
            el.textContent = totalQty;
        });
        const drawerBadge = document.getElementById('drawer-cart-badge');
        if (drawerBadge) drawerBadge.textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;
    }

    // Ensure Sliding Cart Drawer & Checkout Modal markup exists in DOM on all pages
    function ensureCartDrawerMarkup() {
        if (!document.getElementById('cart-drawer-backdrop')) {
            const drawerHtml = `
            <div class="cart-drawer-backdrop" id="cart-drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-heading">
                <div class="cart-drawer-box">
                    <div class="cart-drawer-header">
                        <div class="cart-drawer-title-wrap">
                            <h3 id="cart-drawer-heading" style="display:flex; align-items:center; gap:8px;">
                                <img src="assets/images/vetimedicos_crest_logo.svg" alt="VetiMedicos Crest EST. 2026" style="width:26px; height:26px; vertical-align:middle;">
                                <span>Your VIP Shopping Bag</span>
                                <span class="cart-count-badge" id="drawer-cart-badge">0 items</span>
                            </h3>
                        </div>
                        <button type="button" class="auth-close-btn" id="cart-drawer-close-btn" aria-label="Close Shopping Bag" style="position:static;">&times;</button>
                    </div>

                    <div class="cart-free-shipping-bar" id="cart-free-shipping-bar">
                        <div id="free-shipping-text">Spend Rs. 5,000 for FREE Express VIP Shipping!</div>
                        <div class="free-ship-progress">
                            <div class="free-ship-fill" id="free-shipping-fill" style="width: 0%;"></div>
                        </div>
                    </div>

                    <div class="cart-items-list" id="cart-items-container">
                        <!-- Populated dynamically -->
                    </div>

                    <div class="cart-drawer-footer">
                        <div class="cart-summary-line">
                            <span>Subtotal:</span>
                            <strong id="cart-subtotal-val">Rs. 0</strong>
                        </div>
                        <div class="cart-summary-line">
                            <span>Estimated Shipping (Pakistan):</span>
                            <span id="cart-shipping-val">Rs. 250</span>
                        </div>
                        <div class="cart-summary-line total-line">
                            <span>Total Amount:</span>
                            <strong id="cart-total-val" style="color: #c2410c;">Rs. 0</strong>
                        </div>

                        <div class="cart-checkout-actions">
                            <button type="button" class="btn-cart-whatsapp" id="btn-cart-whatsapp" title="Instant Pakistani WhatsApp Order">
                                <span>💬 Order via WhatsApp (Instant Confirmation)</span>
                            </button>
                            <button type="button" class="btn-cart-checkout" id="btn-cart-checkout" title="Proceed to Cash on Delivery Checkout">
                                <span>Proceed to Checkout (COD / Bank Transfer) &rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="quickview-backdrop" id="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
                <div class="quickview-card" style="max-width: 520px;">
                    <button type="button" class="auth-close-btn" id="checkout-close-btn" aria-label="Close Checkout" style="position:absolute; top:14px; right:14px;">&times;</button>
                    
                    <div style="margin-bottom: 16px;">
                        <h3 id="checkout-modal-title" style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                            🚚 Complete Your Order
                        </h3>
                        <p style="font-size: 0.78rem; color: #64748b;">
                            Cash on Delivery (COD) &amp; Bank Transfer available nationwide across Pakistan.
                        </p>
                    </div>

                    <form id="form-shop-checkout" novalidate>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label for="order-fullname" class="input-label">Full Name *</label>
                            <div class="input-box">
                                <input type="text" id="order-fullname" placeholder="e.g. Farhan Ahmed" required autocomplete="name">
                            </div>
                        </div>

                        <div class="spec-grid-2" style="margin-bottom: 10px;">
                            <div>
                                <label for="order-phone" class="input-label">WhatsApp / Phone *</label>
                                <div class="input-box">
                                    <input type="tel" id="order-phone" placeholder="0326-4223100" required autocomplete="tel">
                                </div>
                            </div>
                            <div>
                                <label for="order-city" class="input-label">Destination City *</label>
                                <div class="input-box">
                                    <select id="order-city">
                                        <option value="Lahore">Lahore (Same Day Dispatch)</option>
                                        <option value="Islamabad">Islamabad / Rawalpindi (24h)</option>
                                        <option value="Karachi">Karachi (24-48h Express)</option>
                                        <option value="Faisalabad">Faisalabad</option>
                                        <option value="Multan">Multan</option>
                                        <option value="Peshawar">Peshawar</option>
                                        <option value="Quetta">Quetta</option>
                                        <option value="Sialkot">Sialkot</option>
                                        <option value="Other">Other City (TCS / Leopard)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label for="order-address" class="input-label">Complete Delivery Address *</label>
                            <div class="input-box">
                                <input type="text" id="order-address" placeholder="House #, Street, Phase / Block, Sector" required autocomplete="street-address">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 14px;">
                            <label class="input-label">Payment Method</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                <label style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1.5px solid rgba(223,162,67,0.4); padding:10px 12px; border-radius:10px; cursor:pointer; font-size:0.82rem; font-weight:700;">
                                    <input type="radio" name="order-payment" value="cod" checked>
                                    <span>💵 Cash on Delivery</span>
                                </label>
                                <label style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #cbd5e1; padding:10px 12px; border-radius:10px; cursor:pointer; font-size:0.82rem; font-weight:700;">
                                    <input type="radio" name="order-payment" value="bank">
                                    <span>🏦 Bank / Nayapay</span>
                                </label>
                            </div>
                        </div>

                        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.85rem; font-weight:700; color:#92400e;">Total Payable:</span>
                            <strong style="font-size:1.15rem; color:#b45309;" id="checkout-summary-total">Rs. 0</strong>
                        </div>

                        <button type="submit" class="btn-submit" id="btn-submit-order" style="height:46px;">
                            <span class="btn-text">Confirm Order 📦</span>
                            <span class="spinner"></span>
                        </button>
                    </form>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', drawerHtml);
        }
    }
    ensureCartDrawerMarkup();

    window.openCartDrawer = window._openCartDrawerImpl = function() {
        ensureCartDrawerMarkup();
        const drawer = document.getElementById('cart-drawer-backdrop');
        if (!drawer) return;
        renderCartDrawer();
        drawer.style.display = 'block';
        drawer.classList.add('open');
        window.setModalScrollLock(true);
    };

    window.closeCartDrawer = window._closeCartDrawerImpl = function() {
        const drawer = document.getElementById('cart-drawer-backdrop');
        if (!drawer) return;
        drawer.classList.remove('open');
        setTimeout(() => {
            if (!drawer.classList.contains('open')) {
                drawer.style.display = '';
            }
        }, 300);
        window.setModalScrollLock(false);
    };

    if (window._cartOpenRequested) {
        window.openCartDrawer();
        window._cartOpenRequested = false;
    }

    // Navigate or smooth scroll directly to Store catalog where products can be purchased
    window.goToShop = function() {
        if (typeof closeCartDrawer === 'function') {
            closeCartDrawer();
        }
        const currentPath = window.location.pathname.toLowerCase();
        const isShop = currentPath.endsWith('shop.html') || currentPath.includes('/shop.html');
        if (isShop) {
            const anchor = document.getElementById('shop-catalog-anchor') || document.getElementById('shop-products-container');
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            window.location.href = 'shop.html#shop-catalog-anchor';
        }
    };

    // Global listener for Cart Drawer: Always open on cart button, close on close-btn or backdrop
    document.addEventListener('click', (e) => {
        // 1. If clicking ANY cart button in navbar, ALWAYS open the cart drawer!
        const cartBtn = e.target.closest('#nav-cart-btn, .nav-cart-trigger');
        if (cartBtn) {
            e.preventDefault();
            e.stopPropagation();
            window.openCartDrawer();
            return;
        }

        // 2. If clicking close button inside the drawer, close it
        const drawer = document.getElementById('cart-drawer-backdrop');
        if (!drawer) return;
        if (e.target.closest('#cart-drawer-close-btn')) {
            e.preventDefault();
            e.stopPropagation();
            window.closeCartDrawer();
            return;
        }
        
        // 3. If clicking outside the drawer box directly on the backdrop, close it
        if (e.target === drawer) {
            window.closeCartDrawer();
        }
    });

    // Close cart drawer on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const drawer = document.getElementById('cart-drawer-backdrop');
            if (drawer && drawer.classList.contains('open')) {
                window.closeCartDrawer();
            }
        }
    });

    // Cross-tab synchronization for cart
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            try {
                cart = JSON.parse(e.newValue || '[]');
            } catch (err) {
                cart = [];
            }
            updateCartBadges();
            renderCartDrawer();
        }
    });

    // Add To Cart Function
    window.addToCart = function(productId, variantIndex = 0) {
        const product = VET_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const variant = product.variants[variantIndex] || product.variants[0];
        const existingIndex = cart.findIndex(item => item.id === product.id && item.variant === variant.name);

        if (existingIndex > -1) {
            cart[existingIndex].qty += 1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                variant: variant.name,
                price: variant.price,
                oldPrice: variant.oldPrice,
                image: product.image,
                qty: 1
            });
        }

        saveCart();
        showToast('success', 'Added to VIP Bag 🛍️', `${product.title} (${variant.name}) added to your shopping bag.`);
        openCartDrawer();
    };

    window.updateCartQty = function(index, delta) {
        if (!cart[index]) return;
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    };

    window.removeCartItem = function(index) {
        if (!cart[index]) return;
        const item = cart[index];
        cart.splice(index, 1);
        saveCart();
        showToast('info', 'Item Removed', `${item.title} was removed from your bag.`);
    };

    function renderCartDrawer() {
        const container = document.getElementById('cart-items-container');
        const subtotalEl = document.getElementById('cart-subtotal-val');
        const shippingEl = document.getElementById('cart-shipping-val');
        const totalEl = document.getElementById('cart-total-val');
        const freeShipText = document.getElementById('free-shipping-text');
        const freeShipFill = document.getElementById('free-shipping-fill');
        const checkoutSummaryTotal = document.getElementById('checkout-summary-total');

        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="cart-empty-state">
                    <div class="cart-empty-icon">🛍️</div>
                    <h4 style="font-size:1.05rem; font-weight:800; color:#0f172a;">Your bag is empty</h4>
                    <p style="font-size:0.78rem; line-height:1.4;">Explore VetiMedicos clinically formulated pet nutrition and luxury pet gear across Pakistan.</p>
                    <button type="button" class="btn-primary" id="btn-start-shopping" style="margin-top:14px; font-size:0.88rem; font-weight:700; padding:10px 24px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 6px 18px rgba(223,162,67,0.35);" onclick="goToShop();">
                        <span>Start Shopping</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            `;
            if (subtotalEl) subtotalEl.textContent = 'Rs. 0';
            if (shippingEl) shippingEl.textContent = 'Rs. 0';
            if (totalEl) totalEl.textContent = 'Rs. 0';
            if (freeShipText) freeShipText.textContent = 'Spend Rs. 5,000 for FREE Express VIP Shipping across Pakistan!';
            if (freeShipFill) freeShipFill.style.width = '0%';
            if (checkoutSummaryTotal) checkoutSummaryTotal.textContent = 'Rs. 0';
            return;
        }

        let subtotal = 0;
        let html = '';

        cart.forEach((item, idx) => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;

            html += `
                <div class="cart-item-row">
                    <div class="cart-item-img">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <div class="cart-item-variant">Size: <strong>${item.variant}</strong> &bull; Rs. ${item.price.toLocaleString()}</div>
                        <div class="cart-item-qty-row">
                            <button type="button" class="cart-qty-btn" onclick="updateCartQty(${idx}, -1)" title="Decrease Quantity">-</button>
                            <span class="cart-qty-val">${item.qty}</span>
                            <button type="button" class="cart-qty-btn" onclick="updateCartQty(${idx}, 1)" title="Increase Quantity">+</button>
                        </div>
                    </div>
                    <div class="cart-item-price-col">
                        <button type="button" class="cart-item-del-btn" onclick="removeCartItem(${idx})" title="Remove Item">&times;</button>
                        <div class="cart-item-total">Rs. ${itemTotal.toLocaleString()}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Shipping logic (Pakistan): Free shipping if subtotal >= 5000, else 250
        const isFreeShipping = subtotal >= 5000;
        const shippingFee = isFreeShipping ? 0 : 250;
        const grandTotal = subtotal + shippingFee;

        if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
        if (shippingEl) {
            shippingEl.textContent = isFreeShipping ? 'FREE (Express Dispatch) 🚚' : `Rs. ${shippingFee.toLocaleString()}`;
            shippingEl.style.color = isFreeShipping ? '#15803d' : '#475569';
            shippingEl.style.fontWeight = isFreeShipping ? '800' : '600';
        }
        if (totalEl) totalEl.textContent = `Rs. ${grandTotal.toLocaleString()}`;
        if (checkoutSummaryTotal) checkoutSummaryTotal.textContent = `Rs. ${grandTotal.toLocaleString()}`;

        // Free shipping progress bar
        if (freeShipText && freeShipFill) {
            if (isFreeShipping) {
                freeShipText.innerHTML = `🎉 <strong>Congratulations!</strong> You qualify for FREE VIP Express Delivery in Pakistan!`;
                freeShipFill.style.width = '100%';
            } else {
                const remaining = 5000 - subtotal;
                const pct = Math.min(100, Math.round((subtotal / 5000) * 100));
                freeShipText.innerHTML = `Add <strong>Rs. ${remaining.toLocaleString()}</strong> more to unlock <strong>FREE Express VIP Shipping</strong>!`;
                freeShipFill.style.width = `${pct}%`;
            }
        }
    }

    // WhatsApp 1-Click Pakistani Order Handler (Delegated for universal support)
    document.addEventListener('click', (e) => {
        const btnCartWhatsapp = e.target.closest('#btn-cart-whatsapp');
        if (btnCartWhatsapp) {
            e.preventDefault();
            if (cart.length === 0) {
                showToast('warning', 'Empty Bag', 'Please add products before checking out via WhatsApp.');
                return;
            }

            let subtotal = 0;
            let itemsText = '';
            cart.forEach((item, i) => {
                const lineTotal = item.price * item.qty;
                subtotal += lineTotal;
                itemsText += `%0A${i + 1}. *${item.title}* (${item.variant}) x ${item.qty} = Rs. ${lineTotal.toLocaleString()}`;
            });

            const shipping = subtotal >= 5000 ? 0 : 250;
            const grandTotal = subtotal + shipping;

            const msg = `*Assalam-o-Alaikum VetiMedicos Pakistan!*%0A%0AMaine aap ki official web shop se VetiMedicos Pet Nutrition / Accessories order karni hain:%0A${itemsText}%0A%0A*Subtotal:* Rs. ${subtotal.toLocaleString()}%0A*Shipping:* ${shipping === 0 ? 'FREE VIP Express' : 'Rs. 250'}%0A*Total Amount:* Rs. ${grandTotal.toLocaleString()}%0A%0APlease mera order confirm karein aur delivery timeline bata dein. Shukriya!`;
            
            const waUrl = `https://wa.me/923264223100?text=${msg}`;
            window.open(waUrl, '_blank');
            showToast('success', 'Opening WhatsApp', 'Your complete order details have been formatted for VetiMedicos official support (0326-4223100).');
            return;
        }

        const btnCartCheckout = e.target.closest('#btn-cart-checkout');
        if (btnCartCheckout) {
            e.preventDefault();
            window.openCheckoutModal();
            return;
        }

        const checkoutCloseBtn = e.target.closest('#checkout-close-btn');
        if (checkoutCloseBtn) {
            e.preventDefault();
            window.closeCheckoutModal();
            return;
        }

        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && e.target === checkoutModal) {
            window.closeCheckoutModal();
            return;
        }
    });

    window.openCheckoutModal = function() {
        ensureCartDrawerMarkup();
        const checkoutModal = document.getElementById('checkout-modal');
        if (!checkoutModal) return;
        if (cart.length === 0) {
            showToast('warning', 'Empty Bag', 'Please add items to your cart before proceeding.');
            return;
        }
        window.closeCartDrawer();
        checkoutModal.classList.add('open');
        window.setModalScrollLock(true);
    };

    window.closeCheckoutModal = function() {
        const checkoutModal = document.getElementById('checkout-modal');
        if (!checkoutModal) return;
        checkoutModal.classList.remove('open');
        window.setModalScrollLock(false);
    };

    // Delegated Checkout Form Submit
    document.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'form-shop-checkout') {
            e.preventDefault();
            const fullName = document.getElementById('order-fullname')?.value.trim();
            const phone = document.getElementById('order-phone')?.value.trim();
            const city = document.getElementById('order-city')?.value;
            const address = document.getElementById('order-address')?.value.trim();

            if (!fullName || !phone || !address) {
                showToast('error', 'Incomplete Form', 'Please fill in your name, contact phone, and delivery address.');
                return;
            }

            const btnSubmit = document.getElementById('btn-submit-order');
            if (btnSubmit) {
                btnSubmit.classList.add('loading');
                btnSubmit.disabled = true;
            }

            setTimeout(() => {
                if (btnSubmit) {
                    btnSubmit.classList.remove('loading');
                    btnSubmit.disabled = false;
                }
                const orderId = 'VET-' + Math.floor(100000 + Math.random() * 900000);
                const paymentMethod = document.querySelector('input[name="order-payment"]:checked')?.value || 'cod';
                
                // Save order to Firebase Realtime Database
                if (typeof window.saveOrderToFirebase === 'function') {
                    window.saveOrderToFirebase({
                        orderId: orderId,
                        customer: {
                            fullName: fullName,
                            phone: phone,
                            city: city,
                            address: address
                        },
                        paymentMethod: paymentMethod,
                        items: [...cart],
                        status: 'pending_dispatch'
                    });
                }

                showToast('success', `🎉 Order Confirmed #${orderId}`, `Thank you, ${fullName}! Your order has been recorded in Realtime Firebase. Delivery dispatch to ${city}.`);
                
                // Clear cart
                cart = [];
                saveCart();
                window.closeCheckoutModal();
            }, 1200);
        }
    });

    // QuickView Modal Handlers
    const quickviewModal = document.getElementById('quickview-modal');
    const quickviewCloseBtn = document.getElementById('quickview-close-btn');

    window.openQuickView = function(productId) {
        const product = VET_PRODUCTS.find(p => p.id === productId);
        if (!product || !quickviewModal) return;

        const bodyEl = document.getElementById('quickview-body');
        if (!bodyEl) return;

        const selectedVariant = product.variants.find(v => v.selected) || product.variants[0];

        bodyEl.innerHTML = `
            <div class="quickview-img-box">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div>
                <div style="font-size:0.72rem; font-weight:800; color:#c2410c; text-transform:uppercase; margin-bottom:4px;">
                    ${product.brand} &bull; ${product.badge}
                </div>
                <h3 id="quickview-title" style="font-size:1.25rem; font-weight:800; color:#0f172a; line-height:1.25; margin-bottom:6px;">
                    ${product.title}
                </h3>
                <div style="font-size:0.76rem; color:#475569; margin-bottom:12px;">
                    ⭐ <strong>${product.rating}</strong>/5.0 (${product.reviewsCount} verified reviews across Pakistan)
                </div>
                <p style="font-size:0.82rem; color:#334155; line-height:1.5; margin-bottom:14px;">
                    ${product.description}
                </p>

                <!-- Clinical Nutritional Table -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; margin-bottom:14px;">
                    <strong style="font-size:0.75rem; text-transform:uppercase; color:#0f172a;">🧬 Guaranteed Clinical Analysis &amp; Specs:</strong>
                    <table class="nutritional-table">
                        ${Object.entries(product.specs).map(([key, val]) => `
                            <tr>
                                <td class="spec-name">${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                                <td class="spec-val">${val}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <!-- Price and Add Button -->
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:10px; border-top:1px solid #e2e8f0;">
                    <div>
                        <div style="font-size:0.72rem; color:#64748b;">Starting from:</div>
                        <div style="font-size:1.35rem; font-weight:900; color:#0f172a;">Rs. ${selectedVariant.price.toLocaleString()}</div>
                    </div>
                    <button type="button" class="btn-card-addcart" style="height:44px; padding:0 24px; font-size:0.88rem;" onclick="addToCart('${product.id}', 0); closeQuickView();">
                        <span>Add to VIP Bag 🛒</span>
                    </button>
                </div>
            </div>
        `;

        quickviewModal.classList.add('open');
        window.setModalScrollLock(true);
    };

    window.closeQuickView = function() {
        if (!quickviewModal) return;
        quickviewModal.classList.remove('open');
        window.setModalScrollLock(false);
    };

    if (quickviewCloseBtn) quickviewCloseBtn.addEventListener('click', closeQuickView);
    if (quickviewModal) {
        quickviewModal.addEventListener('click', (e) => {
            if (e.target === quickviewModal) closeQuickView();
        });
    }

    // =============================================================
    // Product Catalog Rendering (For shop.html)
    // =============================================================
    let currentShopCategory = 'all';
    let currentShopSearch = '';
    let currentShopSort = 'featured';

    function renderShopCatalog() {
        const container = document.getElementById('shop-products-container');
        if (!container) return;

        let filtered = VET_PRODUCTS.filter(p => {
            const matchesCat = (currentShopCategory === 'all') || 
                               (p.category === currentShopCategory) || 
                               (p.subcat === currentShopCategory);
            const matchesSearch = !currentShopSearch || 
                                  p.title.toLowerCase().includes(currentShopSearch.toLowerCase()) || 
                                  p.description.toLowerCase().includes(currentShopSearch.toLowerCase()) ||
                                  p.brand.toLowerCase().includes(currentShopSearch.toLowerCase());
            return matchesCat && matchesSearch;
        });

        // Sorting
        if (currentShopSort === 'price-low') {
            filtered.sort((a, b) => a.variants[0].price - b.variants[0].price);
        } else if (currentShopSort === 'price-high') {
            filtered.sort((a, b) => b.variants[0].price - a.variants[0].price);
        } else if (currentShopSort === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        } else if (currentShopSort === 'discount') {
            filtered.sort((a, b) => parseInt(b.variants[0].discount) - parseInt(a.variants[0].discount));
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.7); border-radius: 16px; border: 1.5px dashed rgba(223,162,67,0.4);">
                    <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">No products match your criteria</h3>
                    <p style="font-size: 0.85rem; color: #64748b;">Try adjusting your search keyword or selecting a different category.</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(p => {
            const selectedVarIdx = p.variants.findIndex(v => v.selected) > -1 ? p.variants.findIndex(v => v.selected) : 0;
            const currentVar = p.variants[selectedVarIdx];
            const savings = currentVar.oldPrice - currentVar.price;

            html += `
                <article class="product-card" id="card-${p.id}" data-selected-variant="${selectedVarIdx}">
                    <div class="product-thumb-wrap">
                        <span class="product-badge-discount">${currentVar.discount} OFF</span>
                        <span class="product-badge-role">${p.badge}</span>
                        <img src="${p.image}" alt="${p.title}" loading="lazy">
                    </div>

                    <div class="product-info-wrap">
                        <div class="product-brand-row">
                            <span class="product-brand">${p.brand}</span>
                            <span class="product-rating">⭐ ${p.rating} (${p.reviewsCount})</span>
                        </div>

                        <h3 class="product-title" title="${p.title}">${p.title}</h3>
                        <p class="product-desc-snippet">${p.description}</p>

                        <!-- Variants Selector -->
                        <div class="product-variants-label">Select Weight / Size:</div>
                        <div class="product-variants-group">
                            ${p.variants.map((v, vIdx) => `
                                <button type="button" class="product-variant-btn ${vIdx === selectedVarIdx ? 'active' : ''}" 
                                        onclick="selectProductVariant('${p.id}', ${vIdx})">
                                    ${v.name}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Price Row -->
                        <div class="product-price-box">
                            <div class="price-row-wrap">
                                <span class="product-current-price" id="price-${p.id}">Rs. ${currentVar.price.toLocaleString()}</span>
                                <span class="product-old-price" id="old-price-${p.id}">Rs. ${currentVar.oldPrice.toLocaleString()}</span>
                                <span class="product-save-pill" id="save-${p.id}">Save Rs. ${savings.toLocaleString()}</span>
                            </div>
                        </div>

                        <!-- Card Action Buttons -->
                        <div class="product-card-actions">
                            <button type="button" class="btn-card-quickview" onclick="openQuickView('${p.id}')" title="View Clinical Specs">
                                <span>Specs</span> <span>👁️</span>
                            </button>
                            <button type="button" class="btn-card-addcart" onclick="addCurrentCardToCart('${p.id}')">
                                <span>Add to Bag</span> <span>🛒</span>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        });

        container.innerHTML = html;
    }

    window.selectProductVariant = function(productId, variantIndex) {
        const product = VET_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        product.variants.forEach((v, idx) => {
            v.selected = (idx === variantIndex);
        });

        const card = document.getElementById(`card-${productId}`);
        if (!card) return;

        card.setAttribute('data-selected-variant', variantIndex);

        // Update active class on buttons
        const variantBtns = card.querySelectorAll('.product-variant-btn');
        variantBtns.forEach((btn, idx) => {
            if (idx === variantIndex) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update displayed prices
        const selectedVar = product.variants[variantIndex];
        const priceEl = document.getElementById(`price-${productId}`);
        const oldPriceEl = document.getElementById(`old-price-${productId}`);
        const saveEl = document.getElementById(`save-${productId}`);

        if (priceEl) priceEl.textContent = `Rs. ${selectedVar.price.toLocaleString()}`;
        if (oldPriceEl) oldPriceEl.textContent = `Rs. ${selectedVar.oldPrice.toLocaleString()}`;
        if (saveEl) saveEl.textContent = `Save Rs. ${(selectedVar.oldPrice - selectedVar.price).toLocaleString()}`;
    };

    window.addCurrentCardToCart = function(productId) {
        const card = document.getElementById(`card-${productId}`);
        const varIdx = card ? parseInt(card.getAttribute('data-selected-variant') || '0', 10) : 0;
        addToCart(productId, varIdx);
    };

    // Category Tabs listeners (shop.html)
    document.querySelectorAll('.shop-cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.shop-cat-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentShopCategory = chip.getAttribute('data-category') || 'all';
            renderShopCatalog();
        });
    });

    // Search input listener (shop.html)
    const shopSearchInput = document.getElementById('shop-search-input');
    if (shopSearchInput) {
        shopSearchInput.addEventListener('input', (e) => {
            currentShopSearch = e.target.value.trim();
            renderShopCatalog();
        });
    }

    // Sort select listener (shop.html)
    const shopSortSelect = document.getElementById('shop-sort-select');
    if (shopSortSelect) {
        shopSortSelect.addEventListener('change', (e) => {
            currentShopSort = e.target.value;
            renderShopCatalog();
        });
    }

    // Hero CTA button on index.html: Redirect to shop
    const heroCtaBtn = document.getElementById('hero-cta-btn');
    if (heroCtaBtn) {
        heroCtaBtn.addEventListener('click', () => {
            window.location.href = 'shop.html#shop-catalog-anchor';
        });
    }

    // Hero buttons on shop.html: Browse collection scroll and open bag
    const btnHeroShopScroll = document.getElementById('btn-hero-shop-scroll');
    if (btnHeroShopScroll) {
        btnHeroShopScroll.addEventListener('click', () => {
            const anchor = document.getElementById('shop-catalog-anchor') || document.getElementById('shop-products-container');
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const btnHeroOpenCart = document.getElementById('btn-hero-open-cart');
    if (btnHeroOpenCart) {
        btnHeroOpenCart.addEventListener('click', () => {
            openCartDrawer();
        });
    }

    // Smooth scroll down to catalog if hash present
    if (window.location.hash === '#shop-catalog-anchor' || window.location.hash === '#shop-products-container') {
        setTimeout(() => {
            const anchor = document.getElementById('shop-catalog-anchor') || document.getElementById('shop-products-container');
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 220);
    }

    // Initialize Shop, Doctors & Clients on page load
    updateCartBadges();
    renderShopCatalog();
    if (dutyGrid) {
        renderDoctors(currentDutyFilter, currentDutySearch);
    }
    if (clientsGrid) {
        renderClients(currentClientFilter, currentClientSearch);
    }

    // Initialize Universal Site Search
    initGlobalSiteSearch();
});

// ===================================================================
// UNIVERSAL SITE SEARCH (OMNI-SEARCH SPOTLIGHT)
// Search services, doctors, diets, pricing plans, coupons & hospital info
// ===================================================================
function initGlobalSiteSearch() {
    const siteSearchDatabase = [
        // Services
        {
            title: "Online Pet Checkup & Video Consultations",
            category: "service",
            badge: "Telemedicine",
            icon: "🩺",
            url: "checkup.html",
            snippet: "Consult senior veterinary specialists live via HD video call, audio, or instant chat from home.",
            keywords: "online checkup video call consultation telemedicine doctors virtual opd remote vet"
        },
        {
            title: "OPD Veterinary Health Checkup",
            category: "service",
            badge: "Service",
            icon: "🩺",
            url: "services.html#services",
            snippet: "Routine physical examinations, diagnostics, stethoscope vitals & expert consults.",
            keywords: "opd doctor checkup consult routine prescription examination visit vet"
        },
        {
            title: "7-in-1 Annual Vaccinations & Rabies",
            category: "service",
            badge: "Service",
            icon: "💉",
            url: "services.html",
            snippet: "Core DHPPi & FVRCP immunizations, anti-rabies certification & digital health passport.",
            keywords: "vaccine vaccination rabies parvo distemper booster immunity shots puppy kitten"
        },
        {
            title: "Advanced Veterinary Surgery & Minor Theatre",
            category: "service",
            badge: "Service",
            icon: "🔬",
            url: "services.html",
            snippet: "Sterile surgical theatre for soft tissue, orthopedic fixations, spay/neuter & trauma.",
            keywords: "surgery operation surgeon orthopedic theatre fracture spay neuter tumor"
        },
        {
            title: "Luxury Hydrotherapy Spa & Fluff Grooming",
            category: "service",
            badge: "Service",
            icon: "🛁",
            url: "services.html",
            snippet: "Aromatherapy bath, ozone jacuzzi, deshedding, nail clipping, and fur styling.",
            keywords: "spa grooming bath bath hydrotherapy jacuzzi haircut nail ear wash blueberry"
        },
        {
            title: "Ultrasonic Dental Scaling & Polish",
            category: "service",
            badge: "Service",
            icon: "✨",
            url: "services.html",
            snippet: "Deep periodontal tartar removal, plaque cleaning & halitosis cure under twilight sedation.",
            keywords: "dental teeth tartar plaque breath scaling cleaning polish gums"
        },
        {
            title: "Abdominal Ultrasound & Digital X-Ray",
            category: "service",
            badge: "Service",
            icon: "📡",
            url: "services.html",
            snippet: "High-definition organ sonography, orthopedic digital radiology, and pregnancy scans.",
            keywords: "ultrasound xray x-ray radiology scan scan bones imaging sonography"
        },
        {
            title: "24/7 ICU & Critical Oxygen Incubator",
            category: "service",
            badge: "Emergency",
            icon: "🏥",
            url: "doctors.html",
            snippet: "Continuous cardiac life support, heated neonatal incubators & emergency triage.",
            keywords: "icu emergency oxygen critical trauma life incubator 24/7 overnight"
        },
        {
            title: "Mobile Oxygen Ambulance Dispatch",
            category: "service",
            badge: "Emergency",
            icon: "🚑",
            url: "tel:03264223100",
            snippet: "Instant emergency ambulance response across Islamabad & Rawalpindi. Call 0326-4223100.",
            keywords: "ambulance mobile emergency call oxygen van rescue transport 03264223100 0326"
        },
        {
            title: "5-Star Luxury Pet Resort & Boarding",
            category: "service",
            badge: "Sanctuary",
            icon: "🏨",
            url: "pricing.html",
            snippet: "Climate-controlled private suites, gourmet room service, play areas & 24/7 webcams.",
            keywords: "hotel boarding resort stay day care pet hostel luxury suites overnight"
        },

        // Doctors
        {
            title: "Dr. Ayesha Khan (Chief Surgeon)",
            category: "doctor",
            badge: "Doctor",
            icon: "👩‍⚕️",
            url: "doctors.html",
            snippet: "Chief Veterinary Surgeon &bull; Specialist in Orthopedic & Soft Tissue Surgeries.",
            keywords: "dr ayesha khan surgeon orthopedic chief doctor surgery bone doctor on duty"
        },
        {
            title: "Dr. Hamza Malik (Emergency Critical Care)",
            category: "doctor",
            badge: "Doctor",
            icon: "👨‍⚕️",
            url: "doctors.html",
            snippet: "ICU Head &amp; Trauma Specialist &bull; 24/7 Emergency Medicine.",
            keywords: "dr hamza malik emergency icu trauma resuscitation doctor on duty"
        },
        {
            title: "Dr. Sara Ahmed (Cardiologist)",
            category: "doctor",
            badge: "Doctor",
            icon: "👩‍⚕️",
            url: "doctors.html",
            snippet: "Veterinary Cardiologist &amp; Feline Internal Medicine Specialist.",
            keywords: "dr sara ahmed cardiologist heart feline cat internal medicine doctor on duty"
        },
        {
            title: "Dr. Bilal Tariq (Dermatologist & Dental)",
            category: "doctor",
            badge: "Doctor",
            icon: "👨‍⚕️",
            url: "doctors.html",
            snippet: "Companion Animal Dermatology, Allergies &amp; Dental Surgery.",
            keywords: "dr bilal tariq skin dermatology allergy coat dental doctor on duty"
        },
        {
            title: "Dr. Zoya Tariq (Exotic & Avian Specialist)",
            category: "doctor",
            badge: "Doctor",
            icon: "👩‍⚕️",
            url: "doctors.html",
            snippet: "Consultant for Exotic Pets, Parrots, Avian &amp; Small Mammals.",
            keywords: "dr zoya tariq birds parrots rabbit exotics doctor on duty"
        },
        {
            title: "Dr. Usman Farooq (Anesthesiologist)",
            category: "doctor",
            badge: "Doctor",
            icon: "👨‍⚕️",
            url: "doctors.html",
            snippet: "Senior Veterinary Anesthesiologist &amp; Advanced Ultrasound Radiologist.",
            keywords: "dr usman farooq anesthesia pain ultrasound doctor on duty"
        },

        // VIP Store & Diets
        {
            title: "VetiMedicos Gastrointestinal Biome Diet",
            category: "product",
            badge: "Store VIP",
            icon: "🥣",
            url: "shop.html",
            snippet: "Prescription dry kibble for acute gastrointestinal recovery, vomiting & sensitive gut.",
            keywords: "gastrointestinal gastro stomach digest diet food royal canin kibble"
        },
        {
            title: "VetiMedicos Royal Kitten Growth Starter",
            category: "product",
            badge: "Store VIP",
            icon: "🐱",
            url: "shop.html",
            snippet: "Ultra-nutritious formula with DHA, colostrum & prebiotics for kitten development.",
            keywords: "kitten kitten food milk baby cat royal persian growth diet"
        },
        {
            title: "VetiMedicos Persian Coat Lustre Kibble",
            category: "product",
            badge: "Store VIP",
            icon: "🦁",
            url: "shop.html",
            snippet: "Omega-3/6 silk coat protection & hairball control for long-haired cats.",
            keywords: "persian cat fur coat hairball dry food longhair royal diet"
        },
        {
            title: "VetiMedicos Maxi Adult Dog Joint Care",
            category: "product",
            badge: "Store VIP",
            icon: "🐕",
            url: "shop.html",
            snippet: "Glucosamine & chondroitin enriched food for large breed dogs (GSD, Labrador, Husky).",
            keywords: "maxi dog adult large breed german shepherd labrador joint food diet"
        },
        {
            title: "VetiMedicos Hypoallergenic Wet Gravy",
            category: "product",
            badge: "Store VIP",
            icon: "🍲",
            url: "shop.html",
            snippet: "Hydrolyzed protein pouches for pets with severe food allergies and dermatitis.",
            keywords: "hypoallergenic wet food pouch gravy sensitive allergy royal diet"
        },
        {
            title: "VetiMedicos Renal & Hepatic Care Diet",
            category: "product",
            badge: "Store VIP",
            icon: "🩺",
            url: "shop.html",
            snippet: "Therapeutic low-phosphorus diet for kidney support & hepatic liver balance.",
            keywords: "renal kidney hepatic liver failure therapy diet food prescription"
        },
        {
            title: "Luxury Orthopedic Velvet Pet Bed",
            category: "product",
            badge: "Store VIP",
            icon: "🛏️",
            url: "shop.html",
            snippet: "Memory foam joint pressure-relief cushion with washable faux-fur velvet cover.",
            keywords: "bed bedding cushion velvet mattress sleep luxury"
        },
        {
            title: "24K Gold Trim Italian Leather Collar",
            category: "product",
            badge: "Store VIP",
            icon: "✨",
            url: "shop.html",
            snippet: "Handcrafted Italian saddle leather with polished gold crest buckle & leash.",
            keywords: "collar harness leash leather gold accessories gear"
        },

        // Pricing Plans
        {
            title: "Royal Silver Healthcare Plan (Rs. 4,500/mo)",
            category: "pricing",
            badge: "Membership",
            icon: "🩺",
            url: "pricing.html",
            snippet: "Essential wellness: 2 OPD visits/mo, core annual vaccines, passport & 5% store discount.",
            keywords: "silver plan pricing cost monthly yearly 4500 43200 membership package"
        },
        {
            title: "Royal Gold Healthcare Plan (👑 Most Popular)",
            category: "pricing",
            badge: "Membership",
            icon: "👑",
            url: "pricing.html",
            snippet: "Rs. 8,500/mo or Rs. 81,600/yr: Unlimited zero-fee OPD, 7-in-1 vaccine, spa & diagnostics.",
            keywords: "gold plan most popular best value pricing 8500 81600 membership yearly"
        },
        {
            title: "Imperial Platinum VIP Concierge Plan",
            category: "pricing",
            badge: "Membership",
            icon: "💎",
            url: "pricing.html",
            snippet: "Rs. 14,500/mo or Rs. 139,200/yr: Unlimited OPD + 2 surgeries, free ambulance, private vet.",
            keywords: "platinum imperial pro vip concierge 14500 139200 surgery ambulance"
        },
        {
            title: "Detailed 12-Privilege Feature Comparison",
            category: "pricing",
            badge: "Pricing",
            icon: "📊",
            url: "pricing.html",
            snippet: "Side-by-side comparison of surgeries, diagnostics, boarding & discounts.",
            keywords: "comparison compare table matrix plans difference features"
        },
        {
            title: "30-Day Money-Back Guarantee Policy",
            category: "pricing",
            badge: "Guarantee",
            icon: "🛡️",
            url: "pricing.html",
            snippet: "100% risk-free trial. Full refund within 30 days if you're not completely satisfied.",
            keywords: "refund guarantee cancel policy money back 30 days terms"
        },

        // Discounts & Coupons
        {
            title: "Promo VETI-WELCOME30 (30% OFF First OPD)",
            category: "discount",
            badge: "Coupon",
            icon: "🎟️",
            url: "discount.html",
            snippet: "Avail 30% discount on comprehensive first-time veterinary examination. Save Rs. 1,050.",
            keywords: "veti-welcome30 welcome 30% discount coupon voucher promo code opd"
        },
        {
            title: "Promo ROYALSPA25 (25% OFF Spa & Hydrotherapy)",
            category: "discount",
            badge: "Coupon",
            icon: "🛁",
            url: "discount.html",
            snippet: "25% discount on deluxe hydrotherapy bath, facial & blowout styling. Save Rs. 1,500.",
            keywords: "royalspa25 25% spa groom coupon promo voucher discount"
        },
        {
            title: "Promo VETI-VAX40 (40% OFF Vaccine Bundle)",
            category: "discount",
            badge: "Coupon",
            icon: "💉",
            url: "discount.html",
            snippet: "40% discount on 7-in-1 vaccine package with anti-rabies passport. Save Rs. 3,800.",
            keywords: "veti-vax40 40% vaccine vaccination shots bundle coupon promo discount"
        },
        {
            title: "Promo DIETVIP20 (20% OFF Prescription Diets)",
            category: "discount",
            badge: "Coupon",
            icon: "🥣",
            url: "discount.html",
            snippet: "20% discount on VetiMedicos clinical kibble & recovery nutrition.",
            keywords: "dietvip20 20% diet food store coupon promo discount"
        },
        {
            title: "Promo SMILEPET50 (50% OFF Dental Descaling)",
            category: "discount",
            badge: "Coupon",
            icon: "✨",
            url: "discount.html",
            snippet: "50% half-price discount on ultrasonic dental tartar removal. Save Rs. 3,500.",
            keywords: "smilepet50 50% dental teeth tartar coupon promo discount"
        },
        {
            title: "Promo ICU-RESCUE (100% FREE Ambulance Dispatch)",
            category: "discount",
            badge: "Coupon",
            icon: "🚑",
            url: "discount.html",
            snippet: "Zero charges for emergency mobile ICU ambulance ride with hospital admission.",
            keywords: "icu-rescue free ambulance ride coupon promo voucher discount"
        },

        // Hospital Info & Contacts
        {
            title: "24/7 Critical Emergency Helpline (0326-4223100)",
            category: "info",
            badge: "Helpline",
            icon: "📞",
            url: "tel:03264223100",
            snippet: "Immediate phone connection with emergency veterinary triage desk. Dial 0326-4223100.",
            keywords: "emergency call phone number helpline contact 03264223100 0326 4223100 dial"
        },
        {
            title: "Online Appointment Booking Desk",
            category: "info",
            badge: "Booking",
            icon: "📅",
            url: "index.html#booking",
            snippet: "Schedule appointments with senior doctors, surgeons, or pet spa specialists online.",
            keywords: "booking appointment schedule doctor visit reserve date slot"
        },
        {
            title: "Signed-In VIP Clients & Pets Directory",
            category: "info",
            badge: "Directory",
            icon: "🐾",
            url: "clients.html",
            snippet: "Browse registered pets, breeds, VIP loyalty status, and medical history passports.",
            keywords: "clients pets directory parents parent dogs cats users accounts"
        },
        {
            title: "Payment Methods: Cash on Delivery, Raast & JazzCash",
            category: "info",
            badge: "Payments",
            icon: "💳",
            url: "pricing.html",
            snippet: "Pay easily via COD, Bank Transfer, Visa, Mastercard, Raast, JazzCash or EasyPaisa.",
            keywords: "payment cod cash on delivery raast jazzcash easypaisa card pay bank"
        },
        {
            title: "Clients & Pets Medical History Records",
            category: "info",
            badge: "Medical Records",
            icon: "📜",
            url: "history.html",
            snippet: "Access verified encounter timelines, medical records, diagnostic histories, and clinical reports.",
            keywords: "history medical records reports lab blood x-ray ultrasound clients pets tests"
        },
        {
            title: "Official Diagnostic Medical Reports",
            category: "info",
            badge: "Clinical Reports",
            icon: "🩺",
            url: "history.html",
            snippet: "View and print official clinical lab results, CBC, biochemistry panels, ultrasound, and radiology scans.",
            keywords: "medical reports cbc blood test ultrasound x-ray cytology urinalysis labs diagnostic letterhead"
        }
    ];

    // Ensure search modal markup exists in DOM
    function ensureSearchModalMarkup() {
        let searchModal = document.getElementById('site-search-modal');
        if (!searchModal) {
            const modalHtml = `
            <div class="search-modal-backdrop" id="site-search-modal" role="dialog" aria-modal="true" aria-label="Search VetiMedicos">
                <div class="search-modal-card">
                    <div class="search-input-header">
                        <div class="search-input-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input type="text" class="search-main-input" id="site-search-input" placeholder="Search services, doctors, diets, plans, coupons, emergency..." autocomplete="off">
                        <button type="button" class="search-clear-btn" id="site-search-clear" aria-label="Clear input">&times;</button>
                        <button type="button" class="search-close-pill" id="site-search-close">ESC</button>
                    </div>

                    <div class="search-categories-bar" id="search-cat-bar">
                        <button type="button" class="search-cat-btn active" data-cat="all">🔥 All Info</button>
                        <button type="button" class="search-cat-btn" data-cat="service">🏥 Services</button>
                        <button type="button" class="search-cat-btn" data-cat="doctor">🩺 Doctors</button>
                        <button type="button" class="search-cat-btn" data-cat="product">🛍️ Store &amp; Diets</button>
                        <button type="button" class="search-cat-btn" data-cat="pricing">💎 Pricing</button>
                        <button type="button" class="search-cat-btn" data-cat="discount">🎟️ Coupons</button>
                        <button type="button" class="search-cat-btn" data-cat="info">ℹ️ Hospital Info</button>
                    </div>

                    <div class="search-results-list" id="site-search-results">
                        <!-- Populated dynamically -->
                    </div>

                    <div class="search-modal-footer">
                        <span>💡 Press <strong>ESC</strong> to exit &bull; Instant search across all pages</span>
                        <span>VetiMedicos &bull; EST. 2026</span>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            bindSearchCategoryListeners();
        }
    }
    ensureSearchModalMarkup();

    const searchInput = document.getElementById('site-search-input');
    const searchClear = document.getElementById('site-search-clear');
    const searchClose = document.getElementById('site-search-close');
    const searchResults = document.getElementById('site-search-results');
    const catButtons = document.querySelectorAll('#search-cat-bar .search-cat-btn');

    let currentSearchCat = 'all';

    window.openSearchModal = function() {
        let modal = document.getElementById('site-search-modal');
        if (!modal) {
            ensureSearchModalMarkup();
            modal = document.getElementById('site-search-modal');
        }
        if (!modal) return;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        const input = document.getElementById('site-search-input');
        setTimeout(() => {
            if (input) {
                input.focus();
                renderSearchResults(input.value.trim());
            }
        }, 80);
    };

    window.closeSearchModal = function() {
        const modal = document.getElementById('site-search-modal');
        if (!modal) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
    };

    // Delegated click listener for all search triggers and close actions
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-search-btn, #nav-search-btn')) {
            e.preventDefault();
            window.openSearchModal();
        } else if (e.target.closest('#site-search-close')) {
            e.preventDefault();
            window.closeSearchModal();
        } else if (e.target && e.target.id === 'site-search-modal') {
            window.closeSearchModal();
        }
    });

    function bindSearchCategoryListeners() {
        const catButtons = document.querySelectorAll('#search-cat-bar .search-cat-btn');
        catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                catButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSearchCat = btn.getAttribute('data-cat') || 'all';
                const input = document.getElementById('site-search-input');
                renderSearchResults(input ? input.value.trim() : '');
            });
        });

        const input = document.getElementById('site-search-input');
        const clear = document.getElementById('site-search-clear');
        if (input) {
            input.addEventListener('input', () => {
                const query = input.value.trim();
                if (clear) clear.style.display = query ? 'flex' : 'none';
                renderSearchResults(query);
            });
        }
    }

    bindSearchCategoryListeners();

    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('site-search-modal');
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            window.closeSearchModal();
        }
        // Ctrl+K or Cmd+K shortcut
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            window.openSearchModal();
        }
    });

    function getBadgeClass(cat) {
        if (cat === 'service') return 'badge-service';
        if (cat === 'doctor') return 'badge-doctor';
        if (cat === 'product') return 'badge-product';
        if (cat === 'pricing') return 'badge-pricing';
        if (cat === 'discount') return 'badge-discount';
        return 'badge-info';
    }

    function renderSearchResults(query) {
        if (!searchResults) return;
        const q = query.toLowerCase();

        let filtered = siteSearchDatabase.filter(item => {
            if (currentSearchCat !== 'all' && item.category !== currentSearchCat) {
                return false;
            }
            if (!q) return true;
            const haystack = (item.title + ' ' + item.snippet + ' ' + item.keywords + ' ' + item.badge).toLowerCase();
            return haystack.includes(q);
        });

        if (filtered.length === 0) {
            searchResults.innerHTML = `
            <div class="search-empty-state">
                <div class="search-empty-icon">🔍</div>
                <div class="search-empty-title">No matching information found</div>
                <p class="search-empty-desc">We couldn't find anything matching "<strong>${escapeHtml(query)}</strong>". Try searching for vaccines, doctor names, kitten diets, pricing tiers, or emergency helpline.</p>
                <div class="search-suggestions-wrap">
                    <span class="search-suggestion-pill" onclick="triggerSearchPreset('Vaccinations')">💉 Vaccinations</span>
                    <span class="search-suggestion-pill" onclick="triggerSearchPreset('Dr. Ayesha')">👩‍⚕️ Dr. Ayesha</span>
                    <span class="search-suggestion-pill" onclick="triggerSearchPreset('Royal Gold')">👑 Royal Gold Plan</span>
                    <span class="search-suggestion-pill" onclick="triggerSearchPreset('Emergency 0326')">🚑 Emergency Call</span>
                    <span class="search-suggestion-pill" onclick="triggerSearchPreset('Kitten Food')">🐱 Kitten Diets</span>
                    <span class="search-suggestion-pill" onclick="triggerSearchPreset('Spa')">🛁 Hydrotherapy Spa</span>
                </div>
            </div>`;
            return;
        }

        let html = '';
        filtered.forEach(item => {
            const badgeClass = getBadgeClass(item.category);
            html += `
            <a href="${item.url}" class="search-result-item" onclick="handleSearchResultClick(event, '${item.url}')">
                <div class="search-item-icon-box" aria-hidden="true">${item.icon}</div>
                <div class="search-item-info">
                    <div class="search-item-title-row">
                        <span class="search-item-title">${item.title}</span>
                        <span class="search-item-cat-badge ${badgeClass}">${item.badge}</span>
                    </div>
                    <div class="search-item-snippet">${item.snippet}</div>
                </div>
                <div class="search-item-action">
                    <span>Open</span>
                    <span>➔</span>
                </div>
            </a>`;
        });

        searchResults.innerHTML = html;
    }

    window.triggerSearchPreset = function(text) {
        if (searchInput) {
            searchInput.value = text;
            if (searchClear) searchClear.style.display = 'flex';
            renderSearchResults(text);
        }
    };

    window.handleSearchResultClick = function(event, url) {
        closeSearchModal();
        if (url.startsWith('tel:')) {
            window.location.href = url;
        } else {
            window.location.href = url;
        }
    };

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // =========================================================================
    // VetiMedicos Official Clinical Reports & Medical History Subsystem
    // =========================================================================
    const CLINICAL_REPORTS_DATABASE = {
        'LAB-90412': {
            id: 'LAB-90412',
            title: 'Complete Blood Count (CBC) & Automated Hematology',
            category: 'Laboratory Hematology',
            encounterDate: '14 August 2026',
            sampleType: 'Whole Blood (K2-EDTA)',
            department: 'Clinical Pathology Department',
            doctor: 'Dr. Ayesha Malik',
            doctorTitle: 'Lead Veterinary Surgeon & Pathologist',
            doctorReg: 'PVMC #VET-8841-A',
            patient: {
                name: 'Rocky',
                species: 'Canine (Dog)',
                breed: 'Golden Retriever',
                age: '2.5 Years',
                sex: 'Male (Neutered)',
                weight: '31.4 kg',
                owner: 'Hamza Khan',
                phone: '+92 321 7766554',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'Hemoglobin (Hb)', val: '15.8 g/dL', ref: '12.0 - 18.0 g/dL', flag: 'normal' },
                { test: 'Hematocrit (PCV)', val: '46.2 %', ref: '37.0 - 55.0 %', flag: 'normal' },
                { test: 'Total Leukocyte Count (WBC)', val: '9.4 x10³/µL', ref: '6.0 - 17.0 x10³/µL', flag: 'normal' },
                { test: 'Platelets (PLT)', val: '320 x10³/µL', ref: '175 - 500 x10³/µL', flag: 'normal' },
                { test: 'Segmented Neutrophils', val: '68 %', ref: '60 - 77 %', flag: 'normal' },
                { test: 'Lymphocytes', val: '22 %', ref: '12 - 30 %', flag: 'normal' },
                { test: 'Eosinophils', val: '4 %', ref: '2 - 10 %', flag: 'normal' },
                { test: 'Blood Parasites (Microfilaria, Babesia)', val: 'NOT DETECTED', ref: 'Negative', flag: 'normal' }
            ],
            impression: 'Normocytic, normochromic erythrocytes. Adequate platelets with zero clumping. White blood cell indices unremarkable. Complete absence of intra-erythrocytic hemoparasites. Patient shows excellent overall hematologic health and strong immune reserve.',
            signature: 'Dr. Ayesha Malik, DVM, M.Phil'
        },
        'IMM-90415': {
            id: 'IMM-90415',
            title: 'Canine Parvovirus IgG Serum Antibody Titre Panel',
            category: 'Immunology & Serology',
            encounterDate: '10 February 2026',
            sampleType: 'Serum (Centrifuged Clot Activator)',
            department: 'Infectious Disease Research Wing',
            doctor: 'Dr. Bilal Raza',
            doctorTitle: 'Infectious Disease Specialist & Critical Care',
            doctorReg: 'PVMC #VET-9102-B',
            patient: {
                name: 'Rocky',
                species: 'Canine (Dog)',
                breed: 'Golden Retriever',
                age: '2.0 Years',
                sex: 'Male (Neutered)',
                weight: '29.1 kg (Post-Recovery)',
                owner: 'Hamza Khan',
                phone: '+92 321 7766554',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'CPV Fecal Antigen (ELISA)', val: 'NEGATIVE (Cleared)', ref: 'Negative', flag: 'normal' },
                { test: 'CPV Serum IgG Neutralizing Titre', val: '1 : 1280 (High Immunity)', ref: '> 1 : 80 Protective', flag: 'normal' },
                { test: 'Serum Total Protein', val: '6.8 g/dL', ref: '5.4 - 7.5 g/dL', flag: 'normal' },
                { test: 'Albumin / Globulin Ratio', val: '1.05', ref: '0.6 - 1.2', flag: 'normal' },
                { test: 'Electrolytes (Na⁺ / K⁺)', val: '144 / 4.4 mmol/L', ref: '138-152 / 3.8-5.3', flag: 'normal' }
            ],
            impression: 'Convalescent antibody evaluation following successful 24/7 ICU inpatient protocol. Strong neutralizing serum IgG titre (>1:1280) demonstrates robust acquired protective immunity. Complete viral shedding cessation confirmed.',
            signature: 'Dr. Bilal Raza, DVM, MSc Infectious Diseases'
        },
        'MIC-44102': {
            id: 'MIC-44102',
            title: 'Deep Auricular Swab Cytology & Gram Staining',
            category: 'Diagnostic Microbiology & Dermatology',
            encounterDate: '02 September 2026',
            sampleType: 'Deep Bilateral External Auditory Canal Swab',
            department: 'Dermatology & Mycology Unit',
            doctor: 'Dr. Hira Siddiqui',
            doctorTitle: 'Senior Veterinary Dermatologist',
            doctorReg: 'PVMC #VET-7734-H',
            patient: {
                name: 'Max',
                species: 'Canine (Dog)',
                breed: 'German Shepherd',
                age: '3.5 Years',
                sex: 'Male (Intact)',
                weight: '38.2 kg',
                owner: 'Hamza Khan',
                phone: '+92 321 7766554',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'Right Ear Malassezia Yeast Count', val: '18 - 25 / HPF (Marked)', ref: '< 2 / HPF Normal', flag: 'high' },
                { test: 'Left Ear Malassezia Yeast Count', val: '3 - 5 / HPF (Mild)', ref: '< 2 / HPF Normal', flag: 'high' },
                { test: 'Cocci Bacteria (Staphylococcus spp.)', val: 'Rare (+)', ref: 'None / HPF', flag: 'normal' },
                { test: 'Rod Bacteria (Pseudomonas)', val: 'NOT DETECTED', ref: 'Negative', flag: 'normal' },
                { test: 'Otodectes cynotis (Ear Mites)', val: 'NOT DETECTED', ref: 'Negative', flag: 'normal' }
            ],
            impression: 'Microscopic examination confirms acute ceruminous otitis externa predominantly driven by Malassezia pachydermatis yeast overgrowth in right ear. Tympanic membranes intact bilaterally. 10-day topical posaconazole therapy advised.',
            signature: 'Dr. Hira Siddiqui, DVM, M.Phil Veterinary Dermatology'
        },
        'US-70231': {
            id: 'US-70231',
            title: 'High-Resolution Abdominal Diagnostic Ultrasonography',
            category: 'Diagnostic Imaging & Sonography',
            encounterDate: '19 July 2026',
            sampleType: 'Real-time B-Mode & Color Doppler Ultrasound',
            department: 'Advanced Radiology & Sonography Pavilion',
            doctor: 'Dr. Farhan Ahmed',
            doctorTitle: 'Specialist Radiologist & Ultrasonographer',
            doctorReg: 'PVMC #VET-6649-F',
            patient: {
                name: 'Bella',
                species: 'Feline (Cat)',
                breed: 'Purebred Persian Cat',
                age: '2.0 Years',
                sex: 'Female (Spayed)',
                weight: '4.1 kg',
                owner: 'Sara Malik',
                phone: '+92 301 5558899',
                clientTier: 'Platinum Elite'
            },
            results: [
                { test: 'Right Kidney Length & Architecture', val: '3.6 cm & Smooth Margins', ref: '3.2 - 4.2 cm Normal', flag: 'normal' },
                { test: 'Left Kidney Length & Architecture', val: '3.7 cm & Sharp Corticomedullary', ref: '3.2 - 4.2 cm Normal', flag: 'normal' },
                { test: 'Anechoic Renal Cysts (PKD Screen)', val: 'ZERO DETECTED (Clear)', ref: 'Absent', flag: 'normal' },
                { test: 'Urinary Bladder Wall Thickness', val: '1.2 mm (No Uroliths)', ref: '< 2.0 mm', flag: 'normal' },
                { test: 'Hepatic & Splenic Parenchyma', val: 'Homogeneous Normo-echoic', ref: 'Homogeneous', flag: 'normal' }
            ],
            impression: 'High-frequency 12MHz transducer evaluation reveals completely normal feline renal parenchyma with preserved corticomedullary demarcation and distinct sinus architecture. Zero microscopic or macroscopic cysts noted. Persian PKD-free certification granted.',
            signature: 'Dr. Farhan Ahmed, DVM, MS Diagnostic Radiology'
        },
        'BIO-61094': {
            id: 'BIO-61094',
            title: 'Pre-Anesthetic Comprehensive Serum Biochemistry Profile',
            category: 'Clinical Biochemistry',
            encounterDate: '05 March 2026',
            sampleType: 'Serum (Lithium Heparin Separator)',
            department: 'Clinical Biochemistry Unit',
            doctor: 'Dr. Zainab Tariq',
            doctorTitle: 'Dental & Soft Tissue Surgeon',
            doctorReg: 'PVMC #VET-5521-Z',
            patient: {
                name: 'Bella',
                species: 'Feline (Cat)',
                breed: 'Purebred Persian Cat',
                age: '1.8 Years',
                sex: 'Female (Spayed)',
                weight: '4.0 kg',
                owner: 'Sara Malik',
                phone: '+92 301 5558899',
                clientTier: 'Platinum Elite'
            },
            results: [
                { test: 'Blood Urea Nitrogen (BUN)', val: '21 mg/dL', ref: '16 - 36 mg/dL', flag: 'normal' },
                { test: 'Serum Creatinine', val: '1.1 mg/dL', ref: '0.8 - 2.1 mg/dL', flag: 'normal' },
                { test: 'Alanine Aminotransferase (ALT)', val: '38 U/L', ref: '20 - 100 U/L', flag: 'normal' },
                { test: 'Alkaline Phosphatase (ALP)', val: '24 U/L', ref: '12 - 58 U/L', flag: 'normal' },
                { test: 'Blood Glucose', val: '92 mg/dL', ref: '70 - 140 mg/dL', flag: 'normal' },
                { test: 'Total Protein (TP)', val: '7.1 g/dL', ref: '5.9 - 8.5 g/dL', flag: 'normal' }
            ],
            impression: 'Renal, hepatic, and metabolic profiles all strictly within optimal physiological range. ASA Grade 1 clearance granted for general inhalation anesthesia (Isoflurane) for dental ultrasonic scaling.',
            signature: 'Dr. Zainab Tariq, DVM, M.Phil Surgery'
        },
        'ISO-55109': {
            id: 'ISO-55109',
            title: 'International ISO 11784/11785 Microchip & Travel Certificate',
            category: 'Quarantine & Global Travel Certification',
            encounterDate: '11 June 2026',
            sampleType: 'Electronic RFID Transponder Verification & Serology',
            department: 'International Pet Passport Bureau',
            doctor: 'Dr. Bilal Raza',
            doctorTitle: 'Certifying Quarantine Veterinary Official',
            doctorReg: 'PVMC #VET-9102-B',
            patient: {
                name: 'Milo',
                species: 'Feline (Cat)',
                breed: 'British Shorthair',
                age: '1.0 Year',
                sex: 'Male (Intact)',
                weight: '4.8 kg',
                owner: 'Sara Malik',
                phone: '+92 301 5558899',
                clientTier: 'Platinum Elite'
            },
            results: [
                { test: 'RFID Transponder Code (134.2 kHz)', val: '981098102399554', ref: '15-Digit FDX-B Standard', flag: 'normal' },
                { test: 'Transponder Anatomic Site', val: 'Subcutaneous Interscapular', ref: 'Dorsal Midline Neck', flag: 'normal' },
                { test: 'Rabies Neutralizing Antibody Titre (FAVN)', val: '1.85 IU/mL', ref: '≥ 0.50 IU/mL Passing', flag: 'normal' },
                { test: 'FIV / FeLV Dual Antigen/Antibody', val: 'NEGATIVE (Clear)', ref: 'Negative', flag: 'normal' },
                { test: 'Clinical Fitness for Air Travel', val: 'CERTIFIED FIT (100%)', ref: 'Fit for Travel', flag: 'normal' }
            ],
            impression: 'Full verification of microchip transponder and rabies antibody titer meeting European Union (EU Pet Passport), UK DEFRA, and USDA travel criteria. Holographic seal affixed.',
            signature: 'Dr. Bilal Raza, Official Certifying Officer'
        },
        'RAD-81093': {
            id: 'RAD-81093',
            title: 'Digital Orthopedic Radiographic Diagnostic Report (Pelvic Views)',
            category: 'Diagnostic Radiology & Orthopedics',
            encounterDate: '20 May 2026',
            sampleType: 'Digital Direct Radiography (DR) 2-View Extended Pelvis',
            department: 'Orthopedic Imaging & Surgical Suite',
            doctor: 'Dr. Farhan Ahmed',
            doctorTitle: 'Senior Orthopedic Specialist & Radiologist',
            doctorReg: 'PVMC #VET-6649-F',
            patient: {
                name: 'Leo',
                species: 'Canine (Dog)',
                breed: 'Siberian Husky',
                age: '3.0 Years',
                sex: 'Male (Neutered)',
                weight: '27.8 kg',
                owner: 'Zoya Qureshi',
                phone: '+92 333 9988776',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'Right Norberg Angle', val: '106° (Optimal Congruency)', ref: '≥ 105° Normal', flag: 'normal' },
                { test: 'Left Norberg Angle', val: '99° (Mild Subluxation)', ref: '≥ 105° Normal', flag: 'low' },
                { test: 'Femoral Head Cranial Coverage (Right)', val: '62 % (Excellent)', ref: '> 50 % Normal', flag: 'normal' },
                { test: 'Femoral Head Cranial Coverage (Left)', val: '46 % (Mild Incongruency)', ref: '> 50 % Normal', flag: 'low' },
                { test: 'Osteophytosis / Morgan Line', val: 'NO Secondary Arthrosis', ref: 'Absent', flag: 'normal' }
            ],
            impression: 'Ventrodorsal extended-leg radiographs reveal mild laxity of the left coxofemoral joint consistent with early Grade 1 Hip Dysplasia without secondary degenerative osteophytosis. Right hip is structurally flawless. Conservative weight management, chondroprotectives, and hydrotherapy advised.',
            signature: 'Dr. Farhan Ahmed, DVM, MS Orthopedics'
        },
        'BIO-81096': {
            id: 'BIO-81096',
            title: 'Serum Canine C-Reactive Protein (cCRP) & Joint Biomarkers',
            category: 'Pathology & Joint Health Biomarkers',
            encounterDate: '14 January 2026',
            sampleType: 'Serum Clot Tube',
            department: 'Immunology & Clinical Pathology Lab',
            doctor: 'Dr. Ayesha Malik',
            doctorTitle: 'Lead Veterinary Surgeon',
            doctorReg: 'PVMC #VET-8841-A',
            patient: {
                name: 'Leo',
                species: 'Canine (Dog)',
                breed: 'Siberian Husky',
                age: '2.6 Years',
                sex: 'Male (Neutered)',
                weight: '27.4 kg',
                owner: 'Zoya Qureshi',
                phone: '+92 333 9988776',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'Canine C-Reactive Protein (cCRP)', val: '4.2 mg/L', ref: '< 10.0 mg/L Normal', flag: 'normal' },
                { test: 'Serum Amyloid A (SAA)', val: '1.8 mg/L', ref: '< 5.0 mg/L Normal', flag: 'normal' },
                { test: 'Alkaline Phosphatase (Bone Isoenzyme)', val: '42 U/L', ref: '20 - 90 U/L', flag: 'normal' },
                { test: 'Serum Calcium / Phosphorus', val: '9.8 / 3.9 mg/dL', ref: '9.0-11.5 / 2.5-5.0', flag: 'normal' }
            ],
            impression: 'Acute systemic inflammatory biomarkers are completely within normal physiological limits. Confirming absence of active synovitis or osteoarthritic inflammatory flare.',
            signature: 'Dr. Ayesha Malik, DVM, M.Phil'
        },
        'EXO-33104': {
            id: 'EXO-33104',
            title: 'Avian Specialized Serum Biochemistry & Ionized Calcium Profile',
            category: 'Avian & Exotic Clinical Chemistry',
            encounterDate: '18 September 2026',
            sampleType: 'Micro-Heparinized Avian Whole Blood (Jugular)',
            department: 'Avian & Wildlife Medicine Pavilion',
            doctor: 'Dr. Zainab Tariq',
            doctorTitle: 'Avian & Exotic Pets Specialist',
            doctorReg: 'PVMC #VET-5521-Z',
            patient: {
                name: 'Coco',
                species: 'Avian (Bird)',
                breed: 'African Grey Parrot (Psittacus erithacus)',
                age: '4.0 Years',
                sex: 'Male (DNA Sexed)',
                weight: '445 g',
                owner: 'Daniyal Ahmed',
                phone: '+92 312 4455667',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'Ionized Calcium (iCa)', val: '0.94 mmol/L (Marginal Low)', ref: '1.05 - 1.35 mmol/L', flag: 'low' },
                { test: 'Total Calcium', val: '7.8 mg/dL', ref: '8.5 - 13.0 mg/dL', flag: 'low' },
                { test: 'Inorganic Phosphorus', val: '3.6 mg/dL', ref: '2.8 - 5.5 mg/dL', flag: 'normal' },
                { test: 'Uric Acid (Renal Biomarker)', val: '4.8 mg/dL', ref: '3.0 - 10.0 mg/dL', flag: 'normal' },
                { test: 'Aspartate Aminotransferase (AST)', val: '185 U/L', ref: '100 - 350 U/L', flag: 'normal' },
                { test: 'Total Bile Acids', val: '38 µmol/L', ref: '< 60 µmol/L', flag: 'normal' }
            ],
            impression: 'Moderate nutritional hypocalcemia characteristic of seed-heavy captive African Grey diets. Renal and hepatic markers remain preserved. Prescribed liquid calcium glubionate with transition to Harrison\'s organic pellets and daily 5.0 UVB phototherapy.',
            signature: 'Dr. Zainab Tariq, DVM, Specialist Avian Medicine'
        },
        'CYT-33108': {
            id: 'CYT-33108',
            title: 'Molecular Avian Circovirus (PBFD) & Polyomavirus PCR Assay',
            category: 'Molecular Diagnostics & Avian Virology',
            encounterDate: '12 April 2026',
            sampleType: 'Whole Blood in EDTA & Calamus Feather Pulp',
            department: 'Molecular Biology & Pathology Unit',
            doctor: 'Dr. Hira Siddiqui',
            doctorTitle: 'Senior Veterinary Pathologist',
            doctorReg: 'PVMC #VET-7734-H',
            patient: {
                name: 'Coco',
                species: 'Avian (Bird)',
                breed: 'African Grey Parrot',
                age: '3.6 Years',
                sex: 'Male (DNA Sexed)',
                weight: '440 g',
                owner: 'Daniyal Ahmed',
                phone: '+92 312 4455667',
                clientTier: 'Royal Gold VIP'
            },
            results: [
                { test: 'Psittacine Circovirus (PBFD DNA)', val: 'NOT DETECTED (Negative)', ref: 'Negative Target', flag: 'normal' },
                { test: 'Avian Polyomavirus (APV DNA)', val: 'NOT DETECTED (Negative)', ref: 'Negative Target', flag: 'normal' },
                { test: 'Chlamydia psittaci (Avian Chlamydiosis)', val: 'NOT DETECTED (Negative)', ref: 'Negative Target', flag: 'normal' },
                { test: 'Internal Control PCR Amplification', val: 'VALID (Beta-Actin +)', ref: 'Positive Internal Amp', flag: 'normal' }
            ],
            impression: 'Multiplex real-time PCR testing confirms complete absence of Psittacine Beak and Feather Disease virus and Avian Polyomavirus. Feather pulp cytology confirms healthy follicular regenerative papilla.',
            signature: 'Dr. Hira Siddiqui, DVM, M.Phil Veterinary Pathology'
        },
        'DNT-22019': {
            id: 'DNT-22019',
            title: 'Lagomorph Video Endoscopy & Micro-Spur Dental Charting',
            category: 'Lagomorph Dental & Oral Surgery',
            encounterDate: '05 August 2026',
            sampleType: 'High-Definition Rigid 2.7mm Storz Oral Endoscopy',
            department: 'Exotic Dentistry & Special Species Ward',
            doctor: 'Dr. Zainab Tariq',
            doctorTitle: 'Exotic Dental & Soft Tissue Specialist',
            doctorReg: 'PVMC #VET-5521-Z',
            patient: {
                name: 'Fluffy',
                species: 'Lagomorph (Rabbit)',
                breed: 'Angora Bunny',
                age: '1.0 Year',
                sex: 'Female (Intact)',
                weight: '2.15 kg',
                owner: 'Usman & Maria Ali',
                phone: '+92 345 1122334',
                clientTier: 'Diamond VIP Member'
            },
            results: [
                { test: 'Incisor Occlusion (Upper/Lower)', val: 'Normal 2nd Upper Peg Alignment', ref: 'Normocclusion', flag: 'normal' },
                { test: 'Right Lower Molar 2 (Lingual Aspect)', val: '1.8mm Spur Plained Smooth', ref: 'No Lingual Overgrowth', flag: 'normal' },
                { test: 'Left Cheek Teeth Arcade', val: 'Symmetrical Wear Plane', ref: 'Smooth Flat Occlusion', flag: 'normal' },
                { test: 'Oral Mucosa & Tongue Margins', val: 'Mild Hyperemia (No Ulcers)', ref: 'No Ulceration', flag: 'normal' },
                { test: 'Post-Op Recovery Motility', val: 'Normoactive Cecotropes', ref: 'Normal Gut Sounds', flag: 'normal' }
            ],
            impression: 'Endoscopic evaluation identified early lingual elongation of right lower second molar. Under sevoflurane anesthesia, gentle low-speed diamond burr rasping successfully performed. Normal jaw motion restored with zero mucosal bleeding.',
            signature: 'Dr. Zainab Tariq, DVM, Exotic Dentistry Specialist'
        },
        'URN-44091': {
            id: 'URN-44091',
            title: 'Complete Urinalysis, Specific Gravity & Crystalluria Screening',
            category: 'Clinical Pathology & Feline Nephrology',
            encounterDate: '28 July 2026',
            sampleType: 'Sterile Cystocentesis Feline Urine',
            department: 'Feline Special Care Clinical Lab',
            doctor: 'Dr. Ayesha Malik',
            doctorTitle: 'Lead Veterinary Surgeon',
            doctorReg: 'PVMC #VET-8841-A',
            patient: {
                name: 'Oliver',
                species: 'Feline (Cat)',
                breed: 'Ragdoll Feline',
                age: '2.0 Years',
                sex: 'Male (Neutered)',
                weight: '5.4 kg',
                owner: 'Usman & Maria Ali',
                phone: '+92 345 1122334',
                clientTier: 'Diamond VIP Member'
            },
            results: [
                { test: 'Refractometric Urine Specific Gravity (USG)', val: '1.036 (Well-Concentrated)', ref: '1.035 - 1.060 Feline', flag: 'normal' },
                { test: 'Urinary pH', val: '6.3 (Target Acidic)', ref: '6.0 - 6.5 Target', flag: 'normal' },
                { test: 'Protein (Dipstick)', val: 'Negative', ref: 'Negative / Trace', flag: 'normal' },
                { test: 'Glucose & Ketones', val: 'Negative', ref: 'Negative', flag: 'normal' },
                { test: 'Blood / Hemoglobin', val: 'Negative', ref: 'Negative', flag: 'normal' },
                { test: 'Microscopic Struvite Crystals', val: 'NONE SEEN (0 / LPF)', ref: 'None', flag: 'normal' },
                { test: 'Microscopic Calcium Oxalate Crystals', val: 'NONE SEEN (0 / LPF)', ref: 'None', flag: 'normal' },
                { test: 'Bacterial Rods / Cocci', val: 'NOT DETECTED (Sterile)', ref: 'Negative', flag: 'normal' }
            ],
            impression: 'Sterile cystocentesis urinalysis confirms complete resolution of historic crystal risk. Optimal pH (6.3) and high specific gravity (1.036) without cellular casts or proteinuria. Feline Urinary S/O nutrition working effectively.',
            signature: 'Dr. Ayesha Malik, DVM, M.Phil'
        }
    };

    window.openClinicalReport = function(reportId) {
        const report = CLINICAL_REPORTS_DATABASE[reportId];
        if (!report) {
            if (typeof showToast === 'function') {
                showToast('error', 'Report Not Found', `Clinical record ${reportId} is currently being archived.`);
            } else {
                alert(`Clinical record ${reportId} is not available.`);
            }
            return;
        }

        const modalBackdrop = document.getElementById('report-modal-backdrop');
        const modalContent = document.getElementById('report-modal-dynamic-content');
        if (!modalBackdrop || !modalContent) return;

        let tableRows = '';
        report.results.forEach(r => {
            let flagBadge = '';
            if (r.flag === 'high') {
                flagBadge = '<span class="report-flag-pill report-flag-high">▲ HIGH</span>';
            } else if (r.flag === 'low') {
                flagBadge = '<span class="report-flag-pill report-flag-low">▼ LOW</span>';
            } else {
                flagBadge = '<span class="report-flag-pill report-flag-normal">✔ NORMAL</span>';
            }

            tableRows += `
                <tr>
                    <td style="font-weight: 700; color: #0f172a;">${r.test}</td>
                    <td style="font-weight: 800; color: #0284c7;">${r.val}</td>
                    <td style="color: #64748b;">${r.ref}</td>
                    <td>${flagBadge}</td>
                </tr>
            `;
        });

        modalContent.innerHTML = `
            <!-- Document Letterhead -->
            <div class="report-doc-header">
                <div class="report-doc-brand">
                    <img src="assets/images/vetimedicos_official_logo.png" alt="VetiMedicos Crest" class="report-doc-crest">
                    <div class="report-doc-titles">
                        <h2>VetiMedicos Animal Hospital</h2>
                        <p>5-Star Veterinary Sanctuary &bull; Diagnostic Pathology &amp; Imaging Pavilion</p>
                    </div>
                </div>
                <div class="report-doc-badges">
                    <div><strong>Report ID:</strong> ${report.id}</div>
                    <div><strong>Date of Encounter:</strong> ${report.encounterDate}</div>
                    <div><strong>Specimen:</strong> ${report.sampleType}</div>
                </div>
            </div>

            <!-- Patient Demographics -->
            <div class="report-patient-box">
                <div class="report-demo-item">
                    <span class="lbl">Patient / Pet Name</span>
                    <span class="val">${report.patient.name} (${report.patient.species})</span>
                </div>
                <div class="report-demo-item">
                    <span class="lbl">Breed &amp; Age</span>
                    <span class="val">${report.patient.breed} &bull; ${report.patient.age}</span>
                </div>
                <div class="report-demo-item">
                    <span class="lbl">Sex &amp; Weight</span>
                    <span class="val">${report.patient.sex} &bull; ${report.patient.weight}</span>
                </div>
                <div class="report-demo-item">
                    <span class="lbl">Pet Parent / Client</span>
                    <span class="val">${report.patient.owner} (${report.patient.clientTier})</span>
                </div>
                <div class="report-demo-item">
                    <span class="lbl">Emergency Contact</span>
                    <span class="val">${report.patient.phone}</span>
                </div>
                <div class="report-demo-item">
                    <span class="lbl">Attending Clinician</span>
                    <span class="val">${report.doctor} (${report.doctorReg})</span>
                </div>
            </div>

            <!-- Report Title Header -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #dfa243; padding: 10px 14px; margin-bottom: 14px; border-radius: 0 8px 8px 0;">
                <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px;">${report.department}</div>
                <div style="font-size: 1.15rem; font-weight: 900; color: #0c1e28;">${report.title}</div>
            </div>

            <!-- Diagnostic Results Table -->
            <div style="overflow-x: auto; margin-bottom: 14px;">
                <table class="report-results-table">
                    <thead>
                        <tr>
                            <th>Parameter / Assay</th>
                            <th>Observed Result</th>
                            <th>Reference Interval</th>
                            <th>Clinical Flag</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <!-- Clinical Impression Remarks -->
            <div class="report-impression-box">
                <strong>📋 Attending Specialist Interpretation &amp; Clinical Impression:</strong>
                ${report.impression}
            </div>

            <!-- Sign-Off & Official Seal -->
            <div class="report-signoff-strip">
                <div class="report-seal-badge">
                    <span class="seal-icon">🎖️</span>
                    <div>
                        <div style="font-weight: 900; color: #0c1e28;">OFFICIALLY VERIFIED VETIMEDICOS RECORD</div>
                        <div style="color: #b45309;">EST. 2026 Laurel Crest Security Stamp Registered</div>
                    </div>
                </div>
                <div class="report-doctor-sig">
                    <div class="report-sig-font">${report.signature}</div>
                    <div class="report-sig-title">${report.doctor} &bull; ${report.doctorTitle}</div>
                </div>
            </div>

            <!-- Action Buttons Bar -->
            <div class="report-modal-actions">
                <button type="button" class="btn-report-print" onclick="window.print()">
                    <span>🖨️</span> Print Official Report
                </button>
                <button type="button" class="btn-duty-login-switch" onclick="closeClinicalReport()" style="background:#f1f5f9; border-color:#cbd5e1; color:#334155; font-weight:800; padding:8px 18px; border-radius:20px; cursor:pointer;">
                    Close Window
                </button>
            </div>
        `;

        modalBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.closeClinicalReport = function() {
        const modalBackdrop = document.getElementById('report-modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    function initHistoryPageFilters() {
        const historySearchInput = document.getElementById('history-search-input');
        const historyFilterChips = document.querySelectorAll('.history-filter-chip');
        const historyCards = document.querySelectorAll('.history-pet-card');
        const reportBackdrop = document.getElementById('report-modal-backdrop');

        if (!historyCards || historyCards.length === 0) return;

        let activeFilter = 'all';
        let searchQuery = '';

        function applyHistoryFiltering() {
            const q = searchQuery.toLowerCase().trim();
            let visibleCount = 0;

            historyCards.forEach(card => {
                const species = card.getAttribute('data-species') || '';
                const petName = card.getAttribute('data-pet') || '';
                const parentName = card.getAttribute('data-parent') || '';
                const reportTypes = card.getAttribute('data-types') || '';
                const cardText = card.textContent.toLowerCase();

                // 1. Filter Chip match
                let matchesFilter = false;
                if (activeFilter === 'all') {
                    matchesFilter = true;
                } else if (activeFilter === 'Dog' || activeFilter === 'Cat' || activeFilter === 'other') {
                    matchesFilter = (species.toLowerCase() === activeFilter.toLowerCase());
                } else if (activeFilter === 'blood') {
                    matchesFilter = reportTypes.includes('blood');
                } else if (activeFilter === 'imaging') {
                    matchesFilter = reportTypes.includes('imaging');
                }

                // 2. Search match
                let matchesSearch = true;
                if (q) {
                    matchesSearch = cardText.includes(q) || petName.toLowerCase().includes(q) || parentName.toLowerCase().includes(q);
                }

                if (matchesFilter && matchesSearch) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
        }

        if (historySearchInput) {
            historySearchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                applyHistoryFiltering();
            });
        }

        historyFilterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                historyFilterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                activeFilter = chip.getAttribute('data-filter') || 'all';
                applyHistoryFiltering();
            });
        });

        // Close report modal on backdrop click or ESC
        if (reportBackdrop) {
            reportBackdrop.addEventListener('click', (e) => {
                if (e.target === reportBackdrop) {
                    window.closeClinicalReport();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeClinicalReport();
            }
        });
    }

    initHistoryPageFilters();

    // =========================================================================
    // Online Pet Checkup & Telemedicine Interactive Controller
    // =========================================================================
    function initOnlineCheckupPortal() {
        const checkupDoctorsData = {
            'doc-farhan-qureshi': {
                id: 'doc-farhan-qureshi',
                name: 'Dr. Farhan Qureshi',
                title: 'Chief Veterinary Surgeon & Orthopedics Lead',
                exp: '16+ Yrs Exp',
                license: 'PVMC #VET-PK-2026-DVM',
                avatar: '👨‍⚕️',
                dept: 'Department of Surgery & Advanced Orthopedics',
                room: 'Executive Surgery Suite 101',
                fee: 'Rs. 2,000',
                status: 'Online Now',
                accent: '#df9c30',
                greeting: "Salam! Dr. Farhan Qureshi here from Veterinary Orthopedics & Surgery. I have your pet's clinical file open on my screen. Let's examine the situation right now.",
                sampleRx: {
                    diagnosis: 'Suspected Soft Tissue Strain / Joint Sprain (Right Hindlimb)',
                    meds: [
                        'Tab. Meloxicam 1.5mg — 1 tab once daily with food for 5 days',
                        'Cap. OsteoPlus Chondroitin & Glucosamine — 1 cap daily for 30 days',
                        'Strict cage rest and cold-pack compression for 15 minutes twice daily'
                    ]
                }
            },
            'doc-ayesha-malik': {
                id: 'doc-ayesha-malik',
                name: 'Dr. Ayesha Malik',
                title: 'Senior Canine Diagnostics & Cardiology Lead',
                exp: '12+ Yrs Exp',
                license: 'PVMC #VET-PK-102-DVM',
                avatar: '👩‍⚕️',
                dept: 'Canine Wellness OPD Block A',
                room: 'OPD Room 103',
                fee: 'Rs. 1,800',
                status: 'Online Now',
                accent: '#059669',
                greeting: "Hello! Dr. Ayesha Malik here. I'm reviewing your pet's vital history. Please tell me when the symptoms started and if there is any change in appetite.",
                sampleRx: {
                    diagnosis: 'Acute Gastric Sensitivity / Mild Dietary Dysbiosis',
                    meds: [
                        'Syp. Famotidine 10mg/5ml — 2.5ml twice daily 30 mins before food',
                        'Cap. Probiotic Pro-K9 — 1 cap sprinkled on boiled chicken & rice',
                        'Hydration therapy: 150ml Electrolyte ORS water every 4 hours'
                    ]
                }
            },
            'doc-hamza-tariq': {
                id: 'doc-hamza-tariq',
                name: 'Dr. Hamza Tariq',
                title: 'Senior Feline & Exotic Avian Specialist',
                exp: '10+ Yrs Exp',
                license: 'PVMC #VET-PK-308-DVM',
                avatar: '👨‍⚕️',
                dept: 'Feline Sanctuary & Avian Surgery',
                room: 'Cat Sanctuary Suite 202',
                fee: 'Rs. 1,800',
                status: 'Online Now',
                accent: '#0284c7',
                greeting: "Salam! Dr. Hamza Tariq here. Cats and exotic birds hide discomfort very skillfully. Let me observe your pet's posture and breathing rhythm directly.",
                sampleRx: {
                    diagnosis: 'Feline Upper Respiratory Irritation / Early Rhinotracheitis',
                    meds: [
                        'Eye Drops Tobramycin 0.3% — 1 drop in both eyes thrice daily for 7 days',
                        'L-Lysine Feline Gel — 1 cm paste mixed with wet food once daily',
                        'Warm steam vaporization in bathroom for 10 minutes twice daily'
                    ]
                }
            },
            'doc-zainab-bilal': {
                id: 'doc-zainab-bilal',
                name: 'Dr. Zainab Bilal',
                title: 'Veterinary Dermatology & Allergy Consultant',
                exp: '8+ Yrs Exp',
                license: 'PVMC #VET-PK-415-DVM',
                avatar: '👩‍⚕️',
                dept: 'Dermatology & Clinical Aesthetics',
                room: 'Consultation Suite 105',
                fee: 'Rs. 1,500',
                status: 'Online Now',
                accent: '#ec4899',
                greeting: "Hello! Dr. Zainab Bilal here. Skin allergies, hotspots, and ear scratching can be very distressing. Show me the affected area closely through your camera.",
                sampleRx: {
                    diagnosis: 'Canine Atopic Dermatitis / Secondary Malassezia Itch',
                    meds: [
                        'Tab. Apoquel 5.4mg — 1 tab twice daily for 14 days, then once daily',
                        'Medicated Chlorhexidine 4% Shampoo — Bathe twice weekly (leave for 10 mins)',
                        'Omega-3 Fish Oil Concentrate — 1 pump daily with evening meal'
                    ]
                }
            },
            'doc-bilal-rehman': {
                id: 'doc-bilal-rehman',
                name: 'Dr. Bilal Rehman',
                title: 'Critical Care & Emergency ICU Director',
                exp: '14+ Yrs Exp',
                license: 'PVMC #VET-PK-520-DVM',
                avatar: '👨‍⚕️',
                dept: '24/7 Rapid Emergency Trauma Wing',
                room: 'Trauma Resuscitation E-1',
                fee: 'Rs. 2,500',
                status: 'Online Now',
                accent: '#dc2626',
                greeting: "Dr. Bilal Rehman speaking from 24/7 Emergency ICU. If your pet has pale gums, breathing difficulty, or extreme trauma, call our hotline 03264223100 immediately. Otherwise, describe the emergency here.",
                sampleRx: {
                    diagnosis: 'Post-Trauma Shock Assessment / Soft Tissue Bruising',
                    meds: [
                        'Inj/Tab. Tramadol 50mg — As prescribed per weight chart',
                        'Emergency vitals check: Mucous membrane color & CRT monitoring',
                        'Immediate in-person hospital transfer if pet develops breathing distress'
                    ]
                }
            },
            'doc-mahnoor-shah': {
                id: 'doc-mahnoor-shah',
                name: 'Dr. Mahnoor Shah',
                title: 'Veterinary Dentist & Dental Reconstruction Lead',
                exp: '9+ Yrs Exp',
                license: 'PVMC #VET-PK-633-DVM',
                avatar: '👩‍⚕️',
                dept: 'Oral Health & Dental Lab 108',
                room: 'Dental Lab 108',
                fee: 'Rs. 1,500',
                status: 'Online Now',
                accent: '#8b5cf6',
                greeting: "Salam! Dr. Mahnoor Shah here. Let's inspect the oral cavity, teeth alignment, or gingiva. Lift the lip gently so I can examine the gumline.",
                sampleRx: {
                    diagnosis: 'Periodontal Gingivitis Grade 2 / Molar Plaque Accumulation',
                    meds: [
                        'Oral Gel Chlorhexidine 0.12% — Apply directly to gums twice daily',
                        'Enzymatic Poultry Toothpaste & Finger Brush daily after meals',
                        'Ultrasonic Scaling appointment recommended within 30 days'
                    ]
                }
            }
        };

        let activeTeleTimer = null;
        let teleSeconds = 0;

        // 1. Start Online Checkup (Open Intake Dialog)
        window.startOnlineCheckup = function(doctorId) {
            const doc = checkupDoctorsData[doctorId] || checkupDoctorsData['doc-farhan-qureshi'];
            const backdrop = document.getElementById('checkup-modal-backdrop');
            const dynamicContent = document.getElementById('checkup-modal-dynamic-content');

            if (!backdrop || !dynamicContent) return;

            // Render doctor intake & patient details form
            dynamicContent.innerHTML = `
                <div style="margin-bottom: 24px; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1.5px solid rgba(223, 162, 67, 0.3);">
                        <div style="width: 66px; height: 66px; border-radius: 18px; background: linear-gradient(135deg, #fff8eb 0%, #fef3c7 100%); border: 2px solid rgba(223, 162, 67, 0.6); display: grid; place-content: center; font-size: 2.3rem; box-shadow: 0 4px 14px rgba(223, 162, 67, 0.25); flex-shrink: 0;">
                            ${doc.avatar}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <h2 style="font-size: 1.35rem; font-weight: 900; color: #0c1e28; margin: 0;">${doc.name}</h2>
                                <span style="background: #ecfdf5; color: #059669; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; border: 1px solid #a7f3d0;">🟢 ${doc.status}</span>
                                <span style="background: #f1f5f9; color: #334155; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 12px;">${doc.exp}</span>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 700; color: #b45309; margin: 2px 0;">${doc.title}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">${doc.dept} &bull; Room: <strong>${doc.room}</strong></div>
                        </div>
                    </div>

                    <!-- Consultation Channel Selector -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 0.82rem; font-weight: 800; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">1. Choose Consultation Mode:</label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1.5px solid #10b981; background: #ecfdf5; border-radius: 12px; cursor: pointer; font-size: 0.84rem; font-weight: 800; color: #065f46;">
                                <input type="radio" name="checkup-channel" value="video" checked style="accent-color: #10b981;">
                                <span>📹 HD Video Call (Best)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1.5px solid #cbd5e1; background: #f8fafc; border-radius: 12px; cursor: pointer; font-size: 0.84rem; font-weight: 700; color: #475569;">
                                <input type="radio" name="checkup-channel" value="chat" style="accent-color: #df9c30;">
                                <span>💬 Live Chat &amp; Photos</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1.5px solid #cbd5e1; background: #f8fafc; border-radius: 12px; cursor: pointer; font-size: 0.84rem; font-weight: 700; color: #475569;">
                                <input type="radio" name="checkup-channel" value="audio" style="accent-color: #0284c7;">
                                <span>📞 Direct Audio Call</span>
                            </label>
                        </div>
                    </div>

                    <!-- Patient Intake Form -->
                    <div style="background: rgba(255, 252, 245, 0.8); border: 1px solid rgba(223, 162, 67, 0.35); border-radius: 16px; padding: 16px 20px; margin-bottom: 20px;">
                        <div style="font-size: 0.82rem; font-weight: 800; color: #b45309; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">2. Pet Patient &amp; Symptoms Info:</div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 4px;">Pet Name *</label>
                                <input type="text" id="tele-pet-name" value="Leo" placeholder="e.g. Leo, Bella, Milo" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.88rem; font-family: inherit;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 4px;">Species / Type *</label>
                                <select id="tele-pet-type" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.88rem; font-family: inherit; background: #fff;">
                                    <option value="Dog (Canine)" selected>🐕 Dog (Canine)</option>
                                    <option value="Cat (Feline)">🐈 Cat (Feline)</option>
                                    <option value="Bird (Avian)">🦜 Bird (Avian)</option>
                                    <option value="Rabbit (Lagomorph)">🐇 Rabbit (Lagomorph)</option>
                                    <option value="Other Companion">🐾 Other Companion</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 4px;">Describe Symptoms / Health Issue *</label>
                            <textarea id="tele-pet-symptoms" rows="3" placeholder="Describe symptoms (e.g. itching ears, refusing dry food, lethargic, limping on left paw)..." style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.86rem; font-family: inherit; resize: vertical;">Mild fever, decreased appetite for past 24 hours, and lethargic behavior.</textarea>
                        </div>

                        <!-- Quick symptom pills -->
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; margin-right: 4px; align-self: center;">Quick tags:</span>
                            <button type="button" onclick="document.getElementById('tele-pet-symptoms').value += ' [High Fever &amp; Warm Ears]';" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; color: #334155;">🌡️ Fever</button>
                            <button type="button" onclick="document.getElementById('tele-pet-symptoms').value += ' [Skin Itching &amp; Red Patches]';" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; color: #334155;">✨ Itching</button>
                            <button type="button" onclick="document.getElementById('tele-pet-symptoms').value += ' [Vomiting &amp; Refusing Meals]';" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; color: #334155;">🥣 Loss of Appetite</button>
                            <button type="button" onclick="document.getElementById('tele-pet-symptoms').value += ' [Limping &amp; Joint Pain]';" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; color: #334155;">🦴 Limping</button>
                        </div>
                    </div>

                    <!-- Connect Action Footer -->
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; border-top: 1.5px dashed rgba(223, 162, 67, 0.35); padding-top: 16px;">
                        <div>
                            <div style="font-size: 0.74rem; color: #64748b;">Consultation Fee:</div>
                            <div style="font-size: 1.3rem; font-weight: 900; color: #0c1e28;">${doc.fee} <span style="font-size: 0.72rem; color: #10b981; font-weight: 800;">(VIP Pass: Free)</span></div>
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <button type="button" onclick="closeCheckupModal()" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 700; padding: 11px 20px; border-radius: 20px; cursor: pointer; font-size: 0.88rem;">
                                Cancel
                            </button>
                            <button type="button" onclick="connectTeleconsultation('${doc.id}')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-weight: 800; padding: 11px 26px; border-radius: 20px; border: none; cursor: pointer; font-size: 0.92rem; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);">
                                <span>🚀 Connect with ${doc.name.split(' ')[0]} ${doc.name.split(' ')[1]}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            backdrop.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        // 2. Connect Teleconsultation (Simulate live connection & Consult Room)
        window.connectTeleconsultation = function(doctorId) {
            const doc = checkupDoctorsData[doctorId] || checkupDoctorsData['doc-farhan-qureshi'];
            const petName = (document.getElementById('tele-pet-name')?.value || 'Your Pet').trim();
            const petType = (document.getElementById('tele-pet-type')?.value || 'Companion').trim();
            const symptoms = (document.getElementById('tele-pet-symptoms')?.value || 'General Health Review').trim();
            const mode = document.querySelector('input[name="checkup-channel"]:checked')?.value || 'video';

            const dynamicContent = document.getElementById('checkup-modal-dynamic-content');
            if (!dynamicContent) return;

            // Save consultation to Firebase Realtime Database
            if (typeof window.saveConsultationToFirebase === 'function') {
                window.saveConsultationToFirebase({
                    id: 'CONSULT-' + Date.now(),
                    doctorId: doc.id,
                    doctorName: doc.name,
                    petName: petName,
                    petType: petType,
                    symptoms: symptoms,
                    channelMode: mode,
                    status: 'active_consultation'
                });
            }

            // Step 1: Connecting Loader Screen
            dynamicContent.innerHTML = `
                <div style="text-align: center; padding: 50px 20px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #fef3c7; border-top-color: #df9c30; animation: spin 1s linear infinite; margin: 0 auto 24px;"></div>
                    <h3 style="font-size: 1.4rem; font-weight: 900; color: #0c1e28; margin: 0 0 8px;">Establishing Secure Telemedicine Channel...</h3>
                    <p style="font-size: 0.9rem; color: #64748b; margin: 0 0 16px;">
                        Connecting securely with <strong>${doc.name}</strong> (${doc.title}) &bull; Room ${doc.room}
                    </p>
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; padding: 6px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 800;">
                        <span>🔒 256-bit Encrypted WebRTC Live Stream</span>
                    </div>
                </div>
            `;

            // Step 2: Open Active Telemedicine Room after 1.2s delay
            setTimeout(() => {
                clearInterval(activeTeleTimer);
                teleSeconds = 0;

                dynamicContent.innerHTML = `
                    <div style="text-align: left;">
                        
                        <!-- Top Session Header -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="display: inline-flex; align-items: center; gap: 6px; background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; font-size: 0.74rem; font-weight: 900; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px;">
                                    <span style="width: 8px; height: 8px; background: #dc2626; border-radius: 50%; display: inline-block; animation: pulse 1.2s infinite;"></span>
                                    LIVE TELEMEDICINE
                                </span>
                                <span style="font-size: 0.8rem; font-weight: 800; color: #334155;">Session #VM-TC-2026</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 800; color: #0c1e28; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 12px; border-radius: 12px;">
                                <span>⏱️ Duration:</span>
                                <span id="tele-timer-display" style="color: #059669;">00:00</span>
                            </div>
                        </div>

                        <!-- Video Stage -->
                        <div class="tele-video-stage">
                            <!-- Overlay Tag -->
                            <div class="tele-call-header-overlay">
                                <span>👨‍⚕️</span>
                                <span>${doc.name} (Direct Feed)</span>
                                <span style="color: #10b981; font-size: 0.7rem; margin-left: 6px;">● 1080p 60fps</span>
                            </div>

                            <!-- Doctor Simulation Feed Graphics -->
                            <div style="text-align: center; color: #ffffff; padding: 20px;">
                                <div style="width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border: 3px solid #df9c30; display: grid; place-content: center; font-size: 3rem; margin: 0 auto 12px; box-shadow: 0 0 30px rgba(223, 162, 67, 0.4);">
                                    ${doc.avatar}
                                </div>
                                <div style="font-size: 1.15rem; font-weight: 900; letter-spacing: -0.3px;">${doc.name}</div>
                                <div style="font-size: 0.78rem; color: #dfa243; font-weight: 700; margin-bottom: 8px;">Active Stethoscope &amp; Video Feed</div>
                                
                                <!-- Audio Wave Animation -->
                                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; height: 18px;">
                                    <span style="width: 4px; height: 8px; background: #10b981; border-radius: 2px; animation: wave 0.8s ease-in-out infinite alternate;"></span>
                                    <span style="width: 4px; height: 16px; background: #10b981; border-radius: 2px; animation: wave 0.6s ease-in-out infinite alternate 0.2s;"></span>
                                    <span style="width: 4px; height: 12px; background: #10b981; border-radius: 2px; animation: wave 0.9s ease-in-out infinite alternate 0.4s;"></span>
                                    <span style="width: 4px; height: 18px; background: #10b981; border-radius: 2px; animation: wave 0.7s ease-in-out infinite alternate 0.1s;"></span>
                                    <span style="width: 4px; height: 10px; background: #10b981; border-radius: 2px; animation: wave 0.5s ease-in-out infinite alternate 0.3s;"></span>
                                </div>
                            </div>

                            <!-- Picture-in-Picture of Client Pet -->
                            <div class="tele-pip-pet-feed">
                                <div style="text-align: center;">
                                    <div style="font-size: 1.4rem;">🐾</div>
                                    <div style="color: #ffffff; font-size: 0.7rem; font-weight: 800;">${petName}</div>
                                    <div style="color: #94a3b8; font-size: 0.62rem;">You (Camera On)</div>
                                </div>
                            </div>
                        </div>

                        <!-- In-Call Media Controls -->
                        <div class="tele-controls-bar">
                            <button type="button" class="tele-control-btn" id="tele-btn-mic" title="Toggle Microphone" onclick="this.classList.toggle('active'); this.innerText = this.innerText === '🎤' ? '🔇' : '🎤';">
                                🎤
                            </button>
                            <button type="button" class="tele-control-btn" id="tele-btn-cam" title="Toggle Camera" onclick="this.classList.toggle('active'); this.innerText = this.innerText === '📹' ? '📷' : '📹';">
                                📹
                            </button>
                            <button type="button" class="tele-control-btn" title="Send Photo of Pet" onclick="alert('Photo uploader simulated: You can upload closeups of symptoms to Dr. ' + '${doc.name}');">
                                📸
                            </button>
                            <button type="button" class="tele-control-btn" title="View Digital Rx" onclick="document.getElementById('tele-rx-box').scrollIntoView({ behavior: 'smooth' });">
                                📜
                            </button>
                            <button type="button" class="tele-control-btn btn-hangup" title="End Consultation" onclick="closeCheckupModal()">
                                📞
                            </button>
                        </div>

                        <!-- Doctor Clinical Greeting & Chat Log -->
                        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px;">
                            <div style="font-size: 0.78rem; font-weight: 800; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
                                <span>Live Doctor Feed &amp; Interactive Chat:</span>
                                <span style="color: #059669; font-size: 0.72rem; font-weight: 800;">🟢 Channel: ${mode.toUpperCase()}</span>
                            </div>
                            <div id="tele-chat-stream">
                                <div style="display: flex; gap: 12px; align-items: flex-start; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;">
                                    <div style="font-size: 1.8rem; line-height: 1;">${doc.avatar}</div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 0.85rem; color: #0c1e28; margin-bottom: 3px;">${doc.name}</div>
                                        <div style="font-size: 0.84rem; color: #334155; line-height: 1.45;">
                                            "${doc.greeting}"
                                        </div>
                                        <div style="font-size: 0.72rem; color: #64748b; margin-top: 6px;">
                                            Patient: <strong>${petName} (${petType})</strong> &bull; Reason: <em>${symptoms}</em>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Interactive Chat Reply Box -->
                            <div style="display: flex; gap: 8px; margin-top: 10px;">
                                <input type="text" id="tele-chat-input" placeholder="Type a message or answer Dr. ${doc.name.split(' ')[0]}..." style="flex: 1; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.85rem; font-family: inherit;">
                                <button type="button" id="tele-chat-send-btn" style="background: var(--gold-gradient); color: #ffffff; font-weight: 800; padding: 9px 16px; border: none; border-radius: 10px; font-size: 0.85rem; cursor: pointer;">
                                    Send 💬
                                </button>
                            </div>
                        </div>

                        <!-- Official Digital E-Prescription Card -->
                        <div class="tele-prescription-card" id="tele-rx-box">
                            <div class="tele-rx-header">
                                <div class="tele-rx-title">
                                    <span>🩺</span>
                                    <span>Official Digital E-Prescription (Rx)</span>
                                </div>
                                <span style="font-size: 0.72rem; font-weight: 800; background: #ffffff; color: #b45309; padding: 2px 8px; border-radius: 10px; border: 1px solid #fde68a;">
                                    PVMC Validated &bull; EST. 2026
                                </span>
                            </div>

                            <div style="font-size: 0.78rem; color: #92400e; margin-bottom: 8px; font-weight: 700;">
                                Diagnosis: <strong>${doc.sampleRx.diagnosis}</strong>
                            </div>

                            <div class="tele-rx-items">
                                <ul style="margin: 0; padding-left: 20px; font-weight: 600;">
                                    ${doc.sampleRx.meds.map(m => `<li style="margin-bottom: 4px;">${m}</li>`).join('')}
                                </ul>
                            </div>

                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; pt: 10px; border-top: 1px dashed #fed7aa; flex-wrap: wrap;">
                                <div style="font-size: 0.72rem; color: #78350f;">
                                    Issued by: <strong>${doc.name}</strong> (${doc.license}) &bull; Emergency 24/7: <strong>0326-4223100</strong>
                                </div>
                                <button type="button" onclick="alert('Official E-Prescription for ' + '${petName}' + ' downloaded successfully as PDF!');" style="background: #ffffff; border: 1.5px solid #dfa243; color: #92400e; font-weight: 800; padding: 6px 14px; border-radius: 12px; font-size: 0.78rem; cursor: pointer;">
                                    📥 Download PDF Rx
                                </button>
                            </div>
                        </div>

                    </div>
                `;

                // Handle sending messages to doctor
                const chatInput = document.getElementById('tele-chat-input');
                const chatSendBtn = document.getElementById('tele-chat-send-btn');
                const chatStream = document.getElementById('tele-chat-stream');

                function handleSend() {
                    const text = (chatInput?.value || '').trim();
                    if (!text || !chatStream) return;
                    
                    // Add user message
                    const userMsg = document.createElement('div');
                    userMsg.style.textAlign = 'right';
                    userMsg.style.margin = '6px 0';
                    userMsg.innerHTML = `<div style="display: inline-block; background: #df9c30; color: #ffffff; padding: 7px 12px; border-radius: 12px 12px 2px 12px; font-size: 0.82rem; font-weight: 700;">${text}</div>`;
                    chatStream.appendChild(userMsg);
                    chatInput.value = '';

                    // Simulated doctor instant response
                    setTimeout(() => {
                        const docReply = document.createElement('div');
                        docReply.style.textAlign = 'left';
                        docReply.style.margin = '6px 0';
                        docReply.innerHTML = `<div style="display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; color: #0c1e28; padding: 7px 12px; border-radius: 12px 12px 12px 2px; font-size: 0.82rem; font-weight: 600;">👨‍⚕️ <strong>${doc.name}:</strong> Understood. I've noted that down for ${petName}. Follow the prescribed dosage below carefully.</div>`;
                        chatStream.appendChild(docReply);
                    }, 650);
                }

                if (chatSendBtn) chatSendBtn.addEventListener('click', handleSend);
                if (chatInput) {
                    chatInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') handleSend();
                    });
                }

                // Start call timer
                activeTeleTimer = setInterval(() => {
                    teleSeconds++;
                    const mins = String(Math.floor(teleSeconds / 60)).padStart(2, '0');
                    const secs = String(teleSeconds % 60).padStart(2, '0');
                    const timerEl = document.getElementById('tele-timer-display');
                    if (timerEl) {
                        timerEl.innerText = `${mins}:${secs}`;
                    }
                }, 1000);

            }, 1200);
        };

        // 3. Close Checkup Modal
        window.closeCheckupModal = function() {
            if (activeTeleTimer) {
                clearInterval(activeTeleTimer);
                activeTeleTimer = null;
            }
            const backdrop = document.getElementById('checkup-modal-backdrop');
            if (backdrop) {
                backdrop.classList.remove('open');
            }
            document.body.style.overflow = '';
        };

        // 4. Bind Search & Filter Listeners on checkup.html
        const searchInput = document.getElementById('checkup-search-input');
        const filterChips = document.querySelectorAll('.checkup-filter-chip');
        const doctorCards = document.querySelectorAll('.checkup-doctor-card');
        const checkupBackdrop = document.getElementById('checkup-modal-backdrop');

        if (doctorCards && doctorCards.length > 0) {
            let activeFilter = 'all';
            let searchQuery = '';

            function applyDoctorFiltering() {
                const q = searchQuery.toLowerCase().trim();
                let visibleCount = 0;

                doctorCards.forEach(card => {
                    const specialty = (card.getAttribute('data-specialty') || '').toLowerCase();
                    const cardText = card.textContent.toLowerCase();

                    // 1. Filter match
                    let matchesFilter = (activeFilter === 'all') || specialty.includes(activeFilter.toLowerCase());

                    // 2. Search match
                    let matchesSearch = !q || cardText.includes(q);

                    if (matchesFilter && matchesSearch) {
                        card.style.display = 'flex';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                let noResultsEl = document.getElementById('checkup-no-results-box');
                const grid = document.getElementById('checkup-doctors-grid');
                if (visibleCount === 0) {
                    if (!noResultsEl && grid) {
                        noResultsEl = document.createElement('div');
                        noResultsEl.id = 'checkup-no-results-box';
                        noResultsEl.className = 'checkup-no-results';
                        noResultsEl.innerHTML = `
                            <div class="checkup-no-results-icon">🩺</div>
                            <div class="checkup-no-results-title">No Doctors Found Matching Your Search</div>
                            <div class="checkup-no-results-sub">Try searching with a different specialty keyword or clear your filters to view all available specialists.</div>
                            <button type="button" onclick="window.resetCheckupFilters()" style="background:var(--gold-gradient); color:#fff; border:none; padding:10px 22px; border-radius:20px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(223,162,67,0.35);">Show All Specialists (6)</button>
                        `;
                        grid.appendChild(noResultsEl);
                    } else if (noResultsEl) {
                        noResultsEl.style.display = 'block';
                    }
                } else if (noResultsEl) {
                    noResultsEl.style.display = 'none';
                }
            }

            window.resetCheckupFilters = function() {
                if (searchInput) searchInput.value = '';
                searchQuery = '';
                activeFilter = 'all';
                filterChips.forEach(c => {
                    if (c.getAttribute('data-filter') === 'all') c.classList.add('active');
                    else c.classList.remove('active');
                });
                applyDoctorFiltering();
            };

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    applyDoctorFiltering();
                });
            }

            filterChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    filterChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    activeFilter = chip.getAttribute('data-filter') || 'all';
                    applyDoctorFiltering();
                });
            });
        }

        // Close on backdrop click or ESC
        if (checkupBackdrop) {
            checkupBackdrop.addEventListener('click', (e) => {
                if (e.target === checkupBackdrop) {
                    window.closeCheckupModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeCheckupModal();
            }
        });
    }

    function initUniversalSearchClearButtons() {
        const clearBtns = document.querySelectorAll('.search-clear-btn');
        clearBtns.forEach(btn => {
            const parent = btn.parentElement;
            if (!parent) return;
            const input = parent.querySelector('input[type="text"]');
            if (!input) return;

            function updateBtnState() {
                if (input.value.trim().length > 0) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
            }

            input.addEventListener('input', updateBtnState);
            input.addEventListener('change', updateBtnState);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                input.value = '';
                btn.classList.remove('visible');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
            });

            updateBtnState();
        });
    }

    initUniversalSearchClearButtons();
    initOnlineCheckupPortal();

    // Deep-link / Automated Test Triggers (?trigger=search | ?trigger=cart | ?trigger=auth)
    const urlParams = new URLSearchParams(window.location.search);
    const triggerParam = urlParams.get('trigger');
    if (triggerParam === 'search') {
        setTimeout(() => { if (window.openSearchModal) window.openSearchModal(); }, 350);
    } else if (triggerParam === 'cart') {
        setTimeout(() => {
            if (window.addToCart) window.addToCart('vm-persian', 0);
            else if (window.openCartDrawer) window.openCartDrawer();
        }, 350);
    } else if (triggerParam === 'auth') {
        setTimeout(() => { if (window.openAuthModal) window.openAuthModal(); }, 350);
    }
}
