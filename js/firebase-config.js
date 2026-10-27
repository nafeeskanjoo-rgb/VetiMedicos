/**
 * ==============================================================================
 * VetiMedicos - Firebase Configuration & Authentication Service
 * Supports: Client (Pet Parent) & Veti Doctor Dual Role Auth
 * ==============================================================================
 */

// 1. Live Firebase Credentials:
const firebaseConfig = {
    apiKey: "AIzaSyAPyS8fz1KeiShKZu3MDhu3jaNIohNPhko",
    authDomain: "veticareorg.firebaseapp.com",
    databaseURL: "https://veticareorg-default-rtdb.firebaseio.com",
    projectId: "veticareorg",
    storageBucket: "veticareorg.firebasestorage.app",
    messagingSenderId: "1081993307648",
    appId: "1:1081993307648:web:a99a69cf72b4895abfdae5",
    measurementId: "G-QRMNGK9R79"
};

// Check if credentials have been replaced or still demo placeholder
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey && 
           firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
           !firebaseConfig.apiKey.includes("YOUR_");
};

// Initialize Firebase if configured
let auth = null;
let googleProvider = null;
let database = null;
let analytics = null;

if (typeof firebase !== 'undefined') {
    if (isFirebaseConfigured()) {
        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            googleProvider = new firebase.auth.GoogleAuthProvider();
            database = firebase.database();
            if (typeof firebase.analytics === 'function' && firebaseConfig.measurementId) {
                try {
                    analytics = firebase.analytics();
                } catch (e) {
                    console.warn("Analytics note:", e);
                }
            }
            window.firebaseAuth = auth;
            window.firebaseDatabase = database;
            window.firebaseAnalytics = analytics;
            console.log("✅ VetiMedicos: Live Firebase Auth & Realtime Database connected successfully (veticareorg)!");
        } catch (error) {
            console.error("❌ Firebase Initialization Error:", error);
        }
    } else {
        console.warn("⚠️ VetiMedicos: Running in Demo / Simulation Mode. Real Firebase credentials not set yet.");
    }
}

/**
 * Save / update user record in Realtime Database at /users/{uid}
 */
async function saveUserToDatabase(user, provider = 'email', role = 'client', extraData = {}) {
    if (!database || !user) return;
    try {
        const userRef = database.ref('users/' + user.uid);
        const updatePayload = {
            uid:         user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email:       user.email,
            photoURL:    user.photoURL || null,
            provider:    provider,
            role:        role || 'client',
            lastLogin:   new Date().toISOString()
        };
        if (role === 'doctor') {
            updatePayload.license = extraData.license || 'VET-LIC-VERIFIED';
            updatePayload.specialty = extraData.specialty || 'General Veterinary Medicine';
        }
        await userRef.update(updatePayload);
        
        // Set createdAt only on first registration
        const snap = await userRef.child('createdAt').get();
        if (!snap.exists()) {
            await userRef.update({ createdAt: new Date().toISOString() });
        }
        console.log('✅ User saved to DB with role:', role, user.uid);
    } catch (err) {
        console.error('❌ DB save failed:', err);
    }
}

/**
 * Authentication Wrapper with Role Support (Client vs Doctor)
 */
