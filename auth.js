// ============================================
// STOLIY - AUTHENTICATION SYSTEM
// ============================================

class AuthSystem {
    constructor() {
        this.currentUser = null;
    }

    // Check if user is logged in
    checkAuthState() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        
                        // Check if email is verified
                        if (!user.emailVerified) {
                            window.location.href = 'login.html?verify=1';
                            resolve(false);
                            return;
                        }
                        
                        // Store user data in session
                        sessionStorage.setItem('userData', JSON.stringify(userData));
                        
                        // Check if onboarding completed
                        if (!userData.onboardingCompleted) {
                            window.location.href = 'wizard.html';
                        } else {
                            window.location.href = 'home.html';
                        }
                        resolve(true);
                    } else {
                        // Create user document if doesn't exist
                        await this.createUserDocument(user);
                        window.location.href = 'wizard.html';
                        resolve(true);
                    }
                } else {
                    // Not logged in, redirect to login
                    if (!window.location.href.includes('login.html') && 
                        !window.location.href.includes('register.html') &&
                        !window.location.href.includes('about.html') &&
                        !window.location.href.includes('terms.html') &&
                        !window.location.href.includes('contact.html') &&
                        !window.location.href.includes('refund.html')) {
                        window.location.href = 'login.html';
                    }
                    resolve(false);
                }
            });
        });
    }

    // Create user document
    async createUserDocument(user) {
        const userId = 'USR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        await db.collection('users').doc(user.uid).set({
            userId: userId,
            email: user.email,
            name: user.displayName || '',
            photoURL: user.photoURL || '',
            phone: '',
            country: '',
            currency: 'USD',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            onboardingCompleted: false,
            emailVerified: user.emailVerified,
            isSeller: false,
            walletConnected: false,
            following: []
        });
        
        sessionStorage.setItem('userId', userId);
    }

    // Check username availability
    async checkUsername(username) {
        if (username.length < 3) {
            return { available: false, message: 'Username must be at least 3 characters' };
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { available: false, message: 'Only letters, numbers and underscore allowed' };
        }
        
        const snapshot = await db.collection('users')
            .where('username', '==', username.toLowerCase())
            .get();
        
        return { 
            available: snapshot.empty, 
            message: snapshot.empty ? 'Username available! ✅' : 'Username already taken ❌' 
        };
    }

    // Check password strength
    checkPasswordStrength(password) {
        let strength = 0;
        let feedback = [];
        
        if (password.length >= 8) strength++;
        else feedback.push('At least 8 characters');
        
        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('One uppercase letter');
        
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('One lowercase letter');
        
        if (/[0-9]/.test(password)) strength++;
        else feedback.push('One number');
        
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else feedback.push('One special character');
        
        const levels = ['Poor', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['#E17055', '#FDCB6E', '#00B894', '#0984E3', '#6C5CE7'];
        
        return {
            strength: strength,
            level: levels[strength - 1] || 'Poor',
            color: colors[strength - 1] || colors[0],
            feedback: feedback,
            isValid: strength >= 3
        };
    }

    // Register new user
    async register(email, password, username, country, currency, phone) {
        try {
            // Check username
            const usernameCheck = await this.checkUsername(username);
            if (!usernameCheck.available) {
                throw new Error(usernameCheck.message);
            }
            
            // Create auth user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update profile
            await user.updateProfile({
                displayName: username
            });
            
            // Create user document
            const userId = 'USR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
            
            await db.collection('users').doc(user.uid).set({
                userId: userId,
                username: username.toLowerCase(),
                email: email,
                name: username,
                phone: phone,
                country: country,
                currency: currency,
                photoURL: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                onboardingCompleted: false,
                emailVerified: false,
                isSeller: false,
                walletConnected: false,
                walletId: null,
                dropshipId: null,
                following: [],
                notifications: true,
                language: 'en'
            });
            
            // Send verification email
            await user.sendEmailVerification();
            
            sessionStorage.setItem('userId', userId);
            
            return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                await auth.signOut();
                return { 
                    success: false, 
                    needVerification: true,
                    message: 'Please verify your email first. Check your inbox.' 
                };
            }
            
            // Get user data
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            sessionStorage.setItem('userData', JSON.stringify(userData));
            sessionStorage.setItem('userId', userData.userId);
            
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { 
                success: true, 
                onboardingCompleted: userData.onboardingCompleted,
                message: 'Login successful!' 
            };
        } catch (error) {
            console.error('Login error:', error);
            let message = 'Login failed';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect password';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    message = 'This account has been disabled';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many attempts. Please try again later.';
                    break;
            }
            
            return { success: false, message: message };
        }
    }

    // Google login
    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user document exists
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                await this.createUserDocument(user);
            }
            
            const userData = userDoc.exists ? userDoc.data() : {};
            sessionStorage.setItem('userData', JSON.stringify(userData));
            
            return { 
                success: true, 
                onboardingCompleted: userData.onboardingCompleted || false,
                message: 'Login successful!' 
            };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, message: 'Google login failed' };
        }
    }

    // Resend verification email
    async resendVerification() {
        try {
            const user = auth.currentUser;
            if (user && !user.emailVerified) {
                await user.sendEmailVerification();
                return { success: true, message: 'Verification email sent! Check your inbox.' };
            }
            return { success: false, message: 'No user found or already verified.' };
        } catch (error) {
            return { success: false, message: 'Failed to send verification email.' };
        }
    }

    // Check email verification status
    async checkEmailVerification() {
        const user = auth.currentUser;
        if (user) {
            await user.reload();
            return user.emailVerified;
        }
        return false;
    }

    // Logout
    async logout() {
        try {
            await auth.signOut();
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Send password reset
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset link sent to your email.' };
        } catch (error) {
            return { success: false, message: 'Failed to send reset link.' };
        }
    }
}

// Initialize auth system
const authSystem = new AuthSystem();