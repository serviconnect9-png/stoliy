// ============================================
// STOLIY - HOME PAGE
// ============================================

class HomePage {
    constructor() {
        this.banners = [
            {
                image: 'https://via.placeholder.com/480x180/6C5CE7/FFFFFF?text=Welcome+to+STOLIY',
                link: '#',
                title: 'Welcome to STOLIY'
            },
            {
                image: 'https://via.placeholder.com/480x180/00B894/FFFFFF?text=Flash+Sales',
                link: '#',
                title: 'Flash Sales - Up to 70% Off'
            },
            {
                image: 'https://via.placeholder.com/480x180/FD79A8/FFFFFF?text=New+Arrivals',
                link: '#',
                title: 'New Arrivals'
            }
        ];
        this.currentBanner = 0;
        this.bannerInterval = null;
    }

    async renderHome() {
        const mainContent = document.getElementById('mainContent');
        
        let homeHTML = `
            <div class="home-page">
                <!-- Search Bar -->
                <div class="search-bar" onclick="app.navigateTo('search')">
                    <div class="search-input">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search products, stores..." readonly>
                    </div>
                </div>

                <!-- Banner Carousel -->
                <div class="banner-carousel" id="bannerCarousel">
                    ${this.banners.map((banner, index) => `
                        <img src="${banner.image}" alt="${banner.title}" class="banner-slide" style="display: ${index === 0 ? 'block' : 'none'};">
                    `).join('')}
                    <div class="carousel-dots">
                        ${this.banners.map((_, index) => `
                            <div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                        `).join('')}
                    </div>
                </div>

                <!-- Categories -->
                <div class="section-header">
                    <h3>Categories</h3>
                    <a href="#" class="see-all" onclick="app.navigateTo('search')">See All</a>
                </div>
                <div class="categories-grid" id="homeCategories">
                    ${this.renderCategories()}
                </div>

                <!-- Featured Stores -->
                <div class="section-header">
                    <h3>Featured Stores</h3>
                    <a href="#" class="see-all" onclick="app.navigateTo('search')">See All</a>
                </div>
                <div class="stores-scroll" id="featuredStores">
                    ${this.renderLoadingSkeleton(3)}
                </div>

                <!-- Sponsored Products -->
                <div class="section-header">
                    <h3>Sponsored Products</h3>
                    <a href="#" class="see-all" onclick="app.navigateTo('search')">See All</a>
                </div>
                <div class="products-grid" id="sponsoredProducts" style="padding: 0 16px;">
                    ${this.renderLoadingSkeleton(4)}
                </div>

                <!-- Trending Stores -->
                <div class="section-header">
                    <h3>Trending Stores</h3>
                    <a href="#" class="see-all" onclick="app.navigateTo('search')">See All</a>
                </div>
                <div class="stores-scroll" id="trendingStores">
                    ${this.renderLoadingSkeleton(3)}
                </div>

                <!-- Recommended Stores -->
                <div class="section-header">
                    <h3>Recommended For You</h3>
                </div>
                <div class="stores-scroll" id="recommendedStores">
                    ${this.renderLoadingSkeleton(3)}
                </div>

                <!-- New Stores -->
                <div class="section-header">
                    <h3>New Stores</h3>
                    <a href="#" class="see-all" onclick="app.navigateTo('search')">See All</a>
                </div>
                <div class="stores-scroll" id="newStores">
                    ${this.renderLoadingSkeleton(3)}
                </div>

                <!-- Top Rated Stores -->
                <div class="section-header">
                    <h3>Top Rated</h3>
                </div>
                <div class="stores-scroll" id="topRatedStores">
                    ${this.renderLoadingSkeleton(3)}
                </div>
            </div>
        `;

        mainContent.innerHTML = homeHTML;

        // Start banner carousel
        this.startBannerCarousel();

        // Load dynamic content
        await this.loadDynamicContent();
    }

