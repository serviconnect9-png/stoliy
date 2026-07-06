// ============================================
// STOLIY - ROUTER SYSTEM
// ============================================

const StoliyRouter = {
    currentRoute: null,
    currentParams: {},
    
    // Initialize router on page load
    init() {
        this.parseRoute();
        this.handleAffiliateTracking();
        this.handleCampaignTracking();
        this.handleCouponCodes();
        this.updateActiveNav();
        console.log('📍 Route:', this.currentRoute, this.currentParams);
    },

    // Parse current URL to determine route
    parseRoute() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        // Store all query params
        this.currentParams = {};
        for (const [key, value] of params.entries()) {
            this.currentParams[key] = value;
        }

        // Clean URL routing
        if (path.includes('/store/')) {
            this.currentRoute = 'store';
            this.currentParams.slug = path.split('/store/')[1].replace(/\/$/, '');
        } else if (path.includes('/product/')) {
            this.currentRoute = 'product';
            this.currentParams.slug = path.split('/product/')[1].replace(/\/$/, '');
        } else if (path.includes('/category/')) {
            this.currentRoute = 'category';
            this.currentParams.slug = path.split('/category/')[1].replace(/\/$/, '');
        } else if (path.includes('/event/')) {
            this.currentRoute = 'event';
            this.currentParams.slug = path.split('/event/')[1].replace(/\/$/, '');
        } else if (path.includes('/profile/')) {
            this.currentRoute = 'profile';
            this.currentParams.username = path.split('/profile/')[1].replace(/\/$/, '');
        }
        // File-based routing (fallback)
        else if (path.includes('store.html')) {
            this.currentRoute = 'store';
            this.currentParams.id = params.get('id');
        } else if (path.includes('products.html') || path.includes('product.html')) {
            this.currentRoute = 'product';
            this.currentParams.id = params.get('id');
        } else if (path.includes('event-detail.html')) {
            this.currentRoute = 'event';
            this.currentParams.id = params.get('id');
        } else if (path.includes('home.html') || path === '/' || path === '') {
            this.currentRoute = 'home';
        } else if (path.includes('search.html')) {
            this.currentRoute = 'search';
        } else if (path.includes('cart.html')) {
            this.currentRoute = 'cart';
        } else if (path.includes('checkout.html')) {
            this.currentRoute = 'checkout';
        } else if (path.includes('profile.html')) {
            this.currentRoute = 'profile';
        } else if (path.includes('orders.html')) {
            this.currentRoute = 'orders';
        } else if (path.includes('wishlist.html')) {
            this.currentRoute = 'wishlist';
        } else if (path.includes('notifications.html')) {
            this.currentRoute = 'notifications';
        } else if (path.includes('chat.html')) {
            this.currentRoute = 'chat';
        } else if (path.includes('my-tickets.html')) {
            this.currentRoute = 'my-tickets';
        } else if (path.includes('addresses.html')) {
            this.currentRoute = 'addresses';
        } else if (path.includes('edit-profile.html')) {
            this.currentRoute = 'edit-profile';
        } else if (path.includes('store-dashboard.html') || path.includes('seller-dashboard.html')) {
            this.currentRoute = 'dashboard';
        } else if (path.includes('wizard.html')) {
            this.currentRoute = 'wizard';
        } else if (path.includes('flashsale.html') || path.includes('flash-sales.html')) {
            this.currentRoute = 'flashsale';
        } else if (path.includes('manage-products.html')) {
            this.currentRoute = 'manage-products';
        } else if (path.includes('add-product.html')) {
            this.currentRoute = 'add-product';
        } else if (path.includes('events.html')) {
            this.currentRoute = 'events';
        } else if (path.includes('create-event.html')) {
            this.currentRoute = 'create-event';
        } else if (path.includes('event-scanner.html')) {
            this.currentRoute = 'event-scanner';
        } else if (path.includes('discounts.html')) {
            this.currentRoute = 'discounts';
        } else if (path.includes('wallet.html')) {
            this.currentRoute = 'wallet';
        } else if (path.includes('team.html')) {
            this.currentRoute = 'team';
        } else if (path.includes('inventory.html')) {
            this.currentRoute = 'inventory';
        } else if (path.includes('fulfillment.html')) {
            this.currentRoute = 'fulfillment';
        } else if (path.includes('affiliates.html')) {
            this.currentRoute = 'affiliates';
        } else if (path.includes('appearance.html')) {
            this.currentRoute = 'appearance';
        } else if (path.includes('reviews.html')) {
            this.currentRoute = 'reviews';
        } else if (path.includes('followers.html')) {
            this.currentRoute = 'followers';
        } else if (path.includes('analytics.html')) {
            this.currentRoute = 'analytics';
        } else if (path.includes('printondemand.html')) {
            this.currentRoute = 'printondemand';
        } else if (path.includes('activity-log.html')) {
            this.currentRoute = 'activity-log';
        }
    },

    // Handle affiliate tracking from URL
    handleAffiliateTracking() {
        const ref = this.currentParams.ref || this.currentParams.affiliate || this.currentParams.aff || this.currentParams.r;
        
        if (ref) {
            const affiliateData = {
                id: ref,
                timestamp: Date.now(),
                expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
            };
            localStorage.setItem('stoliy_affiliate', JSON.stringify(affiliateData));
            console.log('🔗 Affiliate tracked:', ref);
        }

        // Clean expired affiliates
        const stored = localStorage.getItem('stoliy_affiliate');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (Date.now() > data.expiry) {
                    localStorage.removeItem('stoliy_affiliate');
                }
            } catch(e) {
                localStorage.removeItem('stoliy_affiliate');
            }
        }
    },

    // Handle campaign tracking
    handleCampaignTracking() {
        const campaign = this.currentParams.campaign || this.currentParams.utm_campaign || this.currentParams.utm_source;
        if (campaign) {
            sessionStorage.setItem('stoliy_campaign', campaign);
            console.log('📢 Campaign:', campaign);
        }
    },

    // Handle coupon codes from URL
    handleCouponCodes() {
        const coupon = this.currentParams.coupon || this.currentParams.code || this.currentParams.promo;
        if (coupon) {
            sessionStorage.setItem('stoliy_coupon', coupon.toUpperCase());
            console.log('🎫 Coupon:', coupon);
        }
    },

    // Get active affiliate ID for orders
    getAffiliateId() {
        const stored = localStorage.getItem('stoliy_affiliate');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (Date.now() < data.expiry) return data.id;
            } catch(e) {}
            localStorage.removeItem('stoliy_affiliate');
        }
        return null;
    },

    // Get active campaign
    getCampaign() {
        return sessionStorage.getItem('stoliy_campaign') || null;
    },

    // Get coupon code
    getCouponCode() {
        return sessionStorage.getItem('stoliy_coupon') || null;
    },

    // Generate clean store URL
    getStoreUrl(storeId, storeName, storeSlug) {
        const slug = storeSlug || (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const base = window.location.origin;
        let url = `${base}/store/${slug}`;
        const params = [];
        const affId = this.getAffiliateId();
        const campaign = this.getCampaign();
        if (affId) params.push(`ref=${affId}`);
        if (campaign) params.push(`campaign=${campaign}`);
        if (params.length) url += '?' + params.join('&');
        return url;
    },

    // Generate clean product URL
    getProductUrl(productId, productName, productSlug) {
        const slug = productSlug || (productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const base = window.location.origin;
        let url = `${base}/product/${slug}`;
        const params = [];
        const affId = this.getAffiliateId();
        const campaign = this.getCampaign();
        if (affId) params.push(`ref=${affId}`);
        if (campaign) params.push(`campaign=${campaign}`);
        if (params.length) url += '?' + params.join('&');
        return url;
    },

    // Generate clean event URL
    getEventUrl(eventId, eventName) {
        const slug = (eventName || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const base = window.location.origin;
        let url = `${base}/event/${slug}`;
        const params = [];
        const affId = this.getAffiliateId();
        if (affId) params.push(`ref=${affId}`);
        if (params.length) url += '?' + params.join('&');
        return url;
    },

    // Generate affiliate link
    getAffiliateUrl(type, id, name) {
        const affId = this.getAffiliateId();
        if (!affId) {
            if (type === 'store') return this.getStoreUrl(id, name);
            if (type === 'product') return this.getProductUrl(id, name);
            return window.location.href;
        }
        if (type === 'store') return this.getStoreUrl(id, name);
        if (type === 'product') return this.getProductUrl(id, name);
        return window.location.href;
    },

    // Navigate to a page
    navigateTo(route, params = {}) {
        const pages = {
            'home': 'home.html',
            'search': 'search.html',
            'cart': 'cart.html',
            'checkout': 'checkout.html',
            'profile': 'profile.html',
            'orders': 'orders.html',
            'wishlist': 'wishlist.html',
            'notifications': 'notifications.html',
            'chat': 'chat.html',
            'my-tickets': 'my-tickets.html',
            'addresses': 'addresses.html',
            'edit-profile': 'edit-profile.html',
            'dashboard': 'store-dashboard.html',
            'wizard': 'wizard.html',
            'flashsale': 'flashsale.html',
            'manage-products': 'manage-products.html',
            'add-product': 'add-product.html',
            'events': 'events.html',
            'create-event': 'create-event.html',
            'event-scanner': 'event-scanner.html',
            'discounts': 'discounts.html',
            'wallet': 'wallet.html',
            'team': 'team.html',
            'inventory': 'inventory.html',
            'fulfillment': 'fulfillment.html',
            'affiliates': 'affiliates.html',
            'appearance': 'appearance.html',
            'reviews': 'reviews.html',
            'followers': 'followers.html',
            'analytics': 'analytics.html'
        };

        let url = pages[route] || route;
        
        // Add query params
        const queryParts = [];
        for (const key in params) {
            if (params[key] !== undefined && params[key] !== null) {
                queryParts.push(`${key}=${encodeURIComponent(params[key])}`);
            }
        }
        
        // Add affiliate if exists
        const affId = this.getAffiliateId();
        if (affId && !params.ref) queryParts.push(`ref=${affId}`);
        
        if (queryParts.length) url += '?' + queryParts.join('&');
        
        window.location.href = url;
    },

    // Share content using Web Share API or copy link
    async shareContent(title, text, url) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return { success: true, method: 'share' };
            } catch(e) {
                // User cancelled
                return { success: false, method: 'share' };
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                return { success: true, method: 'copy' };
            } catch(e) {
                return { success: false, method: 'none' };
            }
        }
    },

    // Update active navigation item
    updateActiveNav() {
        const navItems = document.querySelectorAll('.nav-item, .bottom-nav .nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href') || '';
            const onclick = item.getAttribute('onclick') || '';
            
            if (this.currentRoute === 'home' && (href.includes('home') || onclick.includes('home'))) {
                item.classList.add('active');
            } else if (this.currentRoute === 'search' && (href.includes('search') || onclick.includes('search'))) {
                item.classList.add('active');
            } else if (this.currentRoute === 'cart' && (href.includes('cart') || onclick.includes('cart'))) {
                item.classList.add('active');
            } else if (this.currentRoute === 'orders' && (href.includes('orders') || onclick.includes('orders'))) {
                item.classList.add('active');
            } else if (this.currentRoute === 'profile' && (href.includes('profile') || onclick.includes('profile'))) {
                item.classList.add('active');
            }
        });
    },

    // Get current page title based on route
    getPageTitle() {
        const titles = {
            'home': 'Stoliy - Marketplace',
            'search': 'Search - Stoliy',
            'cart': 'Cart - Stoliy',
            'checkout': 'Checkout - Stoliy',
            'profile': 'Profile - Stoliy',
            'orders': 'Orders - Stoliy',
            'wishlist': 'Wishlist - Stoliy',
            'notifications': 'Notifications - Stoliy',
            'chat': 'Messages - Stoliy',
            'my-tickets': 'My Tickets - Stoliy',
            'addresses': 'Addresses - Stoliy',
            'dashboard': 'Seller Dashboard - Stoliy',
            'wizard': 'Store Setup - Stoliy',
            'store': 'Store - Stoliy',
            'product': 'Product - Stoliy',
            'event': 'Event - Stoliy',
            'events': 'Events - Stoliy',
            'flashsale': 'Flash Sale - Stoliy'
        };
        return titles[this.currentRoute] || 'Stoliy';
    }
};

// Initialize router on page load
document.addEventListener('DOMContentLoaded', function() {
    StoliyRouter.init();
    
    // Update page title
    document.title = StoliyRouter.getPageTitle();
    
    // Auto-apply coupon from URL on checkout page
    const coupon = StoliyRouter.getCouponCode();
    if (coupon && window.location.href.includes('checkout.html')) {
        setTimeout(function() {
            const discountInput = document.getElementById('discountCode');
            if (discountInput) {
                discountInput.value = coupon;
                sessionStorage.removeItem('stoliy_coupon');
            }
        }, 1000);
    }
});

// Handle browser back/forward
window.addEventListener('popstate', function() {
    StoliyRouter.parseRoute();
    StoliyRouter.updateActiveNav();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoliyRouter;
}
