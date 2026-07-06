// ============================================
// STOLIY ROUTER - Production v2.0
// Handles clean URLs, affiliate tracking, sharing
// ============================================

const STOLIY_Router = {
    currentRoute: null,
    currentParams: {},
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        this.parseRoute();
        this.handleAffiliateTracking();
        this.handleCampaignTracking();
        this.handleCouponCodes();
        this.handleCleanURLRedirect();
        
        console.log('🧭 Router initialized | Route:', this.currentRoute, '| Params:', this.currentParams);
    },

    parseRoute() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        this.currentParams = {};
        for (const [key, value] of params.entries()) {
            this.currentParams[key] = value;
        }

        if (path.startsWith('/store/')) {
            this.currentRoute = 'store';
            this.currentParams.slug = path.split('/store/')[1].replace(/\/$/, '');
        } else if (path.startsWith('/product/')) {
            this.currentRoute = 'product';
            this.currentParams.slug = path.split('/product/')[1].replace(/\/$/, '');
        } else if (path.startsWith('/category/')) {
            this.currentRoute = 'category';
            this.currentParams.slug = path.split('/category/')[1].replace(/\/$/, '');
        } else if (path.startsWith('/event/')) {
            this.currentRoute = 'event';
            this.currentParams.id = path.split('/event/')[1].replace(/\/$/, '');
        } else if (path.includes('store.html')) {
            this.currentRoute = 'store';
            this.currentParams.id = params.get('id');
            this.currentParams.slug = params.get('slug');
        } else if (path.includes('products.html')) {
            this.currentRoute = 'product';
            this.currentParams.id = params.get('id');
            this.currentParams.slug = params.get('slug');
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
        }
    },

    handleCleanURLRedirect() {
        const path = window.location.pathname;
        const htmlFile = path.split('/').pop();

        if (path.startsWith('/store/') && !htmlFile.includes('.html')) {
            const slug = path.split('/store/')[1].replace(/\/$/, '');
            if (slug) {
                console.log('🔄 Redirecting /store/' + slug + ' → store.html?slug=' + slug);
                window.location.replace('/store.html?slug=' + encodeURIComponent(slug));
                return true;
            }
        }
        if (path.startsWith('/product/') && !htmlFile.includes('.html')) {
            const slug = path.split('/product/')[1].replace(/\/$/, '');
            if (slug) {
                console.log('🔄 Redirecting /product/' + slug + ' → products.html?slug=' + slug);
                window.location.replace('/products.html?slug=' + encodeURIComponent(slug));
                return true;
            }
        }
        return false;
    },

    handleAffiliateTracking() {
        const ref = this.currentParams.ref || this.currentParams.affiliate || this.currentParams.aff;
        if (ref) {
            const data = {
                id: ref,
                timestamp: Date.now(),
                expiry: Date.now() + (30 * 24 * 60 * 60 * 1000)
            };
            localStorage.setItem('stoliy_affiliate', JSON.stringify(data));
            console.log('🔗 Affiliate tracked:', ref);
        }
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

    handleCampaignTracking() {
        const campaign = this.currentParams.campaign || this.currentParams.utm_campaign;
        if (campaign) sessionStorage.setItem('stoliy_campaign', campaign);
    },

    handleCouponCodes() {
        const coupon = this.currentParams.coupon || this.currentParams.code;
        if (coupon) sessionStorage.setItem('stoliy_coupon', coupon.toUpperCase());
    },

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

    getCampaign() {
        return sessionStorage.getItem('stoliy_campaign') || null;
    },

    getCouponCode() {
        return sessionStorage.getItem('stoliy_coupon') || null;
    },

    buildShareUrl(type, id, name) {
        const base = window.location.origin;
        const slug = (name || type).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let url = `${base}/${type}/${slug}`;
        
        const affId = this.getAffiliateId();
        const campaign = this.getCampaign();
        const params = [];
        
        if (affId) params.push(`ref=${affId}`);
        if (campaign) params.push(`campaign=${campaign}`);
        
        if (params.length) url += '?' + params.join('&');
        return url;
    },

    navigateTo(page, params = {}) {
        const pages = {
            home: '/home.html',
            search: '/search.html',
            cart: '/cart.html',
            checkout: '/checkout.html',
            profile: '/profile.html',
            orders: '/orders.html',
            wishlist: '/wishlist.html',
            dashboard: '/store-dashboard.html',
            wizard: '/wizard.html',
            flashsale: '/flashsale.html',
            notifications: '/notifications.html',
            chat: '/chat.html',
            addresses: '/addresses.html',
            affiliates: '/affiliates.html',
            tickets: '/my-tickets.html',
            contact: '/contact.html'
        };

        let url = pages[page] || '/home.html';
        const queryParts = [];
        
        for (const key in params) {
            if (params[key]) queryParts.push(`${key}=${encodeURIComponent(params[key])}`);
        }
        
        const affId = this.getAffiliateId();
        if (affId && !params.ref) queryParts.push(`ref=${affId}`);
        
        if (queryParts.length) url += '?' + queryParts.join('&');
        
        window.location.href = url;
    },

    async shareContent(title, text, url) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
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

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => STOLIY_Router.init());
} else {
    STOLIY_Router.init();
}
