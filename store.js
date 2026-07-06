// ============================================
// STOLIY - STORE MANAGEMENT
// ============================================

class StoreManager {
    constructor() {
        this.currentStore = null;
        this.storeProducts = [];
        this.storeReviews = [];
    }

    // Create new store
    async createStore(storeData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            const storeRef = await db.collection('stores').add({
                ...storeData,
                ownerId: user.uid,
                storeId: utils.generateId('STR'),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                verified: false,
                followers: 0,
                rating: 0,
                totalReviews: 0,
                totalProducts: 0
            });

            // Update user as seller
            await db.collection('users').doc(user.uid).update({
                isSeller: true,
                storeId: storeRef.id
            });

            return storeRef.id;
        } catch (error) {
            console.error('Create store error:', error);
            throw error;
        }
    }

    // Get store by ID
    async getStore(storeId) {
        try {
            const storeDoc = await db.collection('stores').doc(storeId).get();
            if (!storeDoc.exists) throw new Error('Store not found');

            this.currentStore = {
                id: storeDoc.id,
                ...storeDoc.data()
            };

            return this.currentStore;
        } catch (error) {
            console.error('Get store error:', error);
            throw error;
        }
    }

    // Get store by owner
    async getStoreByOwner(userId) {
        try {
            const storeSnapshot = await db.collection('stores')
                .where('ownerId', '==', userId)
                .limit(1)
                .get();

            if (storeSnapshot.empty) return null;

            this.currentStore = {
                id: storeSnapshot.docs[0].id,
                ...storeSnapshot.docs[0].data()
            };

            return this.currentStore;
        } catch (error) {
            console.error('Get store by owner error:', error);
            return null;
        }
    }

    // Update store
    async updateStore(storeId, updateData) {
        try {
            await db.collection('stores').doc(storeId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.currentStore = {
                ...this.currentStore,
                ...updateData
            };

            return true;
        } catch (error) {
            console.error('Update store error:', error);
            throw error;
        }
    }

    // Upload store banner
    async uploadBanner(storeId, file) {
        try {
            const url = await utils.uploadToCloudinary(file, 'store-banners');
            await this.updateStore(storeId, { banner: url });
            return url;
        } catch (error) {
            console.error('Upload banner error:', error);
            throw error;
        }
    }

    // Upload store logo
    async uploadLogo(storeId, file) {
        try {
            const url = await utils.uploadToCloudinary(file, 'store-logos');
            await this.updateStore(storeId, { logo: url });
            return url;
        } catch (error) {
            console.error('Upload logo error:', error);
            throw error;
        }
    }

    // Get store products
    async getStoreProducts(storeId, filters = {}) {
        try {
            let query = db.collection('products')
                .where('storeId', '==', storeId)
                .where('active', '==', true);

            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }

            if (filters.minPrice) {
                query = query.where('price', '>=', filters.minPrice);
            }

            if (filters.maxPrice) {
                query = query.where('price', '<=', filters.maxPrice);
            }

            if (filters.sortBy === 'price_asc') {
                query = query.orderBy('price', 'asc');
            } else if (filters.sortBy === 'price_desc') {
                query = query.orderBy('price', 'desc');
            } else if (filters.sortBy === 'newest') {
                query = query.orderBy('createdAt', 'desc');
            } else {
                query = query.orderBy('rating', 'desc');
            }

            const snapshot = await query.get();
            this.storeProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return this.storeProducts;
        } catch (error) {
            console.error('Get store products error:', error);
            return [];
        }
    }

    // Follow store
    async followStore(storeId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            // Add to user's following
            await db.collection('users').doc(user.uid).update({
                following: firebase.firestore.FieldValue.arrayUnion(storeId)
            });

            // Increment store followers
            await db.collection('stores').doc(storeId).update({
                followers: firebase.firestore.FieldValue.increment(1)
            });

            return true;
        } catch (error) {
            console.error('Follow store error:', error);
            throw error;
        }
    }

    // Unfollow store
    async unfollowStore(storeId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            await db.collection('users').doc(user.uid).update({
                following: firebase.firestore.FieldValue.arrayRemove(storeId)
            });

            await db.collection('stores').doc(storeId).update({
                followers: firebase.firestore.FieldValue.increment(-1)
            });

            return true;
        } catch (error) {
            console.error('Unfollow store error:', error);
            throw error;
        }
    }

    // Check if user is following store
    async isFollowing(storeId) {
        try {
            const user = auth.currentUser;
            if (!user) return false;

            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            return userData.following && userData.following.includes(storeId);
        } catch (error) {
            return false;
        }
    }

    // Get store reviews
    async getStoreReviews(storeId) {
        try {
            const reviewsSnapshot = await db.collection('reviews')
                .where('storeId', '==', storeId)
                .orderBy('createdAt', 'desc')
                .get();

            this.storeReviews = reviewsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return this.storeReviews;
        } catch (error) {
            console.error('Get reviews error:', error);
            return [];
        }
    }

    // Add review
    async addReview(storeId, reviewData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            const reviewRef = await db.collection('reviews').add({
                ...reviewData,
                storeId: storeId,
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update store rating
            const reviews = await this.getStoreReviews(storeId);
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

            await this.updateStore(storeId, {
                rating: avgRating,
                totalReviews: reviews.length
            });

            return reviewRef.id;
        } catch (error) {
            console.error('Add review error:', error);
            throw error;
        }
    }

    // Create discount code
    async createDiscountCode(storeId, discountData) {
        try {
            const discountRef = await db.collection('discountCodes').add({
                ...discountData,
                storeId: storeId,
                code: discountData.code.toUpperCase(),
                active: true,
                currentUses: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return discountRef.id;
        } catch (error) {
            console.error('Create discount error:', error);
            throw error;
        }
    }

    // Create flash sale
    async createFlashSale(storeId, saleData) {
        try {
            const saleRef = await db.collection('flashSales').add({
                ...saleData,
                storeId: storeId,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return saleRef.id;
        } catch (error) {
            console.error('Create flash sale error:', error);
            throw error;
        }
    }

    // Get store statistics
    async getStoreStats(storeId) {
        try {
            const [storeDoc, productsSnapshot, ordersSnapshot] = await Promise.all([
                db.collection('stores').doc(storeId).get(),
                db.collection('products').where('storeId', '==', storeId).get(),
                db.collection('orders').where('storeId', '==', storeId).get()
            ]);

            const orders = ordersSnapshot.docs.map(doc => doc.data());
            const totalRevenue = orders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            const pendingOrders = orders.filter(o => o.status === 'processing').length;

            return {
                totalProducts: productsSnapshot.size,
                totalOrders: ordersSnapshot.size,
                totalRevenue: totalRevenue,
                pendingOrders: pendingOrders,
                rating: storeDoc.data().rating || 0,
                followers: storeDoc.data().followers || 0,
                verified: storeDoc.data().verified || false
            };
        } catch (error) {
            console.error('Get store stats error:', error);
            return null;
        }
    }

    // Verify store
    async submitVerification(storeId, verificationData) {
        try {
            await db.collection('verifications').add({
                storeId: storeId,
                ...verificationData,
                status: 'pending',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.updateStore(storeId, {
                verificationStatus: 'pending'
            });

            return true;
        } catch (error) {
            console.error('Submit verification error:', error);
            throw error;
        }
    }

    // Search stores
    async searchStores(query, filters = {}) {
        try {
            let storeQuery = db.collection('stores')
                .where('active', '==', true);

            if (filters.category) {
                storeQuery = storeQuery.where('category', '==', filters.category);
            }

            if (filters.verified) {
                storeQuery = storeQuery.where('verified', '==', true);
            }

            const snapshot = await storeQuery.get();
            let stores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter by search query
            if (query) {
                const searchLower = query.toLowerCase();
                stores = stores.filter(store => 
                    store.name.toLowerCase().includes(searchLower) ||
                    store.description.toLowerCase().includes(searchLower) ||
                    store.category.toLowerCase().includes(searchLower)
                );
            }

            // Sort by rating if specified
            if (filters.sortBy === 'rating') {
                stores.sort((a, b) => b.rating - a.rating);
            }

            return stores;
        } catch (error) {
            console.error('Search stores error:', error);
            return [];
        }
    }

    // Get trending stores
    async getTrendingStores(limit = 10) {
        try {
            const snapshot = await db.collection('stores')
                .where('active', '==', true)
                .orderBy('followers', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get trending stores error:', error);
            return [];
        }
    }

    // Get featured stores (sponsored)
    async getFeaturedStores() {
        try {
            const snapshot = await db.collection('stores')
                .where('sponsored', '==', true)
                .where('active', '==', true)
                .orderBy('sponsoredUntil', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get featured stores error:', error);
            return [];
        }
    }

    // Render store page
    async renderStorePage(storeId) {
        const mainContent = document.getElementById('mainContent');
        
        try {
            const store = await this.getStore(storeId);
            const products = await this.getStoreProducts(storeId);
            const isUserFollowing = await this.isFollowing(storeId);
            const flashSales = await api.getFlashSales(storeId);
            
            mainContent.innerHTML = `
                <div class="store-page">
                    <div class="store-header">
                        <img src="${store.banner || 'https://via.placeholder.com/480x160'}" alt="${store.name}" class="store-banner">
                    </div>
                    
                    <div class="store-info">
                        <img src="${store.logo || 'https://via.placeholder.com/80'}" alt="${store.name}" class="store-avatar">
                        
                        <div class="store-details">
                            <div>
                                <h2>
                                    ${store.name}
                                    ${store.verified ? '<i class="fas fa-check-circle verified-icon"></i>' : ''}
                                </h2>
                                <p>${store.category || 'General Store'}</p>
                            </div>
                            <div class="store-actions">
                                <button class="btn-follow" onclick="storeManager.toggleFollow('${storeId}')">
                                    <i class="fas ${isUserFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                                    ${isUserFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button class="btn-share" onclick="utils.copyToClipboard(window.location.href)">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                                <button class="btn-chat" onclick="window.open('${CONFIG.whatsappCommunity}', '_blank')">
                                    <i class="fas fa-comments"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="store-stats">
                            <div class="stat">
                                <div class="stat-value">${store.followers || 0}</div>
                                <div class="stat-label">Followers</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${store.rating ? store.rating.toFixed(1) : '0.0'} <i class="fas fa-star" style="color: #FDCB6E;"></i></div>
                                <div class="stat-label">Rating (${store.totalReviews || 0})</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${products.length}</div>
                                <div class="stat-label">Products</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="store-tabs">
                        <button class="store-tab active" onclick="storeManager.switchTab('home', '${storeId}')">Home</button>
                        <button class="store-tab" onclick="storeManager.switchTab('products', '${storeId}')">Products</button>
                        <button class="store-tab" onclick="storeManager.switchTab('categories', '${storeId}')">Categories</button>
                        ${flashSales.length > 0 ? '<button class="store-tab" onclick="storeManager.switchTab(\'flash-sale\', \'' + storeId + '\')">Flash Sale <span class="flash-sale-badge">LIVE</span></button>' : ''}
                        <button class="store-tab" onclick="storeManager.switchTab('reviews', '${storeId}')">Reviews</button>
                        <button class="store-tab" onclick="storeManager.switchTab('about', '${storeId}')">About</button>
                    </div>
                    
                    <div id="storeTabContent" class="store-tab-content">
                        ${this.renderStoreProducts(products)}
                    </div>
                </div>
            `;
        } catch (error) {
            utils.showToast('Failed to load store', 'error');
            mainContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store-slash"></i>
                    <h3>Store Not Found</h3>
                    <p>This store doesn't exist or has been removed.</p>
                </div>
            `;
        }
    }

    // Switch store tab
    async switchTab(tab, storeId) {
        const tabs = document.querySelectorAll('.store-tab');
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        const tabContent = document.getElementById('storeTabContent');
        
        switch(tab) {
            case 'home':
                const products = await this.getStoreProducts(storeId);
                tabContent.innerHTML = this.renderStoreProducts(products);
                break;
            case 'products':
                const allProducts = await this.getStoreProducts(storeId);
                tabContent.innerHTML = this.renderStoreProducts(allProducts);
                break;
            case 'categories':
                tabContent.innerHTML = this.renderStoreCategories();
                break;
            case 'flash-sale':
                const flashSales = await api.getFlashSales(storeId);
                tabContent.innerHTML = this.renderFlashSales(flashSales);
                break;
            case 'reviews':
                const reviews = await this.getStoreReviews(storeId);
                tabContent.innerHTML = this.renderReviews(reviews);
                break;
            case 'about':
                tabContent.innerHTML = this.renderAbout();
                break;
        }
    }

    // Render store products
    renderStoreProducts(products) {
        if (products.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Yet</h3>
                    <p>This store hasn't added any products.</p>
                </div>
            `;
        }

        return `
            <div class="products-grid" style="padding: 16px;">
                ${products.map(product => this.renderProductCard(product)).join('')}
            </div>
        `;
    }

    // Render product card
    renderProductCard(product) {
        const discount = utils.calculateDiscount(product.originalPrice, product.price);
        const displayPrice = utils.convertPrice(product.price);
        
        return `
            <div class="product-card" onclick="products.viewProduct('${product.id}')">
                <div style="position: relative;">
                    <img src="${product.images[0] || 'https://via.placeholder.com/200'}" alt="${product.name}" class="product-image">
                    ${discount > 0 ? `<span class="discount-badge" style="position: absolute; top: 8px; left: 8px;">-${discount}%</span>` : ''}
                    ${product.video ? '<i class="fas fa-play-circle" style="position: absolute; top: 8px; right: 8px; color: white; font-size: 20px;"></i>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">
                        ${utils.formatCurrency(displayPrice)}
                        ${discount > 0 ? `<span class="product-original-price">${utils.formatCurrency(utils.convertPrice(product.originalPrice))}</span>` : ''}
                    </div>
                    ${product.rating ? `
                        <div style="color: #FDCB6E; font-size: 12px;">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                            <span style="color: #636E72;">(${product.totalReviews || 0})</span>
                        </div>
                    ` : ''}
                    <div style="font-size: 11px; color: #636E72; margin-top: 4px;">
                        ${product.inStock ? '<span style="color: #00B894;">● In Stock</span>' : '<span style="color: #E17055;">● Out of Stock</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Render categories
    renderStoreCategories() {
        const categories = [...new Set(this.storeProducts.map(p => p.category))];
        
        return `
            <div class="categories-grid" style="padding: 16px;">
                ${categories.map(category => `
                    <div class="category-item" onclick="storeManager.filterByCategory('${category}')">
                        <i class="${this.getCategoryIcon(category)}"></i>
                        <span>${category}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Get category icon
    getCategoryIcon(category) {
        const cat = CONFIG.categories.find(c => c.name === category);
        return cat ? cat.icon : 'fa-solid fa-tag';
    }

    // Filter by category
    async filterByCategory(category) {
        const products = await this.getStoreProducts(this.currentStore.id, { category });
        document.getElementById('storeTabContent').innerHTML = this.renderStoreProducts(products);
    }

    // Render flash sales
    renderFlashSales(flashSales) {
        if (flashSales.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-bolt"></i>
                    <h3>No Active Flash Sales</h3>
                    <p>Check back later for amazing deals!</p>
                </div>
            `;
        }

        return `
            <div class="products-grid" style="padding: 16px;">
                ${flashSales.map(sale => {
                    const endDate = sale.endDate.toDate();
                    const timeLeft = this.getTimeLeft(endDate);
                    
                    return `
                        <div class="product-card" style="position: relative;">
                            <span class="flash-sale-badge" style="position: absolute; top: 8px; right: 8px; z-index: 1;">⚡ ${timeLeft}</span>
                            ${this.renderProductCard({ ...sale.product, price: sale.salePrice, originalPrice: sale.product.price })}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Get time left
    getTimeLeft(endDate) {
        const now = new Date();
        const diff = endDate - now;
        
        if (diff <= 0) return 'Ended';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    // Render reviews
    renderReviews(reviews) {
        if (reviews.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-star-half-alt"></i>
                    <h3>No Reviews Yet</h3>
                    <p>Be the first to review this store!</p>
                </div>
            `;
        }

        return `
            <div style="padding: 16px;">
                ${reviews.map(review => `
                    <div class="review-card" style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <div style="font-weight: 700;">${review.userName || 'Anonymous'}</div>
                            <div style="color: #FDCB6E;">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </div>
                        </div>
                        <p>${review.comment}</p>
                        <div style="font-size: 11px; color: #636E72; margin-top: 8px;">
                            ${utils.formatDate(review.createdAt)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render about section
    renderAbout() {
        const store = this.currentStore;
        
        return `
            <div style="padding: 16px;">
                <div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h3>About ${store.name}</h3>
                    <p style="margin-top: 12px; color: #636E72;">${store.description || 'No description available.'}</p>
                    
                    <div style="margin-top: 16px;">
                        <h4>Store Details</h4>
                        <div style="margin-top: 8px; display: grid; gap: 8px;">
                            <div><strong>Category:</strong> ${store.category || 'N/A'}</div>
                            <div><strong>Joined:</strong> ${utils.formatDate(store.createdAt)}</div>
                            <div><strong>Products:</strong> ${store.totalProducts || 0}</div>
                            <div><strong>Status:</strong> ${store.verified ? '✅ Verified' : 'Pending Verification'}</div>
                        </div>
                    </div>
                    
                    ${store.policies ? `
                        <div style="margin-top: 16px;">
                            <h4>Store Policies</h4>
                            <p style="margin-top: 8px; color: #636E72;">${store.policies}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Toggle follow store
    async toggleFollow(storeId) {
        const isFollowing = await this.isFollowing(storeId);
        
        if (isFollowing) {
            await this.unfollowStore(storeId);
            utils.showToast('Unfollowed store', 'success');
        } else {
            await this.followStore(storeId);
            utils.showToast('Following store!', 'success');
        }
        
        // Refresh store page
        await this.renderStorePage(storeId);
    }
}

// Initialize store manager
const storeManager = new StoreManager();