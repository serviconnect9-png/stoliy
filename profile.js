// ============================================
// STOLIY - USER PROFILE
// ============================================

class Profile {
    constructor() {
        this.userData = null;
    }

    async renderProfile() {
        const mainContent = document.getElementById('mainContent');
        
        if (!app.isAuthenticated) {
            app.showAuthModal();
            return;
        }

        utils.showLoading(mainContent);

        try {
            // Load user data
            const userDoc = await db.collection('users').doc(app.currentUser.uid).get();
            this.userData = userDoc.exists ? userDoc.data() : {};

            // Get user's store if any
            const store = await storeManager.getStoreByOwner(app.currentUser.uid);

            // Get wallet info
            let walletInfo = null;
            if (this.userData.walletConnected) {
                const walletDoc = await db.collection('wallets').doc(this.userData.walletId).get();
                if (walletDoc.exists) {
                    walletInfo = walletDoc.data();
                }
            }

            mainContent.innerHTML = `
                <div class="profile-page">
                    <!-- Profile Header -->
                    <div class="profile-header">
                        <img src="${app.currentUser.photoURL || 'https://via.placeholder.com/80'}" alt="${app.currentUser.displayName}" class="profile-avatar">
                        <div class="profile-name">${app.currentUser.displayName || 'User'}</div>
                        <div class="profile-id">${this.userData.userId || 'USR-XXXXXX'}</div>
                        ${store?.verified ? '<span class="verified-badge" style="background: white; color: #6C5CE7; padding: 4px 12px; border-radius: 20px; margin-top: 8px; display: inline-block;"><i class="fas fa-check-circle"></i> Verified Seller</span>' : ''}
                    </div>

                    <!-- Quick Stats -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; margin-top: -20px;">
                        <div style="background: white; padding: 16px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-shopping-bag" style="font-size: 24px; color: #6C5CE7;"></i>
                            <div style="font-weight: 700; font-size: 18px; margin-top: 8px;" id="totalOrders">-</div>
                            <div style="font-size: 11px; color: #636E72;">Orders</div>
                        </div>
                        <div style="background: white; padding: 16px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-heart" style="font-size: 24px; color: #FD79A8;"></i>
                            <div style="font-weight: 700; font-size: 18px; margin-top: 8px;" id="totalWishlist">-</div>
                            <div style="font-size: 11px; color: #636E72;">Wishlist</div>
                        </div>
                        <div style="background: white; padding: 16px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-star" style="font-size: 24px; color: #FDCB6E;"></i>
                            <div style="font-weight: 700; font-size: 18px; margin-top: 8px;">${this.userData.reviewCount || 0}</div>
                            <div style="font-size: 11px; color: #636E72;">Reviews</div>
                        </div>
                    </div>

                    <!-- Wallet Card (if connected) -->
                    ${this.userData.walletConnected && walletInfo ? `
                        <div class="wallet-card">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 14px; opacity: 0.8;">STOLIY Wallet</div>
                                    <div class="wallet-balance">${utils.formatCurrency(walletInfo.availableBalance || 0)}</div>
                                    <div style="font-size: 14px;">Available Balance</div>
                                </div>
                                <i class="fas fa-wallet" style="font-size: 48px; opacity: 0.3;"></i>
                            </div>
                            <div style="margin-top: 16px; display: flex; justify-content: space-between;">
                                <div>
                                    <div style="font-size: 12px; opacity: 0.7;">Pending</div>
                                    <div style="font-weight: 600;">${utils.formatCurrency(walletInfo.pendingBalance || 0)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; opacity: 0.7;">Wallet ID</div>
                                    <div style="font-weight: 600; font-size: 12px;">${this.userData.walletId}</div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="wallet-card" style="text-align: center;" onclick="profile.connectWallet()">
                            <i class="fas fa-wallet" style="font-size: 48px; opacity: 0.5; margin-bottom: 12px;"></i>
                            <div style="font-weight: 700; margin-bottom: 8px;">Connect STOLIY Wallet</div>
                            <div style="font-size: 14px; opacity: 0.8;">Connect your wallet to manage funds</div>
                        </div>
                    `}

                    <!-- Store Section -->
                    ${store ? `
                        <div class="profile-menu" style="margin-top: 16px;">
                            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">My Store</h3>
                            <div class="menu-item" onclick="storeManager.renderStorePage('${store.id}')">
                                <i class="fas fa-store"></i>
                                <span>${store.name}</span>
                                ${store.verified ? '<i class="fas fa-check-circle" style="color: #6C5CE7; margin-left: auto;"></i>' : ''}
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            <div class="menu-item" onclick="profile.manageStore()">
                                <i class="fas fa-cogs"></i>
                                <span>Manage Store</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    ` : `
                        <div class="profile-menu" style="margin-top: 16px;">
                            <div class="menu-item" onclick="profile.createStore()">
                                <i class="fas fa-store-alt"></i>
                                <span>Become a Seller</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `}

                    <!-- Dropship Section -->
                    ${this.userData.dropshipId ? `
                        <div class="profile-menu">
                            <div class="menu-item">
                                <i class="fas fa-parachute-box"></i>
                                <div>
                                    <div>Dropship Connected</div>
                                    <div style="font-size: 11px; color: #636E72;">ID: ${this.userData.dropshipId}</div>
                                </div>
                                <span style="margin-left: auto; padding: 2px 8px; background: #00B894; color: white; border-radius: 12px; font-size: 11px;">Active</span>
                            </div>
                        </div>
                    ` : `
                        <div class="profile-menu">
                            <div class="menu-item" onclick="profile.connectDropship()">
                                <i class="fas fa-parachute-box"></i>
                                <span>Connect Dropship</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `}

                    <!-- Main Menu -->
                    <div class="profile-menu">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Account</h3>
                        
                        <div class="menu-item" onclick="app.renderOrders()">
                            <i class="fas fa-box"></i>
                            <span>My Orders</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.showWishlist()">
                            <i class="fas fa-heart"></i>
                            <span>Wishlist</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.showAddresses()">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Addresses</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.showNotifications()">
                            <i class="fas fa-bell"></i>
                            <span>Notifications</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>

                    <!-- IDs Section -->
                    <div class="profile-menu">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">My IDs</h3>
                        
                        <div class="menu-item" onclick="utils.copyToClipboard('${this.userData.userId}')">
                            <i class="fas fa-id-card"></i>
                            <span>User ID</span>
                            <span style="font-size: 12px; color: #636E72; margin-left: auto;">${this.userData.userId}</span>
                        </div>
                        
                        ${this.userData.walletId ? `
                            <div class="menu-item" onclick="utils.copyToClipboard('${this.userData.walletId}')">
                                <i class="fas fa-wallet"></i>
                                <span>Wallet ID</span>
                                <span style="font-size: 12px; color: #636E72; margin-left: auto;">${this.userData.walletId}</span>
                            </div>
                        ` : ''}
                        
                        ${this.userData.dropshipId ? `
                            <div class="menu-item" onclick="utils.copyToClipboard('${this.userData.dropshipId}')">
                                <i class="fas fa-parachute-box"></i>
                                <span>Dropship ID</span>
                                <span style="font-size: 12px; color: #636E72; margin-left: auto;">${this.userData.dropshipId}</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Settings -->
                    <div class="profile-menu">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Settings</h3>
                        
                        <div class="menu-item" onclick="profile.editProfile()">
                            <i class="fas fa-user-edit"></i>
                            <span>Edit Profile</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.changeCurrency()">
                            <i class="fas fa-coins"></i>
                            <span>Currency</span>
                            <span style="margin-left: auto; color: #636E72;">${utils.userCurrency}</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.changeLanguage()">
                            <i class="fas fa-language"></i>
                            <span>Language</span>
                            <span style="margin-left: auto; color: #636E72;">English</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.notificationSettings()">
                            <i class="fas fa-sliders-h"></i>
                            <span>Notification Settings</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.privacySettings()">
                            <i class="fas fa-shield-alt"></i>
                            <span>Privacy</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>

                    <!-- Support & Legal -->
                    <div class="profile-menu">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Support</h3>
                        
                        <a href="customersupport.js" class="menu-item" style="text-decoration: none; color: inherit;">
                            <i class="fas fa-headset"></i>
                            <span>Customer Support</span>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                        
                        <a href="contact.html" class="menu-item" style="text-decoration: none; color: inherit;">
                            <i class="fas fa-envelope"></i>
                            <span>Contact Us</span>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                        
                        <a href="about.html" class="menu-item" style="text-decoration: none; color: inherit;">
                            <i class="fas fa-info-circle"></i>
                            <span>About STOLIY</span>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                        
                        <a href="terms.html" class="menu-item" style="text-decoration: none; color: inherit;">
                            <i class="fas fa-file-contract"></i>
                            <span>Terms of Service</span>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                        
                        <a href="refund.html" class="menu-item" style="text-decoration: none; color: inherit;">
                            <i class="fas fa-undo-alt"></i>
                            <span>Refund Policy</span>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    </div>

                    <!-- Danger Zone -->
                    <div class="profile-menu">
                        <div class="menu-item" onclick="app.signOut()" style="color: #E17055;">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                        
                        <div class="menu-item" onclick="profile.deleteAccount()" style="color: #E17055;">
                            <i class="fas fa-trash-alt"></i>
                            <span>Delete Account</span>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>

                    <div style="text-align: center; padding: 20px; color: #B2BEC3; font-size: 12px;">
                        <p>${CONFIG.appName} v${CONFIG.version}</p>
                        <p>Powered by ${CONFIG.poweredBy}</p>
                    </div>
                </div>
            `;

            // Load stats
            this.loadStats();

        } catch (error) {
            console.error('Render profile error:', error);
            mainContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Profile</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

    async loadStats() {
        try {
            // Get total orders
            const ordersSnapshot = await db.collection('orders')
                .where('userId', '==', app.currentUser.uid)
                .get();
            
            const totalOrdersEl = document.getElementById('totalOrders');
            if (totalOrdersEl) {
                totalOrdersEl.textContent = ordersSnapshot.size;
            }

            // Get wishlist count
            const wishlistSnapshot = await db.collection('wishlist')
                .where('userId', '==', app.currentUser.uid)
                .get();
            
            const totalWishlistEl = document.getElementById('totalWishlist');
            if (totalWishlistEl) {
                totalWishlistEl.textContent = wishlistSnapshot.size;
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    editProfile() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div style="padding: 16px;">
                <button onclick="profile.renderProfile()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Edit Profile</h2>
                
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${app.currentUser.photoURL || 'https://via.placeholder.com/80'}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                        <button onclick="profile.changePhoto()" style="display: block; margin: 8px auto 0; padding: 8px 16px; background: #6C5CE7; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            Change Photo
                        </button>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input type="text" id="editName" value="${app.currentUser.displayName || ''}" placeholder="Full Name">
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" value="${app.currentUser.email || ''}" disabled style="background: #F5F6FA;">
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-phone"></i>
                        <input type="tel" id="editPhone" value="${this.userData.phone || ''}" placeholder="Phone Number">
                    </div>
                    
                    <button onclick="profile.saveProfile()" class="btn-primary" style="margin-top: 16px;">
                        Save Changes
                    </button>
                </div>
            </div>
        `;
    }

    async saveProfile() {
        const name = document.getElementById('editName').value;
        const phone = document.getElementById('editPhone').value;

        try {
            // Update Firebase Auth profile
            await app.currentUser.updateProfile({
                displayName: name
            });

            // Update Firestore user data
            await db.collection('users').doc(app.currentUser.uid).update({
                name: name,
                phone: phone,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            utils.showToast('Profile updated successfully', 'success');
            this.renderProfile();
        } catch (error) {
            console.error('Save profile error:', error);
            utils.showToast('Failed to update profile', 'error');
        }
    }

    async changePhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const url = await utils.uploadToCloudinary(file, 'profile-photos');
                
                // Update auth profile
                await app.currentUser.updateProfile({
                    photoURL: url
                });

                // Update Firestore
                await db.collection('users').doc(app.currentUser.uid).update({
                    photoURL: url
                });

                utils.showToast('Photo updated!', 'success');
                this.editProfile();
            } catch (error) {
                console.error('Change photo error:', error);
                utils.showToast('Failed to update photo', 'error');
            }
        };

        input.click();
    }

    async changeCurrency() {
        const currencies = [
            { code: 'USD', name: 'US Dollar' },
            { code: 'EUR', name: 'Euro' },
            { code: 'GBP', name: 'British Pound' },
            { code: 'NGN', name: 'Nigerian Naira' },
            { code: 'GHS', name: 'Ghanaian Cedi' },
            { code: 'KES', name: 'Kenyan Shilling' },
            { code: 'ZAR', name: 'South African Rand' },
            { code: 'INR', name: 'Indian Rupee' }
        ];

        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div style="padding: 16px;">
                <button onclick="profile.renderProfile()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Select Currency</h2>
                
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    ${currencies.map(curr => `
                        <div onclick="profile.setCurrency('${curr.code}')" 
                             style="padding: 16px; border-bottom: 1px solid #DFE6E9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; ${utils.userCurrency === curr.code ? 'background: #F5F6FA;' : ''}">
                            <span>${curr.name} (${utils.currencySymbols[curr.code] || curr.code})</span>
                            ${utils.userCurrency === curr.code ? '<i class="fas fa-check-circle" style="color: #6C5CE7;"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async setCurrency(currencyCode) {
        utils.userCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        
        // Update user preferences in Firestore
        if (app.isAuthenticated) {
            await db.collection('users').doc(app.currentUser.uid).update({
                preferredCurrency: currencyCode
            });
        }

        utils.showToast(`Currency set to ${currencyCode}`, 'success');
        this.renderProfile();
    }

    changeLanguage() {
        utils.showToast('Language settings coming soon', 'warning');
    }

    notificationSettings() {
        utils.showToast('Notification settings coming soon', 'warning');
    }

    privacySettings() {
        utils.showToast('Privacy settings coming soon', 'warning');
    }

    async showWishlist() {
        const mainContent = document.getElementById('mainContent');
        utils.showLoading(mainContent);

        try {
            const wishlist = await products.getWishlist();
            
            mainContent.innerHTML = `
                <div style="padding: 16px;">
                    <button onclick="profile.renderProfile()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    
                    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">My Wishlist</h2>
                    
                    ${wishlist.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-heart-broken"></i>
                            <h3>No Items in Wishlist</h3>
                            <p>Products you love will appear here</p>
                        </div>
                    ` : `
                        <div class="products-grid" style="padding: 0;">
                            ${wishlist.map(product => storeManager.renderProductCard(product)).join('')}
                        </div>
                    `}
                </div>
            `;
        } catch (error) {
            console.error('Show wishlist error:', error);
        }
    }

    showAddresses() {
        utils.showToast('Address management coming soon', 'warning');
    }

    showNotifications() {
        utils.showToast('Notifications coming soon', 'warning');
    }

    async createStore() {
        if (!app.isAuthenticated) {
            app.showAuthModal();
            return;
        }

        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div style="padding: 16px;">
                <button onclick="profile.renderProfile()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Create Your Store</h2>
                
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div class="input-group">
                        <i class="fas fa-store"></i>
                        <input type="text" id="storeName" placeholder="Store Name" required>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-align-left"></i>
                        <textarea id="storeDescription" placeholder="Store Description" rows="3"></textarea>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-tags"></i>
                        <select id="storeCategory">
                            <option value="">Select Category</option>
                            ${CONFIG.storeCategories.map(cat => `
                                <option value="${cat.name}">${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-globe"></i>
                        <select id="storeCountry">
                            <option value="">Select Country</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-shield-alt"></i>
                        <textarea id="storePolicies" placeholder="Store Policies (Returns, Shipping, etc.)" rows="3"></textarea>
                    </div>
                    
                    <button onclick="profile.saveStore()" class="btn-primary" style="margin-top: 16px;">
                        Create Store
                    </button>
                </div>
            </div>
        `;

        // Populate countries
        setTimeout(() => {
            const countrySelect = document.getElementById('storeCountry');
            if (countrySelect && typeof countries !== 'undefined') {
                countrySelect.innerHTML = '<option value="">Select Country</option>' +
                    countries.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            }
        }, 100);
    }

    async saveStore() {
        const name = document.getElementById('storeName').value;
        const description = document.getElementById('storeDescription').value;
        const category = document.getElementById('storeCategory').value;
        const country = document.getElementById('storeCountry').value;
        const policies = document.getElementById('storePolicies').value;

        if (!name || !category) {
            utils.showToast('Please fill in required fields', 'warning');
            return;
        }

        try {
            const storeId = await storeManager.createStore({
                name,
                description,
                category,
                country,
                policies,
                active: true
            });

            utils.showToast('Store created successfully!', 'success');
            setTimeout(() => this.renderProfile(), 1500);
        } catch (error) {
            utils.showToast('Failed to create store: ' + error.message, 'error');
        }
    }

    manageStore() {
        utils.showToast('Store management dashboard coming soon', 'warning');
    }

    connectWallet() {
        utils.showToast('Wallet connection coming soon', 'warning');
    }

    connectDropship() {
        utils.showToast('Dropship connection coming soon', 'warning');
    }

    async deleteAccount() {
        const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        
        if (confirmed) {
            try {
                // Delete user data from Firestore
                await db.collection('users').doc(app.currentUser.uid).delete();
                
                // Delete auth account
                await app.currentUser.delete();
                
                utils.showToast('Account deleted', 'success');
                app.navigateTo('home');
            } catch (error) {
                console.error('Delete account error:', error);
                utils.showToast('Failed to delete account. Please try again.', 'error');
            }
        }
    }
}

// Initialize profile
const profile = new Profile();