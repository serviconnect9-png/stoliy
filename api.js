// ============================================
// STOLIY - API & BACKEND INTEGRATION
// ============================================

class API {
    constructor() {
        this.baseUrl = CONFIG.backendUrl;
        this.flutterwaveKey = CONFIG.flutterwaveKey;
    }

    // Initialize Flutterwave payment
    async initializePayment(paymentData) {
        try {
            const response = await fetch(`${this.baseUrl}/initialize-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: paymentData.amount,
                    currency: paymentData.currency || 'USD',
                    email: paymentData.email,
                    name: paymentData.name,
                    phone: paymentData.phone,
                    orderId: paymentData.orderId,
                    userId: paymentData.userId,
                    tx_ref: `STL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                return data;
            } else {
                throw new Error(data.message || 'Payment initialization failed');
            }
        } catch (error) {
            console.error('Payment initialization error:', error);
            throw error;
        }
    }

    // Verify payment
    async verifyPayment(transactionId) {
        try {
            const response = await fetch(`${this.baseUrl}/verify-payment/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
        }
    }

    // Create order after payment verification
    async createOrder(orderData) {
        try {
            const orderRef = await db.collection('orders').add({
                ...orderData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'processing',
                orderNumber: utils.generateId('ORD')
            });

            // Add to user's orders
            await db.collection('users').doc(orderData.userId).update({
                orders: firebase.firestore.FieldValue.arrayUnion(orderRef.id)
            });

            // Notify seller
            await this.notifySeller(orderData.storeId, orderRef.id);

            // Clear cart items
            await this.clearCartItems(orderData.userId, orderData.storeId);

            return orderRef.id;
        } catch (error) {
            console.error('Order creation error:', error);
            throw error;
        }
    }

    // Notify seller of new order
    async notifySeller(storeId, orderId) {
        try {
            const storeDoc = await db.collection('stores').doc(storeId).get();
            const storeData = storeDoc.data();
            
            if (storeData && storeData.ownerId) {
                await db.collection('notifications').add({
                    userId: storeData.ownerId,
                    type: 'new_order',
                    orderId: orderId,
                    message: 'You have a new order!',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Seller notification error:', error);
        }
    }

    // Clear cart items after successful order
    async clearCartItems(userId, storeId) {
        try {
            const cartSnapshot = await db.collection('cart')
                .where('userId', '==', userId)
                .where('storeId', '==', storeId)
                .get();

            const batch = db.batch();
            cartSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('Clear cart error:', error);
        }
    }

    // Process refund
    async processRefund(orderId, reason) {
        try {
            const response = await fetch(`${this.baseUrl}/process-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: orderId,
                    reason: reason
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // Update order status
                await db.collection('orders').doc(orderId).update({
                    status: 'refunded',
                    refundReason: reason,
                    refundedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return data;
            } else {
                throw new Error(data.message || 'Refund failed');
            }
        } catch (error) {
            console.error('Refund error:', error);
            throw error;
        }
    }

    // Get exchange rates
    async getExchangeRates() {
        return await utils.fetchExchangeRates();
    }

    // Validate discount code
    async validateDiscountCode(code, storeId, cartTotal) {
        try {
            const discountDoc = await db.collection('discountCodes')
                .where('code', '==', code.toUpperCase())
                .where('storeId', '==', storeId)
                .where('active', '==', true)
                .get();

            if (discountDoc.empty) {
                throw new Error('Invalid discount code');
            }

            const discount = discountDoc.docs[0].data();
            const now = new Date();

            // Check validity period
            if (discount.validFrom && discount.validFrom.toDate() > now) {
                throw new Error('Discount code is not yet active');
            }

            if (discount.validUntil && discount.validUntil.toDate() < now) {
                throw new Error('Discount code has expired');
            }

            // Check minimum purchase
            if (discount.minimumPurchase && cartTotal < discount.minimumPurchase) {
                throw new Error(`Minimum purchase of ${utils.formatCurrency(discount.minimumPurchase)} required`);
            }

            // Check usage limit
            if (discount.maxUses && discount.currentUses >= discount.maxUses) {
                throw new Error('Discount code usage limit reached');
            }

            // Calculate discount amount
            let discountAmount = 0;
            if (discount.type === 'percentage') {
                discountAmount = (cartTotal * discount.value) / 100;
            } else if (discount.type === 'fixed') {
                discountAmount = discount.value;
            }

            return {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                discountAmount: Math.min(discountAmount, cartTotal),
                discountId: discountDoc.docs[0].id
            };
        } catch (error) {
            throw error;
        }
    }

    // Apply discount code to order
    async applyDiscountCode(discountId) {
        try {
            await db.collection('discountCodes').doc(discountId).update({
                currentUses: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Apply discount error:', error);
        }
    }

    // Get flash sales for a store
    async getFlashSales(storeId) {
        try {
            const now = new Date();
            const flashSalesSnapshot = await db.collection('flashSales')
                .where('storeId', '==', storeId)
                .where('active', '==', true)
                .where('startDate', '<=', now)
                .where('endDate', '>=', now)
                .get();

            return flashSalesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get flash sales error:', error);
            return [];
        }
    }

    // Submit dispute
    async submitDispute(disputeData) {
        try {
            const disputeRef = await db.collection('disputes').add({
                ...disputeData,
                disputeId: utils.generateId('DSP'),
                status: 'open',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                messages: [{
                    sender: disputeData.userId,
                    message: disputeData.description,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }]
            });

            return disputeRef.id;
        } catch (error) {
            console.error('Submit dispute error:', error);
            throw error;
        }
    }

    // Send message in dispute
    async sendDisputeMessage(disputeId, message, senderId, senderType) {
        try {
            await db.collection('disputes').doc(disputeId).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    sender: senderId,
                    senderType: senderType,
                    message: message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Send dispute message error:', error);
            throw error;
        }
    }

    // Webhook handler for payment verification
    async handlePaymentWebhook(payload) {
        try {
            const response = await fetch(`${this.baseUrl}/webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Webhook error:', error);
            throw error;
        }
    }
}

// Initialize API
const api = new API();