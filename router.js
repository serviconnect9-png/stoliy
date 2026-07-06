// ============================================
// STOLIY - ROUTER SYSTEM
// ============================================

const STOLIY_Router = {
    // Current route info
    currentRoute: null,
    currentParams: {},
    
    // Initialize router
    init() {
        this.parseRoute();
        this.handleAffiliateTracking();
        this.handleCampaignTracking();
        this.handleCouponCodes();
    },

    // Parse current URL
    parseRoute() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        // Store all query params
        this.currentParams = {};
        for (const [key, value] of params.entries()) {
            this.currentParams[key] = value;
        }

        // Determine route type
        if (path.includes('/store/')) {
            this.currentRoute = 'store';
            this.currentParams.slug = path.split('/store/')[1];
        } else if (path.includes('/product/')) {
            this.currentRoute = 'product';
            this.currentParams.slug = path.split('/product/')[1];
        } else if (path.includes('/category/')) {
            this.currentRoute = 'category';
            this.currentParams.slug = path.split('/category/')[1];
        } else if (path.includes('store.html')) {
            this.currentRoute = 'store';
            this.currentParams.id = params.get('id');
        } else if (path.includes('products.html')) {
            this.currentRoute = 'product';
            this.currentParams.id = params.get('id');
        } else if (path.includes('home.html') || path === '/' || path === '') {
            this.currentRoute = 'home';
        } else if (path.includes('search.html')) {
            this.currentRoute = 'search';
            this.currentParams.category = params.get('category');
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
        } else if (path.includes('store-dashboard.html')) {
            this.currentRoute = 'dashboard';
        } else if (path.includes('wizard.html')) {
            this.currentRoute = 'wizard';
        } else if (path.includes('flashsale.html')) {
            this.currentRoute = 'flashsale';
        }

        console.log('📍 Route:', this.currentRoute, this.currentParams);
    },

    // Handle affiliate tracking
    handleAffiliateTracking() {
        const ref = this.currentParams.ref || this.currentParams.affiliate || this.currentParams.aff;
        
        if (ref) {
            // Store affiliate ID in localStorage with 30-day expiry
            const affiliateData = {
                id: ref,
                timestamp: Date.now(),
                expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
            };
            localStorage.setItem('stoliy_affiliate', JSON.stringify(affiliateData));
            console.log('🔗 Affiliate tracked:', ref);
        }

        // Check for existing affiliate cookie
        const stored = localStorage.getItem('stoliy_affiliate');
        if (stored) {
            const data = JSON.parse(stored);
            if (Date.now() > data.expiry) {
                localStorage.removeItem('stoliy_affiliate');
            }
        }
    },

    // Handle campaign tracking
    handleCampaignTracking() {
        const campaign = this.currentParams.campaign || this.currentParams.utm_campaign;
        
        if (campaign) {
            sessionStorage.setItem('stoliy_campaign', campaign);
            console.log('📢 Campaign tracked:', campaign);
        }
    },

    // Handle coupon codes from URL
    handleCouponCodes() {
        const coupon = this.currentParams.coupon || this.currentParams.code;
        
        if (coupon) {
            sessionStorage.setItem('stoliy_coupon', coupon.toUpperCase());
            console.log('🎫 Coupon from URL:', coupon);
        }
    },

    // Get affiliate ID for order attribution
    getAffiliateId() {
        const stored = localStorage.getItem('stoliy_affiliate');
        if (stored) {
            const data = JSON.parse(stored);
            if (Date.now() < data.expiry) {
                return data.id;
            }
            localStorage.removeItem('stoliy_affiliate');
        }
        return null;
    },

    // Get campaign for order attribution
    getCampaign() {
        return sessionStorage.getItem('stoliy_campaign') || null;
    },

    // Get coupon code
    getCouponCode() {
        return sessionStorage.getItem('stoliy_coupon') || null;
    },

    // Generate store URL
    getStoreUrl(storeId, storeSlug, storeName) {
        const slug = storeSlug || (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const base = window.location.origin;
        
        // Append affiliate if exists
        const affId = this.getAffiliateId();
        const campaign = this.getCampaign();
        
        let url = `${base}/store/${slug}`;
        const params = [];
        if (affId) params.push(`ref=${affId}`);
        if (campaign) params.push(`campaign=${campaign}`);
        if (params.length) url += '?' + params.join('&');
        
        return url;
    },

    // Generate product URL
    getProductUrl(productId, productSlug, productName) {
        const slug = productSlug || (productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const base = window.location.origin;
        
        const affId = this.getAffiliateId();
        const campaign = this.getCampaign();
        
        let url = `${base}/product/${slug}`;
        const params = [];
        if (affId) params.push(`ref=${affId}`);
        if (campaign) params.push(`campaign=${campaign}`);
        if (params.length) url += '?' + params.join('&');
        
        return url;
    },

    // Generate share URL
    getShareUrl(type, id, name) {
        if (type === 'store') return this.getStoreUrl(id, null, name);
        if (type === 'product') return this.getProductUrl(id, null, name);
        return window.location.href;
    },

    // Navigate to route
    navigateTo(route, params = {}) {
        const pages = {
            home: 'home.html',
            search: 'search.html',
            cart: 'cart.html',
            checkout: 'checkout.html',
            profile: 'profile.html',
            orders: 'orders.html',
            wishlist: 'wishlist.html',
            dashboard: 'store-dashboard.html',
            wizard: 'wizard.html',
            flashsale: 'flashsale.html',
            addresses: 'addresses.html',
            notifications: 'notifications.html',
            chat: 'chat.html'
        };

        let url = pages[route] || 'home.html';
        
        // Build query string
        const queryParts = [];
        for (const key in params) {
            if (params[key]) queryParts.push(`${key}=${encodeURIComponent(params[key])}`);
        }
        
        // Add affiliate if exists
        const affId = this.getAffiliateId();
        if (affId && !params.ref) queryParts.push(`ref=${affId}`);
        
        if (queryParts.length) url += '?' + queryParts.join('&');
        
        window.location.href = url;
    },

    // Share content
    async shareContent(title, url) {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return true;
            } catch(e) {
                return false;
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                return 'copied';
            } catch(e) {
                return false;
            }
        }
    }
};

// Initialize router on page load
document.addEventListener('DOMContentLoaded', function() {
    STOLIY_Router.init();
    
    // Auto-apply coupon from URL
    const coupon = STOLIY_Router.getCouponCode();
    if (coupon && window.location.href.includes('checkout.html')) {
        // Auto-fill discount code on checkout page
        setTimeout(function() {
            const discountInput = document.getElementById('discountCode');
            if (discountInput) {
                discountInput.value = coupon;
                sessionStorage.removeItem('stoliy_coupon');
            }
        }, 1000);
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = STOLIY_Router;
}