    renderCategories() {
        return CONFIG.categories.slice(0, 8).map(cat => `
            <div class="category-item" onclick="home.searchCategory('${cat.name}')">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
            </div>
        `).join('');
    }

    renderLoadingSkeleton(count) {
        return Array(count).fill(0).map(() => `
            <div style="background: #F5F6FA; border-radius: 12px; animation: pulse 1.5s infinite;">
                <div style="height: 120px;"></div>
            </div>
        `).join('');
    }

    async loadDynamicContent() {
        try {
            // Load featured stores
            const featuredStores = await storeManager.getFeaturedStores();
            this.renderStoreSection('featuredStores', featuredStores);

            // Load sponsored products
            const sponsoredProducts = await products.getSponsoredProducts();
            this.renderProductSection('sponsoredProducts', sponsoredProducts);

            // Load trending stores
            const trendingStores = await storeManager.getTrendingStores(10);
            this.renderStoreSection('trendingStores', trendingStores);

            // Load new stores
            const newStoresSnapshot = await db.collection('stores')
                .where('active', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const newStores = newStoresSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderStoreSection('newStores', newStores);

            // Load top rated stores
            const topRatedSnapshot = await db.collection('stores')
                .where('active', '==', true)
                .orderBy('rating', 'desc')
                .limit(10)
                .get();
            const topRatedStores = topRatedSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderStoreSection('topRatedStores', topRatedStores);

            // Load recommended stores (based on user preferences or random)
            const recommendedStores = this.shuffleArray([...trendingStores, ...newStores]).slice(0, 10);
            this.renderStoreSection('recommendedStores', recommendedStores);

        } catch (error) {
            console.error('Load dynamic content error:', error);
        }
    }

    renderStoreSection(containerId, stores) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (stores.length === 0) {
            container.innerHTML = `
                <div style="min-width: 200px; text-align: center; padding: 20px; color: #B2BEC3;">
                    <i class="fas fa-store-slash"></i>
                    <p>No stores found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = stores.map(store => `
            <div class="store-card" onclick="storeManager.renderStorePage('${store.id}')">
                <img src="${store.logo || 'https://via.placeholder.com/60'}" alt="${store.name}" class="store-logo">
                <div class="store-name">${store.name}</div>
                <div class="store-rating">
                    ${store.rating ? '★'.repeat(Math.floor(store.rating)) : ''} 
                    ${store.rating ? store.rating.toFixed(1) : 'New'}
                </div>
                ${store.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                <div style="font-size: 11px; color: #636E72; margin-top: 4px;">
                    ${store.totalProducts || 0} products
                </div>
            </div>
        `).join('');
    }

    renderProductSection(containerId, productsList) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (productsList.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-box-open"></i>
                    <h3>No products yet</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = productsList.map(product => 
            storeManager.renderProductCard(product)
        ).join('');
    }

    startBannerCarousel() {
        if (this.bannerInterval) {
            clearInterval(this.bannerInterval);
        }

        this.bannerInterval = setInterval(() => {
            this.nextBanner();
        }, 3000);

        // Add click handlers to dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToBanner(index);
            });
        });
    }

    nextBanner() {
        this.currentBanner = (this.currentBanner + 1) % this.banners.length;
        this.updateBannerDisplay();
    }

    goToBanner(index) {
        this.currentBanner = index;
        this.updateBannerDisplay();
        this.resetBannerInterval();
    }

    updateBannerDisplay() {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.dot');

        slides.forEach((slide, index) => {
            slide.style.display = index === this.currentBanner ? 'block' : 'none';
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentBanner);
        });
    }

    resetBannerInterval() {
        if (this.bannerInterval) {
            clearInterval(this.bannerInterval);
        }
        this.startBannerCarousel();
    }

    searchCategory(category) {
        app.navigateTo('search');
        
        // Set the category filter after navigation
        setTimeout(() => {
            const filterCategory = document.getElementById('filterCategory');
            if (filterCategory) {
                filterCategory.value = category;
                app.performSearch();
            }
        }, 100);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize home page
const home = new HomePage();