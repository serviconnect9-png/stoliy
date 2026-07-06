// ============================================
// STOLIY - UTILITY FUNCTIONS
// ============================================

class Utils {
    constructor() {
        this.exchangeRates = {};
        this.userCurrency = 'USD';
        this.currencySymbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'NGN': '₦',
            'GHS': 'GH₵',
            'KES': 'KSh',
            'ZAR': 'R',
            'INR': '₹',
            'BRL': 'R$',
            'CAD': 'C$',
            'AUD': 'A$'
        };
    }

    // Generate unique ID
    generateId(prefix = 'STL') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `${prefix}-${timestamp}${random}`;
    }

    // Format currency
    formatCurrency(amount, currency = this.userCurrency) {
        const symbol = this.currencySymbols[currency] || currency;
        return `${symbol}${this.formatNumber(amount)}`;
    }

    // Format number with commas
    formatNumber(num) {
        return Number(num).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Convert price based on exchange rate
    convertPrice(amountInUSD, targetCurrency = this.userCurrency) {
        if (targetCurrency === 'USD') return amountInUSD;
        const rate = this.exchangeRates[targetCurrency] || 1;
        return amountInUSD * rate;
    }

    // Fetch exchange rates
    async fetchExchangeRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            this.exchangeRates = data.rates;
            
            // Store in session
            sessionStorage.setItem('exchangeRates', JSON.stringify(data.rates));
            sessionStorage.setItem('ratesTimestamp', Date.now());
            
            return data.rates;
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            // Try to use cached rates
            const cached = sessionStorage.getItem('exchangeRates');
            if (cached) {
                this.exchangeRates = JSON.parse(cached);
            }
            return this.exchangeRates;
        }
    }

    // Detect user's country
    async detectCountry() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                country: data.country_name,
                countryCode: data.country_code,
                currency: data.currency,
                city: data.city
            };
        } catch (error) {
            console.error('Failed to detect country:', error);
            return {
                country: 'United States',
                countryCode: 'US',
                currency: 'USD',
                city: 'New York'
            };
        }
    }

    // Toast notification
    showToast(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Show loading spinner
    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    // Show empty state
    showEmptyState(container, message, icon = 'fa-inbox', subtext = '') {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas ${icon}"></i>
                <h3>${message}</h3>
                ${subtext ? `<p>${subtext}</p>` : ''}
            </div>
        `;
    }

    // Format date
    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Calculate discount percentage
    calculateDiscount(originalPrice, salePrice) {
        if (!originalPrice || !salePrice) return 0;
        const discount = ((originalPrice - salePrice) / originalPrice) * 100;
        return Math.round(discount);
    }

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate phone number
    validatePhone(phone) {
        const re = /^\+?[\d\s-]{10,}$/;
        return re.test(phone);
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Truncate text
    truncateText(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Generate random color
    randomColor() {
        const colors = ['#6C5CE7', '#00B894', '#FD79A8', '#FDCB6E', '#E17055', '#0984E3', '#00CEC9', '#D63031'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Get file extension
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Check if file is image
    isImage(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        return imageExtensions.includes(this.getFileExtension(filename));
    }

    // Check if file is video
    isVideo(filename) {
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
        return videoExtensions.includes(this.getFileExtension(filename));
    }

    // Upload to Cloudinary
    async uploadToCloudinary(file, folder = 'products') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CONFIG.cloudinaryPreset);
        formData.append('folder', folder);

        try {
            const response = await fetch(CONFIG.cloudinaryUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy', 'error');
        }
    }

    // Check internet connection
    isOnline() {
        return navigator.onLine;
    }

    // Get query parameter
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Set query parameter
    setQueryParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    }

    // Remove query parameter
    removeQueryParam(param) {
        const url = new URL(window.location);
        url.searchParams.delete(param);
        window.history.pushState({}, '', url);
    }
}

// Initialize utils
const utils = new Utils();