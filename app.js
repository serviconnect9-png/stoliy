// ============================================
// STOLIY - MAIN APPLICATION
// ============================================

class App {
    constructor() {
        this.currentPage = 'home';
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        // Show splash screen for 2.5 seconds
        setTimeout(async () => {
            document.getElementById('splashScreen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            
            // Check internet connection
            if (!utils.isOnline()) {
                utils.showToast('No internet connection. Some features may not work.', 'warning', 5000);
            }
            
            // Initialize exchange rates
            await utils.fetchExchangeRates();
            
            // Detect user country
            const countryData = await utils.detectCountry();
            utils.userCurrency = localStorage.getItem('preferredCurrency') || countryData.currency || 'USD';
            
            // Check authentication state
            this.checkAuthState();
            
            // Initialize navigation
            this.initNavigation();
            
            // Load home page by default
            this.navigateTo('home');
        }, 2500);
    }

    checkAuthState() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                
                // Check if email is verified
                if (!user.emailVerified) {
                    utils.showToast('Please verify your email address', 'warning', 5000);
                }
                
                // Load user data from Firestore
                await this.loadUserData(user.uid);
                
                // Update cart badge
                await products.updateCartBadge();
                
                // Hide auth modal if shown
                document.getElementById('authModal').style.display = 'none';
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                
                // Show auth modal for protected pages
                if (['profile', 'orders', 'cart'].includes(this.currentPage)) {
                    this.showAuthModal();
                }
            }
        });
    }

    async loadUserData(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                // Create user document if it doesn't exist
                const userData = {
                    userId: utils.generateId('USR'),
                    email: this.currentUser.email,
                    name: this.currentUser.displayName || '',
                    photoURL: this.currentUser.photoURL || '',
                    phone: this.currentUser.phoneNumber || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    preferredCurrency: localStorage.getItem('preferredCurrency') || 'USD',
                    isSeller: false,
                    following: [],
                    walletConnected: false
                };
                
                await db.collection('users').doc(userId).set(userData);
            } else {
                // Update last login
                await db.collection('users').doc(userId).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Load user data error:', error);
        }
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });

        // Handle browser back button
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });
    }

    navigateTo(page, addToHistory = true) {
        // Check authentication for protected pages
        if (['orders', 'profile'].includes(page) && !this.isAuthenticated) {
            this.showAuthModal();
            return;
        }

        this.currentPage = page;

        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Add to browser history
        if (addToHistory) {
            window.history.pushState({ page }, '', `#${page}`);
        }

        // Load page content
        this.loadPage(page);
    }

    async loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        
        switch (page) {
            case 'home':
                await home.renderHome();
                break;
            case 'search':
                this.renderSearch();
                break;
            case 'cart':
                await products.renderCart();
                break;
            case 'orders':
                await this.renderOrders();
                break;
            case 'profile':
                await profile.renderProfile();
                break;
            default:
                await home.renderHome();
        }

        // Scroll to top
        mainContent.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    renderSearch() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="search-page">
                <div class="search-bar" style="padding: 16px;">
                    <div class="search-input">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchQuery" placeholder="Search products, stores, categories..." onkeyup="app.performSearch()">
                    </div>
                </div>
                
                <!-- Filters -->
                <div style="padding: 0 16px; display: flex; gap: 8px; overflow-x: auto; margin-bottom: 16px;">
                    <select id="filterCategory" onchange="app.performSearch()" style="padding: 8px 12px; border: 2px solid #DFE6E9; border-radius: 8px; background: white;">
                        <option value="">All Categories</option>
                        ${CONFIG.categories.filter(c => c.name !== 'All').map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                    </select>
                    <select id="filterSort" onchange="app.performSearch()" style="padding: 8px 12px; border: 2px solid #DFE6E9; border-radius: 8px; background: white;">
                        <option value="popular">Most Popular</option>
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                    </select>
                </div>
                
                <!-- Search Results -->
                <div id="searchResults" style="padding: 0 16px;">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>Search STOLIY</h3>
                        <p>Find products, stores, and more</p>
                    </div>
                </div>
            </div>
        `;
    }

    async performSearch() {
        const query = document.getElementById('searchQuery')?.value || '';
        const category = document.getElementById('filterCategory')?.value || '';
        const sortBy = document.getElementById('filterSort')?.value || 'popular';
        
        const resultsContainer = document.getElementById('searchResults');
        
        if (!query && !category) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Search STOLIY</h3>
                    <p>Find products, stores, and more</p>
                </div>
            `;
            return;
        }

        utils.showLoading(resultsContainer);

        try {
            // Search both products and stores
            const [products_results, stores_results] = await Promise.all([
                products.searchProducts(query, { category, sortBy }),
                storeManager.searchStores(query, { sortBy: sortBy === 'rating' ? 'rating' : undefined })
            ]);

            let resultsHTML = '';

            // Show stores section
            if (stores_results.length > 0) {
                resultsHTML += `
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-weight: 700; margin-bottom: 12px;">
                            <i class="fas fa-store"></i> Stores (${stores_results.length})
                        </h3>
                        <div class="stores-scroll" style="padding: 0;">
                            ${stores_results.map(store => `
                                <div class="store-card" onclick="storeManager.renderStorePage('${store.id}')">
                                    <img src="${store.logo || 'https://via.placeholder.com/60'}" alt="${store.name}" class="store-logo">
                                    <div class="store-name">${store.name}</div>
                                    <div class="store-rating">
                                        ${store.rating ? '★'.repeat(Math.floor(store.rating)) : ''} 
                                        ${store.rating ? store.rating.toFixed(1) : 'New'}
                                    </div>
                                    ${store.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Show products section
            if (products_results.length > 0) {
                resultsHTML += `
                    <div>
                        <h3 style="font-weight: 700; margin-bottom: 12px;">
                            <i class="fas fa-box"></i> Products (${products_results.length})
                        </h3>
                        <div class="products-grid" style="padding: 0;">
                            ${products_results.map(product => storeManager.renderProductCard(product)).join('')}
                        </div>
                    </div>
                `;
            }

            if (resultsHTML === '') {
                resultsHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No Results Found</h3>
                        <p>Try different keywords or filters</p>
                    </div>
                `;
            }

            resultsContainer.innerHTML = resultsHTML;

        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Search Failed</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

    async renderOrders() {
        const mainContent = document.getElementById('mainContent');
        utils.showLoading(mainContent);

        try {
            if (!this.isAuthenticated) {
                this.showAuthModal();
                return;
            }

            const ordersSnapshot = await db.collection('orders')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            if (ordersSnapshot.empty) {
                utils.showEmptyState(mainContent, 'No Orders Yet', 'fa-box-open', 'Your orders will appear here');
                return;
            }

            let ordersHTML = `
                <div class="orders-page">
                    <div style="padding: 16px;">
                        <h2 style="font-size: 24px; font-weight: 700;">My Orders</h2>
                    </div>
            `;

            for (const doc of ordersSnapshot.docs) {
                const order = doc.data();
                const storeDoc = await db.collection('stores').doc(order.storeId).get();
                const storeName = storeDoc.exists ? storeDoc.data().name : 'Unknown Store';

                ordersHTML += `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <div style="font-weight: 700;">${storeName}</div>
                                <div style="font-size: 12px; color: #636E72;">Order #${order.orderNumber}</div>
                            </div>
                            <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            ${order.items.map(item => `
                                <div style="display: flex; gap: 12px; margin-bottom: 8px; align-items: center;">
                                    <img src="${item.image || 'https://via.placeholder.com/48'}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
                                        <div style="font-size: 12px; color: #636E72;">Qty: ${item.quantity}</div>
                                    </div>
                                    <div style="font-weight: 700; color: #6C5CE7;">${utils.formatCurrency(utils.convertPrice(item.price * item.quantity))}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="border-top: 1px solid #DFE6E9; padding-top: 12px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 12px; color: #636E72;">Date</span>
                                <span style="font-size: 14px; font-weight: 600;">${utils.formatDate(order.createdAt)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 12px; color: #636E72;">Total</span>
                                <span style="font-size: 16px; font-weight: 700; color: #6C5CE7;">${utils.formatCurrency(utils.convertPrice(order.totalAmount))}</span>
                            </div>
                            ${order.paymentReference ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 12px; color: #636E72;">Payment Ref</span>
                                    <span style="font-size: 12px;">${order.paymentReference}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div style="margin-top: 12px; display: flex; gap: 8px;">
                            <button onclick="app.viewOrderDetails('${doc.id}')" style="flex: 1; padding: 8px; background: #6C5CE7; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                View Details
                            </button>
                            ${order.status === 'delivered' ? `
                                <button onclick="app.requestRefund('${doc.id}')" style="padding: 8px 16px; background: #FD79A8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                    Refund
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            ordersHTML += `</div>`;
            mainContent.innerHTML = ordersHTML;

        } catch (error) {
            console.error('Render orders error:', error);
            mainContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Orders</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

    async viewOrderDetails(orderId) {
        try {
            const orderDoc = await db.collection('orders').doc(orderId).get();
            if (!orderDoc.exists) {
                utils.showToast('Order not found', 'error');
                return;
            }

            const order = orderDoc.data();
            const storeDoc = await db.collection('stores').doc(order.storeId).get();
            const storeName = storeDoc.exists ? storeDoc.data().name : 'Unknown Store';

            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <div style="padding: 16px;">
                    <button onclick="app.renderOrders()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                        <i class="fas fa-arrow-left"></i> Back to Orders
                    </button>
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                            <h2 style="font-weight: 700;">Order #${order.orderNumber}</h2>
                            <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <h3 style="font-weight: 600; margin-bottom: 8px;">Store</h3>
                            <p>${storeName}</p>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <h3 style="font-weight: 600; margin-bottom: 8px;">Items</h3>
                            ${order.items.map(item => `
                                <div style="display: flex; gap: 12px; margin-bottom: 8px; padding: 8px; background: #F5F6FA; border-radius: 8px;">
                                    <img src="${item.image || 'https://via.placeholder.com/60'}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">${item.name}</div>
                                        <div style="font-size: 12px; color: #636E72;">Qty: ${item.quantity} × ${utils.formatCurrency(utils.convertPrice(item.price))}</div>
                                    </div>
                                    <div style="font-weight: 700; color: #6C5CE7;">${utils.formatCurrency(utils.convertPrice(item.price * item.quantity))}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <h3 style="font-weight: 600; margin-bottom: 8px;">Shipping Address</h3>
                            <div style="background: #F5F6FA; padding: 12px; border-radius: 8px;">
                                <p style="font-weight: 600;">${order.shippingAddress.fullName}</p>
                                <p>${order.shippingAddress.address}</p>
                                <p>${order.shippingAddress.city}, ${order.shippingAddress.country}</p>
                                <p>${order.shippingAddress.phone}</p>
                            </div>
                        </div>
                        
                        <div style="border-top: 2px solid #DFE6E9; padding-top: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span>Subtotal</span>
                                <span>${utils.formatCurrency(utils.convertPrice(order.subtotal))}</span>
                            </div>
                            ${order.discount > 0 ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #00B894;">
                                    <span>Discount ${order.discountCode ? `(${order.discountCode})` : ''}</span>
                                    <span>-${utils.formatCurrency(utils.convertPrice(order.discount))}</span>
                                </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 18px;">
                                <span>Total</span>
                                <span style="color: #6C5CE7;">${utils.formatCurrency(utils.convertPrice(order.totalAmount))}</span>
                            </div>
                        </div>
                        
                        <div style="margin-top: 16px; font-size: 12px; color: #636E72;">
                            <p>Payment Reference: ${order.paymentReference}</p>
                            <p>Order Date: ${utils.formatDate(order.createdAt)}</p>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('View order details error:', error);
            utils.showToast('Failed to load order details', 'error');
        }
    }

    async requestRefund(orderId) {
        const reason = prompt('Please provide a reason for the refund:');
        if (!reason) return;

        try {
            utils.showToast('Processing refund request...', 'warning');
            await api.processRefund(orderId, reason);
            utils.showToast('Refund request submitted successfully', 'success');
            
            // Refresh orders
            setTimeout(() => this.renderOrders(), 1500);
        } catch (error) {
            utils.showToast('Refund request failed: ' + error.message, 'error');
        }
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
    }

    hideAuthModal() {
        document.getElementById('authModal').style.display = 'none';
    }

    async signOut() {
        try {
            await auth.signOut();
            this.currentUser = null;
            this.isAuthenticated = false;
            utils.showToast('Signed out successfully', 'success');
            this.navigateTo('home');
        } catch (error) {
            console.error('Sign out error:', error);
            utils.showToast('Failed to sign out', 'error');
        }
    }
}

// Authentication class
class Auth {
    async signInWithEmail(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            utils.showToast('Please fill in all fields', 'warning');
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            utils.showToast('Welcome back!', 'success');
            app.hideAuthModal();
        } catch (error) {
            console.error('Sign in error:', error);
            let message = 'Failed to sign in';
            
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
            }
            
            utils.showToast(message, 'error');
        }
    }

    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            await auth.signInWithPopup(provider);
            utils.showToast('Welcome to STOLIY!', 'success');
            app.hideAuthModal();
        } catch (error) {
            console.error('Google sign in error:', error);
            utils.showToast('Failed to sign in with Google', 'error');
        }
    }

    showSignUp() {
        const authBody = document.querySelector('.auth-body');
        authBody.innerHTML = `
            <button class="btn-google" onclick="auth.signInWithGoogle()">
                <i class="fab fa-google"></i> Continue with Google
            </button>
            <div class="divider">
                <span>or</span>
            </div>
            <form id="signUpForm" onsubmit="auth.signUpWithEmail(event)">
                <div class="input-group">
                    <i class="fas fa-user"></i>
                    <input type="text" id="signUpName" placeholder="Full Name" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="signUpEmail" placeholder="Email address" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-phone"></i>
                    <input type="tel" id="signUpPhone" placeholder="Phone Number">
                </div>
                <div class="input-group">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="signUpPassword" placeholder="Password (min. 6 characters)" required minlength="6">
                </div>
                <button type="submit" class="btn-primary">Create Account</button>
            </form>
            <p class="auth-toggle">
                Already have an account? <a href="#" onclick="auth.showLogin()">Sign In</a>
            </p>
        `;
    }

    showLogin() {
        const authBody = document.querySelector('.auth-body');
        authBody.innerHTML = `
            <button class="btn-google" onclick="auth.signInWithGoogle()">
                <i class="fab fa-google"></i> Continue with Google
            </button>
            <div class="divider">
                <span>or</span>
            </div>
            <form id="loginForm" onsubmit="auth.signInWithEmail(event)">
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="loginEmail" placeholder="Email address" required>
                </div>
                <div class="input-group">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="loginPassword" placeholder="Password" required>
                </div>
                <button type="submit" class="btn-primary">Sign In</button>
            </form>
            <p class="auth-toggle">
                Don't have an account? <a href="#" onclick="auth.showSignUp()">Sign Up</a>
            </p>
            <p style="text-align: center; margin-top: 12px;">
                <a href="#" onclick="auth.showForgotPassword()" style="color: #6C5CE7; text-decoration: none; font-size: 14px;">Forgot Password?</a>
            </p>
        `;
    }

    showForgotPassword() {
        const authBody = document.querySelector('.auth-body');
        authBody.innerHTML = `
            <h3 style="text-align: center; margin-bottom: 16px;">Reset Password</h3>
            <form onsubmit="auth.resetPassword(event)">
                <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="resetEmail" placeholder="Email address" required>
                </div>
                <button type="submit" class="btn-primary">Send Reset Link</button>
            </form>
            <p class="auth-toggle">
                <a href="#" onclick="auth.showLogin()">Back to Sign In</a>
            </p>
        `;
    }

    async signUpWithEmail(event) {
        event.preventDefault();
        
        const name = document.getElementById('signUpName').value;
        const email = document.getElementById('signUpEmail').value;
        const phone = document.getElementById('signUpPhone').value;
        const password = document.getElementById('signUpPassword').value;

        if (!name || !email || !password) {
            utils.showToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Send verification email
            await userCredential.user.sendEmailVerification();

            // Create user document
            await db.collection('users').doc(userCredential.user.uid).set({
                userId: utils.generateId('USR'),
                email: email,
                name: name,
                phone: phone,
                photoURL: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                preferredCurrency: localStorage.getItem('preferredCurrency') || 'USD',
                isSeller: false,
                following: [],
                walletConnected: false
            });

            utils.showToast('Account created! Please verify your email.', 'success');
            app.hideAuthModal();
        } catch (error) {
            console.error('Sign up error:', error);
            let message = 'Failed to create account';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'Email already in use';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address';
                    break;
                case 'auth/weak-password':
                    message = 'Password should be at least 6 characters';
                    break;
            }
            
            utils.showToast(message, 'error');
        }
    }

    async resetPassword(event) {
        event.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        
        if (!email) {
            utils.showToast('Please enter your email', 'warning');
            return;
        }

        try {
            await auth.sendPasswordResetEmail(email);
            utils.showToast('Password reset link sent to your email', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Reset password error:', error);
            utils.showToast('Failed to send reset link', 'error');
        }
    }
}

// Initialize app and auth
const app = new App();
const auth_instance = new Auth();

// Make auth globally accessible
window.auth = auth_instance;