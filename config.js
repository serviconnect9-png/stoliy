// ============================================
// STOLIY - COMPLETE CONFIGURATION
// ============================================

const CONFIG = {
    appName: "STOLIY",
    version: "1.0.0",
    poweredBy: "Rev",
    baseUrl: "https://stoliy.vercel.app",
    
    // =====================
    // ADMIN & SUPPORT
    // =====================
    adminEmail: "ebubechichukwu8@gmail.com",
    csEmail: "shoplify50@gmail.com",
    
    // =====================
    // WHATSAPP LINKS
    // =====================
    whatsappCommunity: "https://chat.whatsapp.com/DlMbMdASDl6LLnTNMi8T7r",
    whatsappAcademy: "https://chat.whatsapp.com/DlMbMdASDl6LLnTNMi8T7r",
    
    // =====================
    // FIREBASE CONFIGURATION
    // =====================
    firebaseConfig: {
        apiKey: "AIzaSyDRlGps4_dqRBJ2SYmbeXtdDRGTIvYQ510",
        authDomain: "serviconnect-446dd.firebaseapp.com",
        projectId: "serviconnect-446dd",
        storageBucket: "serviconnect-446dd.firebasestorage.app",
        messagingSenderId: "102078290806",
        appId: "1:102078290806:web:88a6e1f9908100a3253857"
    },
    
    // =====================
    // CLOUDINARY CONFIGURATION
    // =====================
    cloudinaryUrl: "https://api.cloudinary.com/v1_1/serviconnect/image/upload",
    cloudinaryPreset: "connect",
    cloudinaryCloudName: "serviconnect",
    
    // =====================
    // BACKEND API ENDPOINTS
    // =====================
    backendUrl: "https://connect-backend--serviconnect9.replit.app",
    depositApiUrl: "https://connect-backend--serviconnect9.replit.app/deposit",
    withdrawApiUrl: "https://connect-backend--serviconnect9.replit.app/withdraw",
    
    // =====================
    // FLUTTERWAVE PAYMENT GATEWAY
    // =====================
    flutterwaveKey: "FLWPUBK-b5d5cb8f23411dc9c84afd34c839c15b-X",
    
    // =====================
    // PRODUCT TYPES
    // =====================
    productTypes: [
        { 
            id: "physical", 
            name: "Physical Product", 
            icon: "fa-solid fa-box", 
            description: "Shipped items with inventory tracking",
            requiresShipping: true,
            requiresInventory: true,
            requiresFiles: false
        },
        { 
            id: "digital", 
            name: "Digital Product", 
            icon: "fa-solid fa-download", 
            description: "Files, software, e-books, music",
            requiresShipping: false,
            requiresInventory: false,
            requiresFiles: true
        },
        { 
            id: "ticket", 
            name: "Ticket/Event", 
            icon: "fa-solid fa-ticket-alt", 
            description: "Events, concerts, workshops, webinars",
            requiresShipping: false,
            requiresInventory: true,
            requiresFiles: false
        },
        { 
            id: "pod", 
            name: "Print on Demand", 
            icon: "fa-solid fa-print", 
            description: "Custom apparel, mugs, posters, phone cases",
            requiresShipping: true,
            requiresInventory: false,
            requiresFiles: false,
            requiresDesign: true
        }
    ],

    // =====================
    // PRINT ON DEMAND PRODUCTS
    // =====================
    podProducts: [
        { name: "T-Shirt", icon: "fa-solid fa-shirt", baseCost: 8.00, category: "Apparel" },
        { name: "Hoodie", icon: "fa-solid fa-user-tie", baseCost: 18.00, category: "Apparel" },
        { name: "Sweatshirt", icon: "fa-solid fa-vest", baseCost: 15.00, category: "Apparel" },
        { name: "Polo Shirt", icon: "fa-solid fa-shirt", baseCost: 12.00, category: "Apparel" },
        { name: "Cap", icon: "fa-solid fa-hat-cowboy", baseCost: 6.00, category: "Accessories" },
        { name: "Mug", icon: "fa-solid fa-mug-hot", baseCost: 5.00, category: "Home" },
        { name: "Tumbler", icon: "fa-solid fa-cup", baseCost: 8.00, category: "Home" },
        { name: "Phone Case", icon: "fa-solid fa-mobile-alt", baseCost: 7.00, category: "Accessories" },
        { name: "Tote Bag", icon: "fa-solid fa-shopping-bag", baseCost: 6.00, category: "Accessories" },
        { name: "Canvas", icon: "fa-solid fa-palette", baseCost: 10.00, category: "Home" },
        { name: "Poster", icon: "fa-solid fa-image", baseCost: 4.00, category: "Home" },
        { name: "Pillow", icon: "fa-solid fa-couch", baseCost: 9.00, category: "Home" },
        { name: "Mouse Pad", icon: "fa-solid fa-mouse", baseCost: 3.00, category: "Accessories" },
        { name: "Notebook", icon: "fa-solid fa-book", baseCost: 5.00, category: "Stationery" },
        { name: "Sticker", icon: "fa-solid fa-sticky-note", baseCost: 1.00, category: "Accessories" },
        { name: "Blanket", icon: "fa-solid fa-blanket", baseCost: 20.00, category: "Home" }
    ],

    // =====================
    // POD COLORS
    // =====================
    podColors: [
        { name: "Black", hex: "#000000" },
        { name: "White", hex: "#FFFFFF" },
        { name: "Red", hex: "#FF4D4F" },
        { name: "Blue", hex: "#3B82F6" },
        { name: "Purple", hex: "#6C3CF0" },
        { name: "Green", hex: "#2ECC71" },
        { name: "Yellow", hex: "#F4B400" },
        { name: "Orange", hex: "#FF9800" },
        { name: "Pink", hex: "#EC4899" },
        { name: "Gray", hex: "#6B7280" },
        { name: "Navy", hex: "#1E3A5F" },
        { name: "Brown", hex: "#795548" }
    ],

    // =====================
    // POD SIZES
    // =====================
    podSizes: [
        "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"
    ],

    // =====================
    // DESIGN FILE FORMATS
    // =====================
    podDesignFormats: [
        { ext: "PNG", description: "Transparent background recommended", icon: "fa-solid fa-file-image" },
        { ext: "SVG", description: "Vector format, scalable", icon: "fa-solid fa-vector-square" },
        { ext: "AI", description: "Adobe Illustrator", icon: "fa-solid fa-file" },
        { ext: "PSD", description: "Adobe Photoshop", icon: "fa-solid fa-file" },
        { ext: "EPS", description: "Encapsulated PostScript", icon: "fa-solid fa-file" },
        { ext: "PDF", description: "Print-ready format", icon: "fa-solid fa-file-pdf" }
    ],

    // =====================
    // DIGITAL PRODUCT FILE FORMATS
    // =====================
    digitalFileFormats: [
        { ext: "ZIP", description: "Compressed archive", icon: "fa-solid fa-file-zipper" },
        { ext: "PDF", description: "Document", icon: "fa-solid fa-file-pdf" },
        { ext: "MP4", description: "Video", icon: "fa-solid fa-file-video" },
        { ext: "MP3", description: "Audio", icon: "fa-solid fa-file-audio" },
        { ext: "EPUB", description: "E-Book", icon: "fa-solid fa-book" },
        { ext: "APK", description: "Android App", icon: "fa-solid fa-mobile" },
        { ext: "AI", description: "Adobe Illustrator", icon: "fa-solid fa-file" },
        { ext: "PSD", description: "Photoshop", icon: "fa-solid fa-file" },
        { ext: "Figma", description: "Figma Export", icon: "fa-solid fa-figma" },
        { ext: "EXE", description: "Software Installer", icon: "fa-solid fa-file" },
        { ext: "DMG", description: "Mac Installer", icon: "fa-solid fa-file" }
    ],

    // =====================
    // LICENSE TYPES
    // =====================
    licenseTypes: [
        { id: "personal", name: "Personal License", description: "For personal use only", icon: "fa-solid fa-user" },
        { id: "commercial", name: "Commercial License", description: "For commercial projects", icon: "fa-solid fa-building" },
        { id: "extended", name: "Extended License", description: "Extended commercial rights", icon: "fa-solid fa-globe" },
        { id: "custom", name: "Custom License", description: "Custom terms apply", icon: "fa-solid fa-file-contract" }
    ],

    // =====================
    // EVENT TYPES
    // =====================
    eventTypes: [
        { id: "concert", name: "Concert", icon: "fa-solid fa-music" },
        { id: "conference", name: "Conference", icon: "fa-solid fa-microphone" },
        { id: "workshop", name: "Workshop", icon: "fa-solid fa-chalkboard-teacher" },
        { id: "sports", name: "Sports", icon: "fa-solid fa-futbol" },
        { id: "festival", name: "Festival", icon: "fa-solid fa-umbrella-beach" },
        { id: "webinar", name: "Webinar", icon: "fa-solid fa-laptop" },
        { id: "private", name: "Private Event", icon: "fa-solid fa-lock" },
        { id: "other", name: "Other", icon: "fa-solid fa-calendar" }
    ],

    // =====================
    // PRODUCT CATEGORIES
    // =====================
    categories: [
        { name: "All", icon: "fa-solid fa-border-all" },
        { name: "Fashion", icon: "fa-solid fa-shirt" },
        { name: "Shoes", icon: "fa-solid fa-shoe-prints" },
        { name: "Electronics", icon: "fa-solid fa-laptop" },
        { name: "Watches", icon: "fa-solid fa-clock" },
        { name: "Beauty", icon: "fa-solid fa-spa" },
        { name: "Accessories", icon: "fa-solid fa-glasses" },
        { name: "Home", icon: "fa-solid fa-house" },
        { name: "Sports", icon: "fa-solid fa-futbol" },
        { name: "Toys", icon: "fa-solid fa-puzzle-piece" },
        { name: "Bags", icon: "fa-solid fa-bag-shopping" },
        { name: "Digital Products", icon: "fa-solid fa-download" },
        { name: "Software", icon: "fa-solid fa-code" },
        { name: "E-Books", icon: "fa-solid fa-book" },
        { name: "Courses", icon: "fa-solid fa-graduation-cap" },
        { name: "Tickets & Events", icon: "fa-solid fa-ticket" },
        { name: "Print on Demand", icon: "fa-solid fa-print" },
        { name: "Apparel", icon: "fa-solid fa-tshirt" },
        { name: "Mugs & Drinkware", icon: "fa-solid fa-mug-hot" },
        { name: "Wall Art", icon: "fa-solid fa-palette" }
    ],
    
    // =====================
    // STORE CATEGORIES
    // =====================
    storeCategories: [
        { name: "Fashion & Clothing", icon: "fa-solid fa-shirt" },
        { name: "Electronics & Gadgets", icon: "fa-solid fa-microchip" },
        { name: "Beauty & Personal Care", icon: "fa-solid fa-wand-magic-sparkles" },
        { name: "Home & Garden", icon: "fa-solid fa-house-chimney" },
        { name: "Sports & Outdoors", icon: "fa-solid fa-person-running" },
        { name: "Toys & Games", icon: "fa-solid fa-gamepad" },
        { name: "Books & Stationery", icon: "fa-solid fa-book-open" },
        { name: "Food & Beverages", icon: "fa-solid fa-utensils" },
        { name: "Health & Wellness", icon: "fa-solid fa-heart-pulse" },
        { name: "Automotive", icon: "fa-solid fa-car" },
        { name: "Pet Supplies", icon: "fa-solid fa-paw" },
        { name: "Jewelry & Accessories", icon: "fa-solid fa-gem" },
        { name: "Art & Crafts", icon: "fa-solid fa-palette" },
        { name: "Music & Instruments", icon: "fa-solid fa-music" },
        { name: "Baby & Kids", icon: "fa-solid fa-baby" },
        { name: "Office Supplies", icon: "fa-solid fa-briefcase" },
        { name: "Travel & Luggage", icon: "fa-solid fa-suitcase-rolling" },
        { name: "Tickets & Events", icon: "fa-solid fa-calendar-check" },
        { name: "Digital Products", icon: "fa-solid fa-cloud-arrow-down" },
        { name: "Print on Demand", icon: "fa-solid fa-print" },
        { name: "All Purpose Store", icon: "fa-solid fa-store" }
    ],

    // =====================
    // ORDER STATUSES
    // =====================
    orderStatuses: {
        physical: [
            "pending_payment",
            "paid",
            "processing",
            "ready_to_ship",
            "shipped",
            "delivered",
            "completed",
            "cancelled",
            "refunded"
        ],
        digital: [
            "pending_payment",
            "paid",
            "download_ready",
            "completed",
            "cancelled",
            "refunded"
        ],
        ticket: [
            "pending_payment",
            "paid",
            "ticket_generated",
            "active",
            "used",
            "cancelled",
            "refunded",
            "expired"
        ],
        pod: [
            "pending_payment",
            "paid",
            "awaiting_production",
            "in_production",
            "quality_check",
            "ready_to_ship",
            "shipped",
            "delivered",
            "completed",
            "cancelled",
            "refunded"
        ]
    },

    // =====================
    // POD ORDER STATUSES
    // =====================
    podOrderStatuses: [
        { id: "awaiting_production", label: "Awaiting Production", color: "#F4B400", icon: "fa-solid fa-clock" },
        { id: "in_production", label: "In Production", color: "#3B82F6", icon: "fa-solid fa-industry" },
        { id: "quality_check", label: "Quality Check", color: "#6C3CF0", icon: "fa-solid fa-clipboard-check" },
        { id: "ready_to_ship", label: "Ready to Ship", color: "#2ECC71", icon: "fa-solid fa-box" },
        { id: "shipped", label: "Shipped", color: "#0984E3", icon: "fa-solid fa-truck" },
        { id: "delivered", label: "Delivered", color: "#00B894", icon: "fa-solid fa-check-circle" }
    ],

    // =====================
    // MAINTENANCE FEE (1%)
    // =====================
    maintenanceFeePercentage: 1,

    // =====================
    // EXCHANGE RATE API
    // =====================
    exchangeRateApi: "https://api.exchangerate-api.com/v4/latest/USD"
};

// =====================
// INITIALIZE FIREBASE
// =====================
try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(CONFIG.firebaseConfig);
        console.log('✅ Firebase initialized from config.js');
    }
} catch(e) {
    console.log('Firebase init deferred');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}