window.VetiAuth = {
    isLive: () => isFirebaseConfigured() && auth !== null,

    // Sign in with Email and Password
    signIn: async (email, password, rememberMe = true, role = 'client', license = '', extraData = {}) => {
        if (window.VetiAuth.isLive()) {
            const persistence = rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            await auth.setPersistence(persistence);
            const result = await auth.signInWithEmailAndPassword(email, password);
            
            // Fetch existing role or update
            let savedRole = role;
            if (database) {
                const snap = await database.ref('users/' + result.user.uid + '/role').get();
                if (snap.exists()) {
                    savedRole = snap.val();
                } else {
                    await saveUserToDatabase(result.user, 'email', role, { license, ...extraData });
                }
            }
            result.userRole = savedRole;
            return result;
        } else {
            // Simulated response for Demo Mode
            await new Promise(resolve => setTimeout(resolve, 800));
            if (!email.includes('@') || password.length < 6) {
                throw new Error("Invalid email or password length must be at least 6 characters.");
            }
            const cleanName = (extraData && extraData.doctorName) ? extraData.doctorName.trim() : email.split('@')[0];
            const isDoctor = role === 'doctor';
            let formattedName = cleanName;
            if (isDoctor && !formattedName.toLowerCase().startsWith('dr.')) {
                formattedName = `Dr. ${formattedName.charAt(0).toUpperCase() + formattedName.slice(1)}`;
            }
            return {
                user: {
                    email: email,
                    displayName: formattedName,
                    uid: "demo-user-" + Math.floor(Math.random() * 10000)
                },
                userRole: role,
                license: license || (isDoctor ? "VET-PK-2026-DEMO" : ""),
                isDemo: true
            };
        }
    },

    // Sign up with Email and Password
    signUp: async (name, email, password, role = 'client', extraData = {}) => {
        const isDoctor = role === 'doctor';
        let formattedName = name;
        if (isDoctor && !formattedName.toLowerCase().startsWith('dr.')) {
            formattedName = `Dr. ${formattedName}`;
        }

        if (window.VetiAuth.isLive()) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            if (formattedName && userCredential.user) {
                await userCredential.user.updateProfile({ displayName: formattedName });
                await userCredential.user.reload();
            }
            await saveUserToDatabase(userCredential.user, 'email', role, extraData);
            userCredential.userRole = role;
            return userCredential;
        } else {
            await new Promise(resolve => setTimeout(resolve, 900));
            if (!email.includes('@') || password.length < 6) {
                throw new Error("Password must be at least 6 characters and email must be valid.");
            }
            return {
                user: {
                    displayName: formattedName || (isDoctor ? "Dr. Pet Care" : "Pet Parent"),
                    email: email,
                    uid: "demo-user-" + Math.floor(Math.random() * 10000)
                },
                userRole: role,
                license: extraData.license || (isDoctor ? "VET-REG-2026" : ""),
                specialty: extraData.specialty || "Veterinary Medicine",
                isDemo: true
            };
        }
    },

    // Reset Password Email
    resetPassword: async (email) => {
        if (window.VetiAuth.isLive()) {
            return await auth.sendPasswordResetEmail(email);
        } else {
            await new Promise(resolve => setTimeout(resolve, 600));
            if (!email.includes('@')) {
                throw new Error("Please enter a valid email address.");
            }
            return { message: "Reset email dispatched in Demo Mode.", isDemo: true };
        }
    },

    // Google Sign In
    signInWithGoogle: async (role = 'client') => {
        const isDoctor = role === 'doctor';
        if (window.VetiAuth.isLive()) {
            const result = await auth.signInWithPopup(googleProvider);
            let savedRole = role;
            if (database) {
                const snap = await database.ref('users/' + result.user.uid + '/role').get();
                if (snap.exists()) {
                    savedRole = snap.val();
                } else {
                    await saveUserToDatabase(result.user, 'google', role);
                }
            }
            result.userRole = savedRole;
            return result;
        } else {
            await new Promise(resolve => setTimeout(resolve, 800));
            return {
                user: {
                    displayName: isDoctor ? "Dr. Alex Morgan (Google)" : "Alex Morgan (Google)",
                    email: "petcare@google-demo.com",
                    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
                    uid: "google-demo-12345"
                },
                userRole: role,
                isDemo: true
            };
        }
    },

    // Listen to Auth State Changes
    onAuthStateChanged: (callback) => {
        if (window.VetiAuth.isLive()) {
            auth.onAuthStateChanged(async (user) => {
                if (user && database) {
                    try {
                        const snap = await database.ref('users/' + user.uid + '/role').get();
                        user.userRole = snap.exists() ? snap.val() : 'client';
                    } catch (e) {
                        user.userRole = 'client';
                    }
                }
                callback(user);
            });
        }
    },

    // Sign out
    signOut: async () => {
        if (window.VetiAuth.isLive()) {
            return await auth.signOut();
        }
        return true;
    }
};

// Realtime Database Order Saver (with Auth Fallback & Local Backup)
window.saveOrderToFirebase = async function(orderData) {
    const payload = {
        ...orderData,
        createdAt: new Date().toISOString()
    };

    // Always backup to localStorage first
    try {
        const localOrders = JSON.parse(localStorage.getItem('vetimedicos_offline_orders') || '[]');
        localOrders.unshift(payload);
        localStorage.setItem('vetimedicos_offline_orders', JSON.stringify(localOrders.slice(0, 50)));
    } catch (e) {}

    if (!database) {
        console.warn("⚠️ Firebase Realtime Database not initialized, order kept in local storage.");
        return false;
    }

    try {
        // If auth is required by Firebase rules and no user is logged in, attempt anonymous auth
        if (auth && !auth.currentUser) {
            try {
                await auth.signInAnonymously();
            } catch (anonErr) {}
        }

        const orderRef = database.ref('orders/' + orderData.orderId);
        await orderRef.set(payload);
        console.log("✅ Order saved to Realtime Database:", orderData.orderId);
        return true;
    } catch (e) {
        console.error("❌ Failed to save order to Firebase:", e);
        return false;
    }
};

// Realtime Database Consultation / Checkup Saver
window.saveConsultationToFirebase = async function(consultData) {
    const payload = {
        ...consultData,
        createdAt: new Date().toISOString()
    };

    // Backup to localStorage
    try {
        const localConsults = JSON.parse(localStorage.getItem('vetimedicos_offline_consultations') || '[]');
        localConsults.unshift(payload);
        localStorage.setItem('vetimedicos_offline_consultations', JSON.stringify(localConsults.slice(0, 50)));
    } catch (e) {}

    if (!database) return false;

    try {
        if (auth && !auth.currentUser) {
            try {
                await auth.signInAnonymously();
            } catch (anonErr) {}
        }

        const consultRef = database.ref('consultations/' + consultData.id);
        await consultRef.set(payload);
        console.log("✅ Consultation saved to Realtime Database:", consultData.id);
        return true;
    } catch (e) {
        console.error("❌ Failed to save consultation to Firebase:", e);
        return false;
    }
};
