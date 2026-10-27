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

            // Run automatic organization of existing users into /clients and /doctors nodes
            setTimeout(() => {
                syncExistingUsersIntoSeparateNodes();
            }, 600);
        } catch (error) {
            console.error("❌ Firebase Initialization Error:", error);
        }
    } else {
        console.warn("⚠️ VetiMedicos: Running in Demo / Simulation Mode. Real Firebase credentials not set yet.");
    }
}

/**
 * ==============================================================================
 * SEPARATE DATABASE NODES & TAGS SYSTEM (Clients vs Doctors)
 * ==============================================================================
 * 📁 /clients/{uid}  -> All Pet Parents with 'accountTag: 🐾 Client / Pet Parent'
 * 📁 /doctors/{uid}  -> All Clinicians with 'accountTag: 🩺 Verified Veti Doctor'
 * 📁 /users/{uid}    -> Unified quick index with nodePath and accountTag
 */
async function saveUserToDatabase(user, provider = 'email', role = 'client', extraData = {}) {
    if (!database || !user) return;
    try {
        const isDoctor = (role === 'doctor');
        const now = new Date().toISOString();
        const baseName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');

        if (isDoctor) {
            // 🩺 1. DEDICATED DOCTORS NODE: /doctors/{uid}
            const doctorRef = database.ref('doctors/' + user.uid);
            const doctorPayload = {
                uid:          user.uid,
                displayName:  baseName.startsWith('Dr.') ? baseName : `Dr. ${baseName}`,
                email:        user.email || '',
                photoURL:     user.photoURL || null,
                provider:     provider,
                role:         'doctor',
                accountTag:   '🩺 Verified Veti Doctor',
                badge:        'Veterinary Specialist',
                license:      extraData.license || 'PVMC-PK-2026',
                specialty:    extraData.specialty || 'General Veterinary Medicine & Surgery',
                hospitalOpd:  extraData.hospitalOpd || 'Main Sanctuary OPD & Emergency ICU',
                status:       'On Duty / Verified',
                isVerified:   true,
                lastLogin:    now
            };
            await doctorRef.update(doctorPayload);
            const snapDoc = await doctorRef.child('createdAt').get();
            if (!snapDoc.exists()) {
                await doctorRef.update({ createdAt: now });
            }
            console.log('✅ [Firebase] Doctor record saved to /doctors/' + user.uid);
        } else {
            // 🐾 2. DEDICATED CLIENTS NODE: /clients/{uid}
            const clientRef = database.ref('clients/' + user.uid);
            const clientPayload = {
                uid:          user.uid,
                displayName:  baseName,
                email:        user.email || '',
                photoURL:     user.photoURL || null,
                provider:     provider,
                role:         'client',
                accountTag:   '🐾 Client / Pet Parent',
                badge:        'VIP Member',
                phone:        extraData.phone || '',
                petName:      extraData.petName || 'Family Pet',
                petType:      extraData.petType || 'Dog / Cat',
                status:       'Active VIP Client',
                lastLogin:    now
            };
            await clientRef.update(clientPayload);
            const snapCli = await clientRef.child('createdAt').get();
            if (!snapCli.exists()) {
                await clientRef.update({ createdAt: now });
            }
            console.log('✅ [Firebase] Client record saved to /clients/' + user.uid);
        }

        // 3. UNIFIED LOOKUP INDEX: /users/{uid}
        const userRef = database.ref('users/' + user.uid);
        const indexPayload = {
            uid:         user.uid,
            displayName: baseName,
            email:       user.email,
            role:        isDoctor ? 'doctor' : 'client',
            accountTag:  isDoctor ? '🩺 Verified Veti Doctor' : '🐾 Client / Pet Parent',
            nodePath:    isDoctor ? `doctors/${user.uid}` : `clients/${user.uid}`,
            lastLogin:   now
        };
        await userRef.update(indexPayload);
        const snapUser = await userRef.child('createdAt').get();
        if (!snapUser.exists()) {
            await userRef.update({ createdAt: now });
        }
    } catch (err) {
        console.error('❌ DB save failed:', err);
    }
}

/**
 * Auto-Sync: Scans existing users under '/users' and organizes them into
 * separate '/clients' and '/doctors' nodes with clear tags in Firebase.
 */
