// ============================================
// STOLIY - PRODUCT MANAGEMENT
// ============================================

class ProductManager {
    constructor() {
        this.currentProduct = null;
        this.cart = [];
        this.wishlist = [];
    }

    // Add product
    async addProduct(productData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            // Get user's store
            const store = await storeManager.getStoreByOwner(user.uid);
            if (!store) throw new Error('You need to create a store first');

            const productRef = await db.collection('products').add({
                ...productData,
                storeId: store.id,
                productId: utils.generateId('PRD'),
                active: true,
                inStock: true,
                rating: 0,
                totalReviews: 0,
                totalSales: 0,
                sponsored: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update store product count
            await db.collection('stores').doc(store.id).update({
                totalProducts: firebase.firestore.FieldValue.increment(1)
            });

            return productRef.id;
        } catch (error) {
            console.error('Add product error:', error);
            throw error;
        }
    }

    // Upload product images
    async uploadProductImages(productId, files) {
        try {
            const uploadPromises = Array.from(files).map(file => 
                utils.uploadToCloudinary(file, `products/${productId}`)
            );
            
            const urls = await Promise.all(uploadPromises);
            
            await db.collection('products').doc(productId).update({
                images: firebase.firestore.FieldValue.arrayUnion(...urls)
            });

            return urls;
        } catch (error) {
            console.error('Upload images error:', error);
            throw error;
        }
    }

    // Upload product video
    async uploadProductVideo(productId, file) {
        try {
            const url = await utils.uploadToCloudinary(file, `products/${productId}/videos`);
            
            await db.collection('products').doc(productId).update({
                video: url
            });

            return url;
        } catch (error) {
            console.error('Upload video error:', error);
            throw error;
        }
    }

    // Get product by ID
    async getProduct(productId) {
        try {
            const productDoc = await db.collection('products').doc(productId).get();
            if (!productDoc.exists) throw new Error('Product not found');

            this.currentProduct = {
                id: productDoc.id,
                ...productDoc.data()
            };

            return this.currentProduct;
        } catch (error) {
            console.error('Get product error:', error);
            throw error;
        }
    }

    // Update product
    async updateProduct(productId, updateData) {
        try {
            await db.collection('products').doc(productId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    }

    // Delete product
    async deleteProduct(productId) {
        try {
            const product = await this.getProduct(productId);
            
            // Remove from store count
            await db.collection('stores').doc(product.storeId).update({
                totalProducts: firebase.firestore.FieldValue.increment(-1)
            });

            // Delete product
            await db.collection('products').doc(productId).delete();

            return true;
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    }

    // Search products
    async searchProducts(query, filters = {}) {
        try {
            let productQuery = db.collection('products')
                .where('active', '==', true);

            if (filters.category && filters.category !== 'All') {
                productQuery = productQuery.where('category', '==', filters.category);
            }

            if (filters.minPrice) {
                productQuery = productQuery.where('price', '>=', Number(filters.minPrice));
            }

            if (filters.maxPrice) {
                productQuery = productQuery.where('price', '<=', Number(filters.maxPrice));
            }

            const snapshot = await productQuery.get();
            let products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter by search query
            if (query) {
                const searchLower = query.toLowerCase();
                products = products.filter(product => 
                    product.name.toLowerCase().includes(searchLower) ||
                    product.description.toLowerCase().includes(searchLower) ||
                    product.category.toLowerCase().includes(searchLower) ||
                    (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                );
            }

            // Apply sorting
            if (filters.sortBy === 'price_asc') {
                products.sort((a, b) => a.price - b.price);
            } else if (filters.sortBy === 'price_desc') {
                products.sort((a, b) => b.price - a.price);
            } else if (filters.sortBy === 'newest') {
                products.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
            } else if (filters.sortBy === 'rating') {
                products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            } else if (filters.sortBy === 'popular') {
                products.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
            }

            // Filter by country if specified
            if (filters.country) {
                // Get stores from that country
                const storesSnapshot = await db.collection('stores')
                    .where('country', '==', filters.country)
                    .get();
                const storeIds = storesSnapshot.docs.map(doc => doc.id);
                products = products.filter(p => storeIds.includes(p.storeId));
            }

            // Filter by verified stores only
            if (filters.verifiedOnly) {
                const verifiedStoresSnapshot = await db.collection('stores')
                    .where('verified', '==', true)
                    .get();
                const verifiedStoreIds = verifiedStoresSnapshot.docs.map(doc => doc.id);
                products = products.filter(p => verifiedStoreIds.includes(p.storeId));
            }

            return products;
        } catch (error) {
            console.error('Search products error:', error);
            return [];
        }
    }

    // Get sponsored products
    async getSponsoredProducts() {
        try {
            const snapshot = await db.collection('products')
                .where('sponsored', '==', true)
                .where('active', '==', true)
                .orderBy('sponsoredUntil', 'desc')
                .limit(20)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get sponsored products error:', error);
            return [];
        }
    }

    // Add to cart
    async addToCart(productId, quantity = 1, variant = null) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            const product = await this.getProduct(productId);
            if (!product.inStock) throw new Error('Product is out of stock');

            // Check if already in cart
            const existingCart = await db.collection('cart')
                .where('userId', '==', user.uid)
                .where('productId', '==', productId)
                .where('variant', '==', variant)
                .get();

            if (!existingCart.empty) {
                // Update quantity
                const cartDoc = existingCart.docs[0];
                await cartDoc.ref.update({
                    quantity: firebase.firestore.FieldValue.increment(quantity),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Add new cart item
                await db.collection('cart').add({
                    userId: user.uid,
                    productId: productId,
                    storeId: product.storeId,
                    quantity: quantity,
                    variant: variant,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    name: product.name,
                    image: product.images[0] || '',
                    currency: product.currency || 'USD',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Update cart badge
            await this.updateCartBadge();
            
            utils.showToast('Added to cart!', 'success');
            return true;
        } catch (error) {
            console.error('Add to cart error:', error);
            utils.showToast(error.message, 'error');
            throw error;
        }
    }

    // Remove from cart
    async removeFromCart(cartItemId) {
        try {
            await db.collection('cart').doc(cartItemId).delete();
            await this.updateCartBadge();
            utils.showToast('Removed from cart', 'success');
            return true;
        } catch (error) {
            console.error('Remove from cart error:', error);
            throw error;
        }
    }

    // Update cart item quantity
    async updateCartQuantity(cartItemId, quantity) {
        try {
            if (quantity <= 0) {
                return await this.removeFromCart(cartItemId);
            }

            await db.collection('cart').doc(cartItemId).update({
                quantity: quantity,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Update cart quantity error:', error);
            throw error;
        }
    }

    // Get cart items grouped by store
    async getCartItems() {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const cartSnapshot = await db.collection('cart')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .get();

            const cartItems = cartSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Group by store
            const grouped = {};
            for (const item of cartItems) {
                if (!grouped[item.storeId]) {
                    // Get store info
                    const storeDoc = await db.collection('stores').doc(item.storeId).get();
                    grouped[item.storeId] = {
                        storeId: item.storeId,
                        storeName: storeDoc.exists ? storeDoc.data().name : 'Unknown Store',
                        storeLogo: storeDoc.exists ? storeDoc.data().logo : '',
                        items: []
                    };
                }
                grouped[item.storeId].items.push(item);
            }

            this.cart = Object.values(grouped);
            return this.cart;
        } catch (error) {
            console.error('Get cart items error:', error);
            return [];
        }
    }

    // Calculate cart totals
    calculateCartTotal(cartGroup) {
        let subtotal = 0;
        let discount = 0;

        for (const item of cartGroup.items) {
            subtotal += item.price * item.quantity;
        }

        return {
            subtotal: subtotal,
            discount: discount,
            total: subtotal - discount
        };
    }

    // Update cart badge
    async updateCartBadge() {
        try {
            const user = auth.currentUser;
            if (!user) {
                document.getElementById('cartBadge').textContent = '0';
                return;
            }

            const cartSnapshot = await db.collection('cart')
                .where('userId', '==', user.uid)
                .get();

            const badge = document.getElementById('cartBadge');
            if (badge) {
                badge.textContent = cartSnapshot.size;
                badge.style.display = cartSnapshot.size > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Update cart badge error:', error);
        }
    }

    // Add to wishlist
    async addToWishlist(productId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Please login first');

            // Check if already in wishlist
            const existingWishlist = await db.collection('wishlist')
                .where('userId', '==', user.uid)
                .where('productId', '==', productId)
                .get();

            if (!existingWishlist.empty) {
                utils.showToast('Already in wishlist', 'warning');
                return false;
            }

            await db.collection('wishlist').add({
                userId: user.uid,
                productId: productId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            utils.showToast('Added to wishlist!', 'success');
            return true;
        } catch (error) {
            console.error('Add to wishlist error:', error);
            throw error;
        }
    }

    // Remove from wishlist
    async removeFromWishlist(wishlistItemId) {
        try {
            await db.collection('wishlist').doc(wishlistItemId).delete();
            utils.showToast('Removed from wishlist', 'success');
            return true;
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            throw error;
        }
    }

    // Get wishlist
    async getWishlist() {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const wishlistSnapshot = await db.collection('wishlist')
                .where('userId', '==', user.uid)
                .get();

            const wishlistItems = [];
            for (const doc of wishlistSnapshot.docs) {
                const productDoc = await db.collection('products').doc(doc.data().productId).get();
                if (productDoc.exists) {
                    wishlistItems.push({
                        wishlistId: doc.id,
                        ...productDoc.data(),
                        productId: doc.data().productId
                    });
                }
            }

            this.wishlist = wishlistItems;
            return wishlistItems;
        } catch (error) {
            console.error('Get wishlist error:', error);
            return [];
        }
    }

    // View product detail
    async viewProduct(productId) {
        const mainContent = document.getElementById('mainContent');
        
        try {
            const product = await this.getProduct(productId);
            const store = await storeManager.getStore(product.storeId);
            const displayPrice = utils.convertPrice(product.price);
            const displayOriginalPrice = product.originalPrice ? utils.convertPrice(product.originalPrice) : null;
            const discount = utils.calculateDiscount(product.originalPrice, product.price);
            const relatedProducts = await this.searchProducts('', { 
                category: product.category,
                sortBy: 'rating'
            });

            mainContent.innerHTML = `
                <div class="product-detail-page">
                    <!-- Back Button -->
                    <div style="padding: 16px;">
                        <button onclick="history.back()" style="background: none; border: none; font-size: 24px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                    </div>

                    <!-- Product Images -->
                    <div class="product-images-carousel" style="position: relative; overflow-x: auto; display: flex; gap: 0; scroll-snap-type: x mandatory;">
                        ${product.images.map(img => `
                            <img src="${img}" alt="${product.name}" style="width: 100%; flex-shrink: 0; scroll-snap-align: start; max-height: 400px; object-fit: cover;">
                        `).join('')}
                        ${discount > 0 ? `<span class="discount-badge" style="position: absolute; top: 16px; left: 16px; z-index: 1;">-${discount}%</span>` : ''}
                    </div>

                    <!-- Product Video -->
                    ${product.video ? `
                        <div style="padding: 16px;">
                            <video controls style="width: 100%; border-radius: 12px;">
                                <source src="${product.video}" type="video/mp4">
                            </video>
                        </div>
                    ` : ''}

                    <!-- Product Info -->
                    <div style="padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h1 style="font-size: 24px; font-weight: 700;">${product.name}</h1>
                                <p style="color: #636E72; margin-top: 8px;">${product.category}</p>
                            </div>
                            <button onclick="products.addToWishlist('${productId}')" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #FD79A8;">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>

                        <!-- Price -->
                        <div style="margin-top: 16px; display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 32px; font-weight: 800; color: #6C5CE7;">
                                ${utils.formatCurrency(displayPrice)}
                            </span>
                            ${displayOriginalPrice ? `
                                <span style="font-size: 18px; color: #B2BEC3; text-decoration: line-through;">
                                    ${utils.formatCurrency(displayOriginalPrice)}
                                </span>
                            ` : ''}
                        </div>

                        <!-- Rating -->
                        ${product.rating ? `
                            <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="color: #FDCB6E;">
                                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                                </div>
                                <span style="color: #636E72;">(${product.totalReviews || 0} reviews)</span>
                                <span style="color: #6C5CE7;">• ${product.totalSales || 0} sold</span>
                            </div>
                        ` : ''}

                        <!-- Stock Status -->
                        <div style="margin-top: 12px; font-size: 14px;">
                            ${product.inStock ? 
                                '<span style="color: #00B894;">● In Stock</span>' : 
                                '<span style="color: #E17055;">● Out of Stock</span>'
                            }
                            ${product.stockQuantity ? `<span style="margin-left: 8px; color: #636E72;">(${product.stockQuantity} available)</span>` : ''}
                        </div>

                        <!-- Store Info -->
                        <div onclick="storeManager.renderStorePage('${product.storeId}')" style="margin-top: 20px; padding: 16px; background: #F5F6FA; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                            <img src="${store.logo || 'https://via.placeholder.com/48'}" alt="${store.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                    ${store.name}
                                    ${store.verified ? '<i class="fas fa-check-circle verified-icon"></i>' : ''}
                                </div>
                                <div style="font-size: 12px; color: #636E72;">${store.totalProducts || 0} products • ${store.followers || 0} followers</div>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #B2BEC3;"></i>
                        </div>

                        <!-- Description -->
                        <div style="margin-top: 20px;">
                            <h3 style="font-weight: 700; margin-bottom: 8px;">Description</h3>
                            <p style="color: #636E72; line-height: 1.6;">${product.description || 'No description available.'}</p>
                        </div>

                        <!-- Variants -->
                        ${product.variants ? `
                            <div style="margin-top: 20px;">
                                <h3 style="font-weight: 700; margin-bottom: 12px;">Options</h3>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${product.variants.map(v => `
                                        <button class="variant-btn" style="padding: 8px 16px; border: 2px solid #DFE6E9; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s;">
                                            ${v}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Related Products -->
                    <div style="padding: 16px;">
                        <div class="section-header" style="padding: 0 0 16px 0;">
                            <h3>Related Products</h3>
                        </div>
                        <div class="products-grid" style="padding: 0;">
                            ${relatedProducts.slice(0, 4).map(p => storeManager.renderProductCard(p)).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Fixed bottom bar
            const bottomBar = document.createElement('div');
            bottomBar.style.cssText = `
                position: fixed;
                bottom: 70px;
                left: 50%;
                transform: translateX(-50%);
                width: 100%;
                max-width: 480px;
                background: white;
                padding: 12px 16px;
                display: flex;
                gap: 12px;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                z-index: 999;
            `;
            bottomBar.innerHTML = `
                <button onclick="products.addToCart('${productId}')" style="flex: 1; padding: 14px; background: #6C5CE7; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer;">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button onclick="products.buyNow('${productId}')" style="flex: 1; padding: 14px; background: #00B894; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer;">
                    <i class="fas fa-bolt"></i> Buy Now
                </button>
            `;
            mainContent.appendChild(bottomBar);

        } catch (error) {
            console.error('View product error:', error);
            utils.showToast('Failed to load product', 'error');
        }
    }

    // Buy now
    async buyNow(productId) {
        await this.addToCart(productId, 1);
        this.renderCheckout();
    }

    // Render cart page
    async renderCart() {
        const mainContent = document.getElementById('mainContent');
        utils.showLoading(mainContent);

        try {
            const cartGroups = await this.getCartItems();

            if (cartGroups.length === 0) {
                utils.showEmptyState(mainContent, 'Your cart is empty', 'fa-shopping-cart', 'Add some products to get started!');
                return;
            }

            let cartHTML = `
                <div class="cart-page">
                    <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="font-size: 24px; font-weight: 700;">My Cart</h2>
                        <span style="color: #636E72;">${cartGroups.reduce((sum, g) => sum + g.items.length, 0)} items</span>
                    </div>
            `;

            for (const group of cartGroups) {
                const totals = this.calculateCartTotal(group);
                
                cartHTML += `
                    <div class="cart-group">
                        <div class="cart-store-header">
                            <img src="${group.storeLogo || 'https://via.placeholder.com/32'}" alt="${group.storeName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                            <span style="font-weight: 700;">${group.storeName}</span>
                            <i class="fas fa-chevron-right" style="margin-left: auto; color: #B2BEC3;"></i>
                        </div>
                `;

                for (const item of group.items) {
                    cartHTML += `
                        <div class="cart-item">
                            <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="cart-item-image">
                            <div class="cart-item-details">
                                <div class="cart-item-name">${item.name}</div>
                                ${item.variant ? `<div style="font-size: 12px; color: #636E72;">${item.variant}</div>` : ''}
                                <div class="cart-item-price">${utils.formatCurrency(utils.convertPrice(item.price))}</div>
                                <div class="quantity-control">
                                    <button class="quantity-btn" onclick="products.updateCartQuantity('${item.id}', ${item.quantity - 1})">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span style="font-weight: 700;">${item.quantity}</span>
                                    <button class="quantity-btn" onclick="products.updateCartQuantity('${item.id}', ${item.quantity + 1})">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button onclick="products.removeFromCart('${item.id}')" style="margin-left: auto; background: none; border: none; color: #E17055; cursor: pointer;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Discount code input
                cartHTML += `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #DFE6E9;">
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="discountCode_${group.storeId}" placeholder="Discount code" style="flex: 1; padding: 8px 12px; border: 2px solid #DFE6E9; border-radius: 8px; font-size: 14px;">
                            <button onclick="products.applyDiscount('${group.storeId}')" style="padding: 8px 16px; background: #6C5CE7; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Apply
                            </button>
                        </div>
                    </div>
                `;

                // Store subtotal
                cartHTML += `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #DFE6E9; display: flex; justify-content: space-between; font-weight: 700;">
                        <span>Subtotal</span>
                        <span>${utils.formatCurrency(utils.convertPrice(totals.subtotal))}</span>
                    </div>
                `;

                cartHTML += `</div>`;
            }

            // Checkout button
            cartHTML += `
                <div style="padding: 16px;">
                    <button onclick="products.renderCheckout()" style="width: 100%; padding: 16px; background: #6C5CE7; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 18px; cursor: pointer;">
                        Proceed to Checkout
                    </button>
                </div>
            `;

            cartHTML += `</div>`;
            mainContent.innerHTML = cartHTML;

        } catch (error) {
            console.error('Render cart error:', error);
            mainContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Cart</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    // Apply discount code
    async applyDiscount(storeId) {
        const codeInput = document.getElementById(`discountCode_${storeId}`);
        const code = codeInput.value.trim();
        
        if (!code) {
            utils.showToast('Please enter a discount code', 'warning');
            return;
        }

        try {
            const cartGroup = this.cart.find(g => g.storeId === storeId);
            const totals = this.calculateCartTotal(cartGroup);
            
            const discount = await api.validateDiscountCode(code, storeId, totals.subtotal);
            
            if (discount) {
                // Store discount info for checkout
                sessionStorage.setItem(`discount_${storeId}`, JSON.stringify(discount));
                utils.showToast(`Discount applied: -${utils.formatCurrency(discount.discountAmount)}`, 'success');
                
                // Refresh cart display
                await this.renderCart();
            }
        } catch (error) {
            utils.showToast(error.message, 'error');
        }
    }

    // Render checkout page
    async renderCheckout() {
        const mainContent = document.getElementById('mainContent');
        
        try {
            const cartGroups = await this.getCartItems();
            
            if (cartGroups.length === 0) {
                utils.showToast('Your cart is empty', 'warning');
                return;
            }

            // Calculate total for all stores combined
            let grandTotal = 0;
            let totalDiscount = 0;

            for (const group of cartGroups) {
                const totals = this.calculateCartTotal(group);
                grandTotal += totals.subtotal;
                
                // Check for applied discount
                const savedDiscount = sessionStorage.getItem(`discount_${group.storeId}`);
                if (savedDiscount) {
                    const discount = JSON.parse(savedDiscount);
                    totalDiscount += discount.discountAmount;
                }
            }

            const finalTotal = grandTotal - totalDiscount;
            const displayGrandTotal = utils.convertPrice(grandTotal);
            const displayDiscount = utils.convertPrice(totalDiscount);
            const displayFinalTotal = utils.convertPrice(finalTotal);

            mainContent.innerHTML = `
                <div class="checkout-page">
                    <div style="padding: 16px;">
                        <button onclick="products.renderCart()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                            <i class="fas fa-arrow-left"></i> Back to Cart
                        </button>
                        <h2 style="font-size: 24px; font-weight: 700;">Checkout</h2>
                    </div>

                    <!-- Shipping Address -->
                    <div class="checkout-summary">
                        <h3 style="font-weight: 700; margin-bottom: 12px;">
                            <i class="fas fa-map-marker-alt"></i> Shipping Address
                        </h3>
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" id="fullName" placeholder="Full Name" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-phone"></i>
                            <input type="tel" id="phone" placeholder="Phone Number" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-map-pin"></i>
                            <textarea id="address" placeholder="Full Address" rows="3" required></textarea>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-city"></i>
                            <input type="text" id="city" placeholder="City" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-globe"></i>
                            <select id="country">
                                <option value="">Select Country</option>
                            </select>
                        </div>
                    </div>

                    <!-- Delivery Method -->
                    <div class="checkout-summary">
                        <h3 style="font-weight: 700; margin-bottom: 12px;">
                            <i class="fas fa-truck"></i> Delivery Method
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 2px solid #6C5CE7; border-radius: 12px; cursor: pointer;">
                                <input type="radio" name="delivery" value="standard" checked>
                                <div style="flex: 1;">
                                    <div style="font-weight: 700;">Standard Delivery</div>
                                    <div style="font-size: 12px; color: #636E72;">5-7 business days</div>
                                </div>
                                <span style="font-weight: 700;">$5.00</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 2px solid #DFE6E9; border-radius: 12px; cursor: pointer;">
                                <input type="radio" name="delivery" value="express">
                                <div style="flex: 1;">
                                    <div style="font-weight: 700;">Express Delivery</div>
                                    <div style="font-size: 12px; color: #636E72;">1-3 business days</div>
                                </div>
                                <span style="font-weight: 700;">$15.00</span>
                            </label>
                        </div>
                    </div>

                    <!-- Order Summary -->
                    <div class="checkout-summary">
                        <h3 style="font-weight: 700; margin-bottom: 12px;">
                            <i class="fas fa-receipt"></i> Order Summary
                        </h3>
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>${utils.formatCurrency(displayGrandTotal)}</span>
                        </div>
                        ${totalDiscount > 0 ? `
                            <div class="summary-row" style="color: #00B894;">
                                <span>Discount</span>
                                <span>-${utils.formatCurrency(displayDiscount)}</span>
                            </div>
                        ` : ''}
                        <div class="summary-row">
                            <span>Shipping</span>
                            <span>$5.00</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total</span>
                            <span>${utils.formatCurrency(displayFinalTotal + 5)}</span>
                        </div>
                    </div>

                    <!-- Payment Method -->
                    <div class="checkout-summary">
                        <h3 style="font-weight: 700; margin-bottom: 12px;">
                            <i class="fas fa-credit-card"></i> Payment Method
                        </h3>
                        <div style="display: flex; gap: 12px; padding: 16px; background: #F5F6FA; border-radius: 12px; align-items: center;">
                            <i class="fas fa-credit-card" style="font-size: 24px; color: #6C5CE7;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 700;">Flutterwave</div>
                                <div style="font-size: 12px; color: #636E72;">Pay with card, bank transfer, USSD</div>
                            </div>
                            <i class="fas fa-check-circle" style="color: #00B894; font-size: 20px;"></i>
                        </div>
                    </div>

                    <!-- Place Order Button -->
                    <div style="padding: 16px;">
                        <button onclick="products.placeOrder()" style="width: 100%; padding: 16px; background: #00B894; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 18px; cursor: pointer;">
                            <i class="fas fa-lock"></i> Place Order - ${utils.formatCurrency(displayFinalTotal + 5)}
                        </button>
                        <p style="text-align: center; margin-top: 12px; font-size: 12px; color: #636E72;">
                            <i class="fas fa-shield-alt"></i> Secured by Flutterwave
                        </p>
                    </div>
                </div>
            `;

            // Populate countries dropdown
            setTimeout(() => {
                const countrySelect = document.getElementById('country');
                if (countrySelect && typeof countries !== 'undefined') {
                    countrySelect.innerHTML = '<option value="">Select Country</option>' +
                        countries.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
                }
            }, 100);

        } catch (error) {
            console.error('Render checkout error:', error);
            utils.showToast('Failed to load checkout', 'error');
        }
    }

    // Place order
    async placeOrder() {
        const fullName = document.getElementById('fullName')?.value;
        const phone = document.getElementById('phone')?.value;
        const address = document.getElementById('address')?.value;
        const city = document.getElementById('city')?.value;
        const country = document.getElementById('country')?.value;

        if (!fullName || !phone || !address || !city || !country) {
            utils.showToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            const user = auth.currentUser;
            const cartGroups = await this.getCartItems();
            
            // Calculate total
            let totalAmount = 0;
            for (const group of cartGroups) {
                const totals = this.calculateCartTotal(group);
                totalAmount += totals.subtotal;
                
                const savedDiscount = sessionStorage.getItem(`discount_${group.storeId}`);
                if (savedDiscount) {
                    const discount = JSON.parse(savedDiscount);
                    totalAmount -= discount.discountAmount;
                }
            }

            // Initialize payment
            const paymentData = {
                amount: totalAmount + 5, // Including shipping
                currency: utils.userCurrency,
                email: user.email,
                name: fullName,
                phone: phone,
                orderId: utils.generateId('ORD'),
                userId: user.uid
            };

            const payment = await api.initializePayment(paymentData);

            // Open Flutterwave payment modal
            this.openFlutterwaveModal(payment, {
                fullName,
                phone,
                address,
                city,
                country,
                cartGroups,
                totalAmount
            });

        } catch (error) {
            console.error('Place order error:', error);
            utils.showToast('Payment initialization failed', 'error');
        }
    }

    // Open Flutterwave payment modal
    openFlutterwaveModal(payment, orderData) {
        FlutterwaveCheckout({
            public_key: CONFIG.flutterwaveKey,
            tx_ref: payment.tx_ref,
            amount: payment.amount,
            currency: payment.currency,
            payment_options: 'card, banktransfer, ussd',
            customer: {
                email: payment.email,
                name: orderData.fullName,
                phonenumber: orderData.phone
            },
            customizations: {
                title: 'STOLIY',
                description: 'Payment for order',
                logo: 'https://stoliy.vercel.app/app-icon.png'
            },
            callback: async (response) => {
                if (response.status === 'successful') {
                    await this.handleSuccessfulPayment(response, orderData);
                } else {
                    utils.showToast('Payment was not successful', 'error');
                }
            },
            onclose: () => {
                utils.showToast('Payment window closed', 'warning');
            }
        });
    }

    // Handle successful payment
    async handleSuccessfulPayment(response, orderData) {
        try {
            // Verify payment on backend
            const verification = await api.verifyPayment(response.transaction_id);
            
            if (verification.status === 'success') {
                // Create orders for each store
                for (const group of orderData.cartGroups) {
                    const totals = this.calculateCartTotal(group);
                    const savedDiscount = sessionStorage.getItem(`discount_${group.storeId}`);
                    let discountData = null;
                    
                    if (savedDiscount) {
                        discountData = JSON.parse(savedDiscount);
                        await api.applyDiscountCode(discountData.discountId);
                    }

                    await api.createOrder({
                        userId: auth.currentUser.uid,
                        storeId: group.storeId,
                        items: group.items,
                        subtotal: totals.subtotal,
                        discount: discountData?.discountAmount || 0,
                        discountCode: discountData?.code || null,
                        totalAmount: totals.total - (discountData?.discountAmount || 0),
                        shippingAddress: {
                            fullName: orderData.fullName,
                            phone: orderData.phone,
                            address: orderData.address,
                            city: orderData.city,
                            country: orderData.country
                        },
                        paymentReference: response.transaction_id,
                        paidAmount: orderData.totalAmount,
                        currency: utils.userCurrency,
                        baseCurrency: 'USD',
                        exchangeRate: utils.exchangeRates[utils.userCurrency] || 1
                    });
                }

                // Clear discounts from session
                for (const group of orderData.cartGroups) {
                    sessionStorage.removeItem(`discount_${group.storeId}`);
                }

                utils.showToast('Order placed successfully!', 'success');
                
                // Navigate to orders page
                setTimeout(() => {
                    document.querySelector('[data-page="orders"]').click();
                }, 1500);
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            utils.showToast('Order confirmation failed. Please contact support.', 'error');
        }
    }
}

// Initialize products manager
const products = new ProductManager();