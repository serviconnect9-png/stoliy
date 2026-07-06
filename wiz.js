// store-wizard.js - ONESHOPLIFY Store Creation Wizard
// Complete step-by-step store setup with all features

console.log('✅ store-wizard.js loaded');

// =====================
// STORE PLANS
// =====================
const STORE_PLANS = {
    basic: {
        name: 'Basic',
        price: 0,
        products: 50,
        analytics: 'simple',
        chatLimit: 10,
        verifiedBadge: false,
        sponsoredAds: true,
        color: '#4CAF50',
        icon: '🚀',
        features: [
            'Up to 50 products',
            'Simple analytics dashboard',
            'Customer service email only',
            'Followers & limited chat (10/day)',
            'Sponsored products displayed on store'
        ]
    },
    pro: {
        name: 'Pro',
        price: 29,
        products: 501,
        analytics: 'full',
        chatLimit: 100,
        verifiedBadge: false,
        sponsoredAds: true,
        color: '#2196F3',
        icon: '📈',
        recommended: true,
        features: [
            'Up to 501 products',
            'Full analytics dashboard',
            'Customer service ticket, email & phone',
            'Followers & 100 chats/day',
            'Sponsored products displayed on store'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        price: 99,
        products: 'Unlimited',
        analytics: 'enterprise',
        chatLimit: 'Unlimited',
        verifiedBadge: true,
        sponsoredAds: false,
        autoReply: true,
        dailyReports: true,
        color: '#FF9800',
        icon: '👑',
        features: [
            'Unlimited products',
            'Enterprise analytics dashboard',
            'Full support + auto-reply bot',
            'Unlimited chats',
            'Daily reports & notifications',
            '✓ Verified badge on store',
            'No sponsored ads displayed',
            'Auto-reply messages for customers',
            'Priority support'
        ]
    }
};

// =====================
// STORE CREATION STATE
// =====================
let storeWizard = {
    step: 1,
    totalSteps: 7,
    data: {
        storeName: '',
        plan: '',
        storeType: 'individual', // individual or organization
        category: '',
        description: '',
        country: '',
        shippingCountries: [],
        shippingRates: {},
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        industrialUid: '',
        logo: null,
        banner: null,
        productRange: '',
        agreedTerms: false
    }
};

// =====================
// START STORE WIZARD
// =====================
function startStoreWizard() {
    console.log('🏪 Starting store wizard...');
    
    if (!APP.userProfile) {
        showToast('Please login first', 'error');
        navigateTo('auth');
        return;
    }
    
    if (APP.userProfile.hasStore) {
        showToast('You already have a store!', 'info');
        navigateTo('store-dashboard');
        return;
    }
    
    storeWizard.step = 1;
    storeWizard.data = {
        storeName: '',
        plan: '',
        storeType: 'individual',
        category: '',
        description: '',
        country: APP.userProfile.country || '',
        shippingCountries: [],
        shippingRates: {},
        ownerName: APP.userProfile.displayName || '',
        ownerEmail: APP.userProfile.email || '',
        ownerPhone: APP.userProfile.phoneNumber || '',
        industrialUid: '',
        logo: null,
        banner: null,
        productRange: '',
        agreedTerms: false
    };
    
    showWizardStep(1);
}

function showWizardStep(step) {
    storeWizard.step = step;
    
    switch(step) {
        case 1: showStepStoreName(); break;
        case 2: showStepChoosePlan(); break;
        case 3: showStepStoreDetails(); break;
        case 4: showStepBranding(); break;
        case 5: showStepPayment(); break;
        case 6: showStepReview(); break;
        case 7: showStepComplete(); break;
    }
}

// =====================
// STEP 1: STORE NAME
// =====================
function showStepStoreName() {
    showModal(`
        <div style="padding:20px;">
            <!-- Progress Bar -->
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:25px;">
                ${[1,2,3,4,5,6,7].map(i => `
                    <div style="width:${i === storeWizard.step ? '32' : '24'}px;height:4px;border-radius:2px;background:${i <= storeWizard.step ? '#6C3CF0' : '#e0e0e0'};transition:all 0.3s;"></div>
                `).join('')}
            </div>
            
            <div style="text-align:center;margin-bottom:25px;">
                <div style="font-size:40px;margin-bottom:10px;">🏪</div>
                <div style="font-size:12px;color:#6C3CF0;font-weight:600;">Step 1 of 7</div>
                <h3 style="margin:8px 0;font-size:20px;">Name Your Store</h3>
                <p style="color:#666;font-size:13px;">Choose a unique name for your online store</p>
            </div>
            
            <div class="input-group">
                <label>Store Name *</label>
                <input type="text" id="wizard-store-name" class="input-field" 
                       value="${storeWizard.data.storeName}" 
                       placeholder="e.g. Only One Ticket, Mike's Fashion"
                       style="font-size:16px;text-align:center;font-weight:600;">
                <small style="color:#666;text-align:center;display:block;margin-top:5px;">
                    Your store URL will be: <strong style="color:#6C3CF0;" id="store-url-preview">yourstore.oneshoplify.com</strong>
                </small>
            </div>
            
            <div style="background:#f5f5f5;padding:12px;border-radius:8px;margin-top:15px;font-size:12px;color:#666;">
                <p>💡 <strong>Tips for a great store name:</strong></p>
                <p>• Keep it short and memorable</p>
                <p>• Use your brand or business name</p>
                <p>• Avoid special characters</p>
            </div>
            
            <button class="btn-gold btn-full" style="margin-top:20px;padding:14px;font-size:16px;" onclick="validateStep1()">
                Continue →
            </button>
        </div>
    `);
    
    // Live URL preview
    setTimeout(() => {
        const nameInput = document.getElementById('wizard-store-name');
        if (nameInput) {
            nameInput.addEventListener('input', function() {
                const slug = this.value.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
                const preview = document.getElementById('store-url-preview');
                if (preview) {
                    preview.innerHTML = slug ? `<strong style="color:#6C3CF0;">${slug}.oneshoplify.com</strong>` : '<strong style="color:#6C3CF0;">yourstore.oneshoplify.com</strong>';
                }
            });
        }
    }, 300);
}

function validateStep1() {
    const name = document.getElementById('wizard-store-name')?.value?.trim();
    
    if (!name || name.length < 3) {
        showToast('Store name must be at least 3 characters', 'error');
        return;
    }
    
    if (name.length > 50) {
        showToast('Store name must be under 50 characters', 'error');
        return;
    }
    
    storeWizard.data.storeName = name;
    hideModal();
    showWizardStep(2);
}

// =====================
// STEP 2: CHOOSE PLAN
// =====================
function showStepChoosePlan() {
    showModal(`
        <div style="padding:15px;max-height:80vh;overflow-y:auto;">
            <!-- Progress Bar -->
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">
                ${[1,2,3,4,5,6,7].map(i => `
                    <div style="width:${i === storeWizard.step ? '32' : '24'}px;height:4px;border-radius:2px;background:${i <= storeWizard.step ? '#6C3CF0' : '#e0e0e0'};"></div>
                `).join('')}
            </div>
            
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:12px;color:#6C3CF0;font-weight:600;">Step 2 of 7</div>
                <h3 style="margin:8px 0;">Choose Your Plan</h3>
                <p style="color:#666;font-size:13px;">Select the plan that fits your business</p>
            </div>
            
            ${Object.entries(STORE_PLANS).map(([key, plan]) => `
                <div style="background:white;border-radius:14px;padding:20px;margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);border-left:4px solid ${plan.color};${key === 'pro' ? 'border:2px solid #6C3CF0;' : ''}${plan.recommended ? 'position:relative;' : ''}">
                    ${plan.recommended ? '<span style="position:absolute;top:-8px;right:15px;background:#6C3CF0;color:white;padding:4px 12px;border-radius:10px;font-size:10px;font-weight:700;">🔥 RECOMMENDED</span>' : ''}
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                        <span style="font-size:28px;">${plan.icon}</span>
                        <h4 style="margin:0;font-size:18px;">${plan.name}</h4>
                    </div>
                    <div style="font-size:28px;font-weight:800;color:${plan.color};margin:8px 0;">
                        $${plan.price}<span style="font-size:14px;color:#999;">/month</span>
                    </div>
                    <ul style="list-style:none;padding:0;font-size:12px;color:#666;line-height:2.2;margin:10px 0;">
                        ${plan.features.map(f => `<li>✅ ${f}</li>`).join('')}
                    </ul>
                    <button class="${key === 'pro' ? 'btn-gold' : 'btn-outline'} btn-full" style="padding:12px;font-weight:600;margin-top:10px;" 
                            onclick="selectWizardPlan('${key}')">
                        Select ${plan.name}${plan.price > 0 ? ' - $' + plan.price + '/mo' : ' - Free'}
                    </button>
                </div>
            `).join('')}
            
            <button class="btn-outline btn-full" style="margin-top:5px;" onclick="hideModal();showWizardStep(1);">← Back</button>
            
            <p style="text-align:center;margin-top:15px;font-size:11px;color:#999;">
                💳 Cancel anytime • 30-day billing cycle
            </p>
        </div>
    `);
}

function selectWizardPlan(planKey) {
    storeWizard.data.plan = planKey;
    storeWizard.data.planDetails = STORE_PLANS[planKey];
    hideModal();
    showWizardStep(3);
}

// =====================
// STEP 3: STORE DETAILS
// =====================
function showStepStoreDetails() {
    showModal(`
        <div style="padding:20px;max-height:80vh;overflow-y:auto;">
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">
                ${[1,2,3,4,5,6,7].map(i => `
                    <div style="width:${i === storeWizard.step ? '32' : '24'}px;height:4px;border-radius:2px;background:${i <= storeWizard.step ? '#6C3CF0' : '#e0e0e0'};"></div>
                `).join('')}
            </div>
            
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:12px;color:#6C3CF0;">Step 3 of 7</div>
                <h3>Store Details</h3>
            </div>
            
            <div class="input-group">
                <label>Store Type *</label>
                <div style="display:flex;gap:10px;margin-top:5px;">
                    <button onclick="selectStoreType('individual')" id="type-individual"
                            style="flex:1;padding:15px;border:2px solid ${storeWizard.data.storeType === 'individual' ? '#6C3CF0' : '#e0e0e0'};border-radius:12px;background:${storeWizard.data.storeType === 'individual' ? '#F3F0FF' : 'white'};cursor:pointer;text-align:center;transition:all 0.2s;">
                        <div style="font-size:30px;">👤</div>
                        <div style="font-weight:600;font-size:13px;">Individual</div>
                    </button>
                    <button onclick="selectStoreType('organization')" id="type-organization"
                            style="flex:1;padding:15px;border:2px solid ${storeWizard.data.storeType === 'organization' ? '#6C3CF0' : '#e0e0e0'};border-radius:12px;background:${storeWizard.data.storeType === 'organization' ? '#F3F0FF' : 'white'};cursor:pointer;text-align:center;transition:all 0.2s;">
                        <div style="font-size:30px;">🏢</div>
                        <div style="font-weight:600;font-size:13px;">Organization</div>
                    </button>
                </div>
            </div>
            
            <div class="input-group" style="margin-top:15px;">
                <label>Store Category *</label>
                <select id="wizard-category" class="input-field">
                    <option value="">Select category</option>
                    ${(APP.storeCategories || [
                        'Fashion & Clothing', 'Electronics', 'Beauty & Care', 'Home & Garden',
                        'Sports', 'Tickets & Events', 'Digital Products', 'All Purpose'
                    ]).map(cat => `<option value="${cat}" ${storeWizard.data.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
            
            <div class="input-group" style="margin-top:10px;">
                <label>Store Description * (10-500 words)</label>
                <textarea id="wizard-description" class="input-field" rows="4" 
                          placeholder="Describe what your store sells and why customers should shop here...">${storeWizard.data.description}</textarea>
                <small style="color:#666;"><span id="desc-word-count">0</span> words</small>
            </div>
            
            <div class="input-group" style="margin-top:10px;">
                <label>Country *</label>
                <select id="wizard-country" class="input-field">
                    <option value="">Select country</option>
                    ${typeof COUNTRIES !== 'undefined' ? Object.entries(COUNTRIES).sort((a,b) => a[1].name.localeCompare(b[1].name)).map(([code, data]) => 
                        `<option value="${code}" ${storeWizard.data.country === code ? 'selected' : ''}>${data.flag || ''} ${data.name}</option>`
                    ).join('') : ''}
                </select>
            </div>
            
            <div class="input-group" style="margin-top:10px;">
                <label>Product Range *</label>
                <select id="wizard-product-range" class="input-field">
                    <option value="">Select range</option>
                    <option value="1-10">1 - 10 products</option>
                    <option value="10-50">10 - 50 products</option>
                    <option value="50-100">50 - 100 products</option>
                    <option value="100-500">100 - 500 products</option>
                    <option value="500+">500+ products</option>
                </select>
            </div>
            
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button class="btn-outline" style="flex:1;" onclick="hideModal();showWizardStep(2);">← Back</button>
                <button class="btn-gold" style="flex:1;" onclick="validateStep3()">Continue →</button>
            </div>
        </div>
    `);
    
    // Word counter
    setTimeout(() => {
        const descInput = document.getElementById('wizard-description');
        if (descInput) {
            descInput.addEventListener('input', function() {
                const words = this.value.trim().split(/\s+/).filter(w => w.length > 0).length;
                const counter = document.getElementById('desc-word-count');
                if (counter) counter.textContent = words;
            });
        }
    }, 300);
}

function selectStoreType(type) {
    storeWizard.data.storeType = type;
    document.getElementById('type-individual').style.border = type === 'individual' ? '2px solid #6C3CF0' : '2px solid #e0e0e0';
    document.getElementById('type-individual').style.background = type === 'individual' ? '#F3F0FF' : 'white';
    document.getElementById('type-organization').style.border = type === 'organization' ? '2px solid #6C3CF0' : '2px solid #e0e0e0';
    document.getElementById('type-organization').style.background = type === 'organization' ? '#F3F0FF' : 'white';
}

function validateStep3() {
    const category = document.getElementById('wizard-category')?.value;
    const description = document.getElementById('wizard-description')?.value?.trim();
    const country = document.getElementById('wizard-country')?.value;
    const productRange = document.getElementById('wizard-product-range')?.value;
    
    if (!category) { showToast('Please select a category', 'error'); return; }
    if (!description || description.split(/\s+/).filter(w => w.length > 0).length < 10) {
        showToast('Description must be at least 10 words', 'error'); return;
    }
    if (!country) { showToast('Please select your country', 'error'); return; }
    if (!productRange) { showToast('Please select product range', 'error'); return; }
    
    storeWizard.data.category = category;
    storeWizard.data.description = description;
    storeWizard.data.country = country;
    storeWizard.data.productRange = productRange;
    
    hideModal();
    showWizardStep(4);
}

// =====================
// STEP 4: BRANDING
// =====================
function showStepBranding() {
    showModal(`
        <div style="padding:20px;">
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">
                ${[1,2,3,4,5,6,7].map(i => `
                    <div style="width:${i === storeWizard.step ? '32' : '24'}px;height:4px;border-radius:2px;background:${i <= storeWizard.step ? '#6C3CF0' : '#e0e0e0'};"></div>
                `).join('')}
            </div>
            
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:12px;color:#6C3CF0;">Step 4 of 7</div>
                <h3>Store Branding</h3>
                <p style="color:#666;font-size:13px;">Upload your store logo and banner</p>
            </div>
            
            <div class="input-group" style="text-align:center;">
                <label>Store Logo</label>
                <div id="wizard-logo-preview" style="width:100px;height:100px;border-radius:50%;background:#f0f0f0;margin:10px auto;display:flex;align-items:center;justify-content:center;font-size:30px;color:#999;border:2px dashed #ccc;overflow:hidden;">
                    ${storeWizard.data.logo ? `<img src="${storeWizard.data.logo}" style="width:100%;height:100%;object-fit:cover;">` : '📷'}
                </div>
                <input type="file" id="wizard-logo-upload" class="input-field" accept="image/*" onchange="previewWizardLogo()">
                <small>500x500px recommended</small>
            </div>
            
            <div class="input-group" style="margin-top:15px;text-align:center;">
                <label>Store Banner</label>
                <div id="wizard-banner-preview" style="width:100%;height:100px;background:#f0f0f0;border-radius:8px;margin:10px 0;display:flex;align-items:center;justify-content:center;color:#999;border:2px dashed #ccc;overflow:hidden;">
                    ${storeWizard.data.banner ? `<img src="${storeWizard.data.banner}" style="width:100%;height:100%;object-fit:cover;">` : '📷 Banner'}
                </div>
                <input type="file" id="wizard-banner-upload" class="input-field" accept="image/*" onchange="previewWizardBanner()">
                <small>1200x400px recommended</small>
            </div>
            
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button class="btn-outline" style="flex:1;" onclick="hideModal();showWizardStep(3);">← Back</button>
                <button class="btn-gold" style="flex:1;" onclick="validateStep4()">Continue →</button>
            </div>
        </div>
    `);
}

function previewWizardLogo() {
    const file = document.getElementById('wizard-logo-upload')?.files?.[0];
    if (!file) return;
    storeWizard.data.logoFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        storeWizard.data.logo = e.target.result;
        document.getElementById('wizard-logo-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
}

function previewWizardBanner() {
    const file = document.getElementById('wizard-banner-upload')?.files?.[0];
    if (!file) return;
    storeWizard.data.bannerFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        storeWizard.data.banner = e.target.result;
        document.getElementById('wizard-banner-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
}

function validateStep4() {
    hideModal();
    showWizardStep(5);
}

// =====================
// STEP 5: PAYMENT GATEWAY
// =====================
function showStepPayment() {
    const plan = storeWizard.data.planDetails || STORE_PLANS.basic;
    
    showModal(`
        <div style="padding:20px;">
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">
                ${[1,2,3,4,5,6,7].map(i => `
                    <div style="width:${i === storeWizard.step ? '32' : '24'}px;height:4px;border-radius:2px;background:${i <= storeWizard.step ? '#6C3CF0' : '#e0e0e0'};"></div>
                `).join('')}
            </div>
            
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:12px;color:#6C3CF0;">Step 5 of 7</div>
                <h3>Payment Method</h3>
                <p style="color:#666;font-size:13px;">Connect your payment gateway</p>
            </div>
            
            <div style="background:#f5f5f5;padding:20px;border-radius:12px;margin-bottom:15px;text-align:center;">
                <div style="font-size:40px;margin-bottom:10px;">💰</div>
                <h4>OneShoplify Wallet</h4>
                <p style="color:#666;font-size:13px;">Receive payouts directly to your wallet</p>
                <p style="color:var(--green);font-size:12px;">✅ Fast settlement • Secure • No extra fees</p>
            </div>
            
            <div class="input-group" style="margin-top:15px;">
                <label>Industrial UID (from OneShoplify Wallet)</label>
                <input type="text" id="wizard-industrial-uid" class="input-field" 
                       value="${storeWizard.data.industrialUid}" 
                       placeholder="Enter your industrial UID">
                <small style="color:#666;">
                    Get it from: OneShoplify Wallet → Profile → Store & Gateway → Generate Industrial UID
                </small>
            </div>
            
            <p style="text-align:center;color:#666;font-size:13px;margin:15px 0;">You can add this later</p>
            
            <div style="display:flex;gap:10px;">
                <button class="btn-outline" style="flex:1;" onclick="hideModal();showWizardStep(4);">← Back</button>
                <button class="btn-gold" style="flex:1;" onclick="validateStep5()">Continue →</button>
            </div>
            <button class="btn-outline btn-full" style="margin-top:8px;" onclick="skipPaymentGateway()">Skip for Now</button>
        </div>
    `);
}

function skipPaymentGateway() {
    storeWizard.data.industrialUid = '';
    hideModal();
    showWizardStep(6);
}

function validateStep5() {
    const uid = document.getElementById('wizard-industrial-uid')?.value?.trim();
    storeWizard.data.industrialUid = uid || '';
    hideModal();
    showWizardStep(6);
}

// =====================
// STEP 6: REVIEW & PAY
// =====================
function showStepReview() {
    const plan = storeWizard.data.planDetails || STORE_PLANS.basic;
    const storeNameSlug = storeWizard.data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
    
    showModal(`
        <div style="padding:20px;max-height:80vh;overflow-y:auto;">
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">
                ${[1,2,3,4,5,6,7].map(i => `
                    <div style="width:${i === storeWizard.step ? '32' : '24'}px;height:4px;border-radius:2px;background:${i <= storeWizard.step ? '#6C3CF0' : '#e0e0e0'};"></div>
                `).join('')}
            </div>
            
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:12px;color:#6C3CF0;">Step 6 of 7</div>
                <h3>Review Your Store</h3>
            </div>
            
            <!-- Store Preview Card -->
            <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);margin-bottom:15px;">
                <div style="height:80px;background:linear-gradient(135deg,#6C3CF0,#4F46E5);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">
                    ${storeWizard.data.banner ? `<img src="${storeWizard.data.banner}" style="width:100%;height:100%;object-fit:cover;">` : 'Store Banner'}
                </div>
                <div style="padding:15px;text-align:center;">
                    ${storeWizard.data.logo ? `<img src="${storeWizard.data.logo}" style="width:50px;height:50px;border-radius:50%;margin-top:-35px;border:3px solid white;">` : ''}
                    <h4 style="margin:5px 0;">${storeWizard.data.storeName}</h4>
                    <p style="color:#666;font-size:12px;">${storeWizard.data.description?.substring(0, 80)}...</p>
                </div>
            </div>
            
            <!-- Details Card -->
            <div style="background:#f5f5f5;padding:15px;border-radius:12px;margin-bottom:15px;">
                <p><strong>📋 Store Details:</strong></p>
                <p style="font-size:13px;">• Plan: <strong style="color:#6C3CF0;">${plan.name}</strong></p>
                <p style="font-size:13px;">• Price: <strong>$${plan.price}/month</strong></p>
                <p style="font-size:13px;">• Type: ${storeWizard.data.storeType === 'individual' ? '👤 Individual' : '🏢 Organization'}</p>
                <p style="font-size:13px;">• Category: ${storeWizard.data.category}</p>
                <p style="font-size:13px;">• Country: ${storeWizard.data.country}</p>
                <p style="font-size:13px;">• Products: ${storeWizard.data.productRange}</p>
                <p style="font-size:13px;">• URL: <strong style="color:#6C3CF0;">${storeNameSlug}.oneshoplify.com</strong></p>
            </div>
            
            <!-- Terms -->
            <label style="display:flex;align-items:start;gap:8px;cursor:pointer;margin-bottom:15px;font-size:13px;">
                <input type="checkbox" id="wizard-agree-terms" style="width:18px;height:18px;margin-top:2px;">
                <span>I confirm I will fulfill orders and agree to the <span style="color:#6C3CF0;">Terms & Conditions</span></span>
            </label>
            
            <p style="font-size:13px;color:#666;margin-bottom:15px;">
                Your Balance: <strong>${formatCurrency(APP.userProfile?.walletBalance || 0)}</strong>
            </p>
            
            ${plan.price > 0 && (APP.userProfile?.walletBalance || 0) >= plan.price ? `
                <button class="btn-gold btn-full" style="padding:14px;font-size:16px;" onclick="processStorePayment()">
                    💳 Pay $${plan.price} - Create My Store
                </button>
            ` : plan.price === 0 ? `
                <button class="btn-gold btn-full" style="padding:14px;font-size:16px;" onclick="processStorePayment()">
                    🎉 Create My Free Store
                </button>
            ` : `
                <p style="color:#f44;text-align:center;">Insufficient balance. Need $${plan.price}.</p>
                <button class="btn-gold btn-full" onclick="hideModal();navigateTo('wallet');">💰 Deposit Funds</button>
            `}
            
            <button class="btn-outline btn-full" style="margin-top:8px;" onclick="hideModal();showWizardStep(5);">← Back</button>
        </div>
    `);
}

// =====================
// PROCESS STORE PAYMENT
// =====================
async function processStorePayment() {
    const agreed = document.getElementById('wizard-agree-terms')?.checked;
    if (!agreed) {
        showToast('Please agree to the terms and conditions', 'error');
        return;
    }
    
    const plan = storeWizard.data.planDetails || STORE_PLANS.basic;
    
    if (plan.price > 0 && (APP.userProfile?.walletBalance || 0) < plan.price) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    hideModal();
    showLoader();
    
    try {
        // Upload images if selected
        let logoUrl = '';
        let bannerUrl = '';
        
        if (storeWizard.data.logoFile) {
            try { logoUrl = await uploadToCloudinary(storeWizard.data.logoFile); } catch(e) {}
        }
        if (storeWizard.data.bannerFile) {
            try { bannerUrl = await uploadToCloudinary(storeWizard.data.bannerFile); } catch(e) {}
        }
        
        const storeNameSlug = storeWizard.data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
        
        // Deduct payment if not free
        if (plan.price > 0) {
            await db.collection('users').doc(APP.userProfile.uid).update({
                walletBalance: firebase.firestore.FieldValue.increment(-plan.price)
            });
            APP.userProfile.walletBalance -= plan.price;
        }
        
        // Update user profile
        await db.collection('users').doc(APP.userProfile.uid).update({
            hasStore: true,
            storeName: storeWizard.data.storeName,
            storePlan: storeWizard.data.plan,
            storeType: storeWizard.data.storeType,
            storeUrl: `${storeNameSlug}.oneshoplify.com`,
            storeLogo: logoUrl,
            storeBanner: bannerUrl,
            storeDescription: storeWizard.data.description,
            storeCategory: storeWizard.data.category,
            storeCountry: storeWizard.data.country,
            storeProductRange: storeWizard.data.productRange,
            storeIndustrialUid: storeWizard.data.industrialUid,
            storeFollowers: 0,
            storeTotalSales: 0,
            storeVerified: plan.verifiedBadge || false
        });
        
        APP.userProfile.hasStore = true;
        APP.userProfile.storeName = storeWizard.data.storeName;
        APP.userProfile.storePlan = storeWizard.data.plan;
        APP.userProfile.storeUrl = `${storeNameSlug}.oneshoplify.com`;
        
        // Create store document
        await db.collection('stores').add({
            ownerId: APP.userProfile.uid,
            storeName: storeWizard.data.storeName,
            storePlan: storeWizard.data.plan,
            storeType: storeWizard.data.storeType,
            storeUrl: `${storeNameSlug}.oneshoplify.com`,
            storeLogo: logoUrl,
            storeBanner: bannerUrl,
            storeDescription: storeWizard.data.description,
            storeCategory: storeWizard.data.category,
            storeCountry: storeWizard.data.country,
            followers: 0,
            totalSales: 0,
            totalRevenue: 0,
            verified: plan.verifiedBadge || false,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Record transaction
        if (plan.price > 0) {
            await db.collection('transactions').add({
                userId: APP.userProfile.uid,
                type: 'store_subscription',
                amount: plan.price,
                currency: 'USD',
                status: 'completed',
                description: `Store creation - ${plan.name} Plan`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        if (typeof createNotification === 'function') {
            await createNotification(APP.userProfile.uid,
                '🎉 Store Created!',
                `Your store "${storeWizard.data.storeName}" is ready! Start adding products.`,
                '🏪', 'store-dashboard');
        }
        
        hideLoader();
        showWizardStep(7);
        
    } catch (error) {
        hideLoader();
        console.error('Store creation error:', error);
        showToast('Failed to create store. Please try again.', 'error');
    }
}

// =====================
// STEP 7: COMPLETE
// =====================
function showStepComplete() {
    const storeNameSlug = storeWizard.data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
    
    showModal(`
        <div style="padding:30px;text-align:center;">
            <div style="font-size:80px;margin-bottom:15px;animation:bounce 0.6s;">🎉</div>
            <h2 style="color:#4CAF50;margin-bottom:5px;">Your Store is Ready!</h2>
            <p style="color:#666;font-size:15px;">${storeWizard.data.storeName}</p>
            
            <div style="background:#f5f5f5;padding:20px;border-radius:12px;margin:20px 0;">
                <p style="font-weight:600;margin-bottom:10px;">🔗 Your Store URL:</p>
                <p style="font-family:monospace;font-size:16px;color:#6C3CF0;word-break:break-all;font-weight:700;">
                    ${storeNameSlug}.oneshoplify.com
                </p>
                <button class="copy-btn" style="margin-top:10px;" onclick="copyToClipboard('https://${storeNameSlug}.oneshoplify.com');showToast('Link copied!','success');">
                    📋 Copy Store Link
                </button>
            </div>
            
            <button class="btn-gold btn-full" style="padding:14px;font-size:16px;margin-top:10px;" onclick="hideModal();navigateTo('store-dashboard');">
                📊 Go to Store Dashboard
            </button>
            
            <button class="btn-outline btn-full" style="padding:12px;margin-top:8px;" onclick="hideModal();">
                ✕ Close
            </button>
        </div>
    `);
}

// =====================
// GLOBAL ACCESS
// =====================
window.startStoreWizard = startStoreWizard;
window.startStoreCreation = startStoreWizard;
window.startStoreCreationFlow = startStoreWizard;
window.STORE_PLANS = STORE_PLANS;

console.log('✅ store-wizard.js loaded - Complete store creation wizard ready');