async function syncExistingUsersIntoSeparateNodes() {
    if (!database) return;
    try {
        const usersSnap = await database.ref('users').get();
        if (!usersSnap.exists()) return;
        const usersData = usersSnap.val();
        const now = new Date().toISOString();

        for (const [uid, userItem] of Object.entries(usersData)) {
            if (!userItem) continue;
            const isDoctor = (userItem.role === 'doctor');
            const targetNode = isDoctor ? 'doctors' : 'clients';
            const targetRef = database.ref(`${targetNode}/${uid}`);
            const existingSnap = await targetRef.get();

            if (!existingSnap.exists()) {
                const displayName = userItem.displayName || (userItem.email ? userItem.email.split('@')[0] : 'User');
                const createdTime = userItem.createdAt || now;

                if (isDoctor) {
                    await targetRef.set({
                        uid:         uid,
                        displayName: displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`,
                        email:       userItem.email || '',
                        role:        'doctor',
                        accountTag:  '🩺 Verified Veti Doctor',
                        badge:       'Veterinary Specialist',
                        license:     userItem.license || 'PVMC-PK-VERIFIED',
                        specialty:   userItem.specialty || 'General Veterinary Medicine',
                        status:      'On Duty / Verified',
                        isVerified:  true,
                        createdAt:   createdTime,
                        lastLogin:   userItem.lastLogin || now
                    });
                } else {
                    await targetRef.set({
                        uid:         uid,
                        displayName: displayName,
                        email:       userItem.email || '',
                        role:        'client',
                        accountTag:  '🐾 Client / Pet Parent',
                        badge:       'VIP Member',
                        status:      'Active VIP Client',
                        createdAt:   createdTime,
                        lastLogin:   userItem.lastLogin || now
                    });
                }

                // Update /users/{uid} index tag & nodePath
                await database.ref(`users/${uid}`).update({
                    accountTag: isDoctor ? '🩺 Verified Veti Doctor' : '🐾 Client / Pet Parent',
                    nodePath:   `${targetNode}/${uid}`
                });
                console.log(`🔄 [Auto-Sync] Categorized user ${uid} into /${targetNode} node.`);
            }
        }
    } catch (err) {
        console.warn('Auto-sync note:', err);
    }
}

/**
 * Authentication Wrapper with Role Support (Client vs Doctor)
 */
window.VetiAuth = {
    isLive: () => isFirebaseConfigured() && auth !== null,

    // Sign in with Email and Password (with Seamless Auto-Registration Fallback)
    signIn: async (email, password, rememberMe = true, role = 'client', license = '', extraData = {}) => {
        if (window.VetiAuth.isLive()) {
            const persistence = rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            await auth.setPersistence(persistence);

            let result = null;
            let isNewAccount = false;

            try {
                result = await auth.signInWithEmailAndPassword(email, password);
            } catch (authErr) {
                const code = authErr.code || '';
                // If user doesn't exist yet, seamlessly create account with the entered credentials
                if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
                    try {
                        result = await auth.createUserWithEmailAndPassword(email, password);
                        isNewAccount = true;
                        
                        const isDoctor = (role === 'doctor');
                        const displayName = (extraData && extraData.doctorName) 
                            ? extraData.doctorName.trim() 
                            : (extraData && extraData.displayName 
                                ? extraData.displayName.trim() 
                                : email.split('@')[0]);
                        let formattedName = displayName;
                        if (isDoctor && !formattedName.toLowerCase().startsWith('dr.')) {
                            formattedName = `Dr. ${formattedName.charAt(0).toUpperCase() + formattedName.slice(1)}`;
                        }
                        if (result && result.user) {
                            await result.user.updateProfile({ displayName: formattedName });
                        }
                        await saveUserToDatabase(result.user, 'email', role, { license, ...extraData });
                    } catch (createErr) {
                        const createCode = createErr.code || '';
                        if (createCode === 'auth/email-already-in-use') {
                            throw new Error('Ghalat password enter kiya hai. Agar aapka account pehle se register hai to apna sahi password enter karen.');
                        }
                        if (createCode === 'auth/weak-password') {
                            throw new Error('Password kam az kam 6 characters ka hona zaroori hai.');
                        }
                        if (createCode === 'auth/invalid-email') {
                            throw new Error('Email address durust format mein enter karen.');
                        }
                        throw createErr;
                    }
                } else if (code === 'auth/wrong-password') {
                    throw new Error('Ghalat password enter kiya hai. Barah-e-karam apna durust password enter karen.');
                } else if (code === 'auth/weak-password') {
                    throw new Error('Password kam az kam 6 characters ka hona zaroori hai.');
                } else if (code === 'auth/invalid-email') {
                    throw new Error('Email address durust format mein enter karen.');
                } else if (code === 'auth/network-request-failed') {
                    throw new Error('Internet ya Firebase server connection timeout ho gaya hai. Dobara koshish karen.');
                } else {
                    throw authErr;
                }
            }
            
            // Fetch existing role or update
            let savedRole = role;
            if (database && !isNewAccount) {
                try {
                    const snap = await database.ref('users/' + result.user.uid + '/role').get();
                    if (snap.exists()) {
                        savedRole = snap.val();
                    } else {
                        await saveUserToDatabase(result.user, 'email', role, { license, ...extraData });
                    }
                } catch (dbErr) {
                    console.warn('DB check note:', dbErr);
                }
            }
            result.userRole = savedRole;
            result.isNewAccount = isNewAccount;
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
