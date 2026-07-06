// ============================================
// STOLIY - ROUTER SYSTEM (Clean URL Support)
// ============================================

const STOLIY_Router = {
currentRoute: null,
currentParams: {},

init() {  
    this.parseRoute();  
    this.handleAffiliateTracking();  
    this.handleCampaignTracking();  
    this.handleCouponCodes();  
    this.redirectToCorrectPage();  
},  

parseRoute() {  
    const path = window.location.pathname;  
    const params = new URLSearchParams(window.location.search);  
      
    // Store query params  
    this.currentParams = {};  
    for (const [key, value] of params.entries()) {  
        this.currentParams[key] = value;  
    }  

    // Detect route from path  
    if (path.startsWith('/store/')) {  
        this.currentRoute = 'store';  
        this.currentParams.slug = path.split('/store/')[1].replace(/\/$/, '');  
    } else if (path.startsWith('/product/')) {  
        this.currentRoute = 'product';  
        this.currentParams.slug = path.split('/product/')[1].replace(/\/$/, '');  
    } else if (path.startsWith('/category/')) {  
        this.currentRoute = 'category';  
        this.currentParams.slug = path.split('/category/')[1].replace(/\/$/, '');  
    } else if (path.includes('store.html')) {  
        this.currentRoute = 'store';  
        this.currentParams.id = params.get('id');  
        this.currentParams.slug = params.get('slug');  
    } else if (path.includes('products.html') || path.includes('product.html')) {  
        this.currentRoute = 'product';  
        this.currentParams.id = params.get('id');  
        this.currentParams.slug = params.get('slug');  
    }  

    console.log('📍 Route detected:', this.currentRoute, this.currentParams);  
},  

redirectToCorrectPage() {  
    const path = window.location.pathname;  
    const htmlFile = window.location.pathname.split('/').pop();  
      
    // If clean URL like /store/slug, redirect to store.html with slug param  
    if (path.startsWith('/store/') && !htmlFile.includes('.html')) {  
        const slug = path.split('/store/')[1].replace(/\/$/, '');  
        console.log('🔄 Redirecting /store/' + slug + ' → store.html?slug=' + slug);  
        window.location.replace('store.html?slug=' + encodeURIComponent(slug));  
        return;  
    }  
      
    if (path.startsWith('/product/') && !htmlFile.includes('.html')) {  
        const slug = path.split('/product/')[1].replace(/\/$/, '');  
        console.log('🔄 Redirecting /product/' + slug + ' → products.html?slug=' + slug);  
        window.location.replace('products.html?slug=' + encodeURIComponent(slug));  
        return;  
    }  
      
    if (path.startsWith('/category/') && !htmlFile.includes('.html')) {  
        const slug = path.split('/category/')[1].replace(/\/$/, '');  
        console.log('🔄 Redirecting /category/' + slug + ' → search.html?category=' + slug);  
        window.location.replace('search.html?category=' + encodeURIComponent(slug));  
        return;  
    }  
},  

handleAffiliateTracking() {  
    const ref = this.currentParams.ref || this.currentParams.affiliate || this.currentParams.aff;  
    if (ref) {  
        const affiliateData = {  
            id: ref,  
            timestamp: Date.now(),  
            expiry: Date.now() + (30 * 24 * 60 * 60 * 1000)  
        };  
        localStorage.setItem('stoliy_affiliate', JSON.stringify(affiliateData));  
        console.log('🔗 Affiliate tracked:', ref);  
    }  
    const stored = localStorage.getItem('stoliy_affiliate');  
    if (stored) {  
        const data = JSON.parse(stored);  
        if (Date.now() > data.expiry) localStorage.removeItem('stoliy_affiliate');  
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
        const data = JSON.parse(stored);  
        if (Date.now() < data.expiry) return data.id;  
        localStorage.removeItem('stoliy_affiliate');  
    }  
    return null;  
},  

getCampaign() { return sessionStorage.getItem('stoliy_campaign') || null; },  
getCouponCode() { return sessionStorage.getItem('stoliy_coupon') || null; },  

getStoreUrl(storeId, storeName) {  
    const slug = (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');  
    const affId = this.getAffiliateId();  
    let url = `${window.location.origin}/store/${slug}`;  
    if (affId) url += '?ref=' + affId;  
    return url;  
},  

getProductUrl(productId, productName) {  
    const slug = (productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');  
    const affId = this.getAffiliateId();  
    let url = `${window.location.origin}/product/${slug}`;  
    if (affId) url += '?ref=' + affId;  
    return url;  
},  

navigateTo(page, params = {}) {  
    const pages = {  
        home: 'home.html', search: 'search.html', cart: 'cart.html',  
        checkout: 'checkout.html', profile: 'profile.html', orders: 'orders.html',  
        wishlist: 'wishlist.html', dashboard: 'store-dashboard.html', wizard: 'wizard.html'  
    };  
    let url = pages[page] || 'home.html';  
    const queryParts = [];  
    for (const key in params) { if (params[key]) queryParts.push(`${key}=${encodeURIComponent(params[key])}`); }  
    const affId = this.getAffiliateId();  
    if (affId && !params.ref) queryParts.push(`ref=${affId}`);  
    if (queryParts.length) url += '?' + queryParts.join('&');  
    window.location.href = url;  
},  

async shareContent(title, url) {  
    if (navigator.share) {  
        try { await navigator.share({ title, url }); return true; } catch(e) { return false; }  
    } else {  
        try { await navigator.clipboard.writeText(url); return 'copied'; } catch(e) { return false; }  
    }  
}

};

// Initialize immediately
document.addEventListener('DOMContentLoaded', function() {
STOLIY_Router.init();

// Auto-apply coupon on checkout  
const coupon = STOLIY_Router.getCouponCode();  
if (coupon && window.location.href.includes('checkout.html')) {  
    setTimeout(function() {  
        const discountInput = document.getElementById('discountCode');  
        if (discountInput) { discountInput.value = coupon; sessionStorage.removeItem('stoliy_coupon'); }  
    }, 1000);  
}

});
