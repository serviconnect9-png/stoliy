// ============================================
// STOLIY - NOTIFICATION HELPER
// Add this script to any page that needs to send notifications
// ============================================

const StoliyNotifications = {
    /**
     * Send a notification to a user
     * @param {string} userId - Recipient user ID
     * @param {string} type - Notification type (order_placed, store_follow, etc.)
     * @param {string} message - Notification message
     * @param {string} link - Optional link to navigate to
     */
    async send(userId, type, message, link) {
        try {
            await db.collection('notifications').add({
                userId: userId,
                type: type,
                message: message,
                link: link || null,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('🔔 Notification sent:', type, 'to', userId);
            return true;
        } catch(e) {
            console.error('Notification error:', e);
            return false;
        }
    },

    // ============ ORDER NOTIFICATIONS ============
    async orderPlaced(userId, orderNumber, storeName) {
        return this.send(userId, 'order_placed', 
            `Your order #${orderNumber} from ${storeName} has been placed successfully!`, 
            'orders.html');
    },
    async orderConfirmed(userId, orderNumber) {
        return this.send(userId, 'order_confirmed', 
            `Order #${orderNumber} has been confirmed and is being processed.`, 
            'orders.html');
    },
    async orderShipped(userId, orderNumber, tracking) {
        return this.send(userId, 'order_shipped', 
            `Order #${orderNumber} has been shipped!${tracking ? ' Tracking: ' + tracking : ''}`, 
            'orders.html');
    },
    async orderDelivered(userId, orderNumber) {
        return this.send(userId, 'order_delivered', 
            `Order #${orderNumber} has been delivered. Enjoy!`, 
            'orders.html');
    },
    async orderCancelled(userId, orderNumber) {
        return this.send(userId, 'order_cancelled', 
            `Order #${orderNumber} has been cancelled.`, 
            'orders.html');
    },
    async paymentReceived(userId, amount, currency) {
        return this.send(userId, 'payment_received', 
            `Payment of ${currency || '$'}${amount} has been received.`, 
            'orders.html');
    },
    async refundProcessed(userId, amount, currency) {
        return this.send(userId, 'refund_processed', 
            `A refund of ${currency || '$'}${amount} has been processed.`, 
            'orders.html');
    },

    // ============ TICKET/EVENT NOTIFICATIONS ============
    async ticketPurchased(userId, eventName, ticketType) {
        return this.send(userId, 'ticket_purchased', 
            `Your ${ticketType} ticket for "${eventName}" is confirmed!`, 
            'my-tickets.html');
    },
    async eventReminder(userId, eventName, daysLeft) {
        return this.send(userId, 'event_reminder', 
            `"${eventName}" is in ${daysLeft} day${daysLeft > 1 ? 's' : ''}! Don't forget.`, 
            'my-tickets.html');
    },
    async eventCheckin(userId, eventName) {
        return this.send(userId, 'event_checkin', 
            `You've been checked in to "${eventName}". Enjoy!`, 
            'my-tickets.html');
    },

    // ============ STORE NOTIFICATIONS ============
    async storeFollow(storeOwnerId, followerName) {
        return this.send(storeOwnerId, 'store_follow', 
            `${followerName} started following your store!`, 
            'followers.html');
    },
    async newProduct(storeOwnerId, productName, storeName) {
        // Send to all followers
        const allUsers = await db.collection('users').get();
        const followers = allUsers.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => (u.following || []).includes(storeId));
        for (const follower of followers) {
            await this.send(follower.id, 'store_new_product', 
                `${storeName} added a new product: "${productName}"`, 
                `products.html?id=${productId}`);
        }
    },
    async flashSale(userId, storeName, discount) {
        return this.send(userId, 'flash_sale', 
            `Flash Sale at ${storeName}! Up to ${discount}% off.`, 
            'home.html');
    },
    async discountAvailable(userId, storeName, code) {
        return this.send(userId, 'discount_available', 
            `New discount at ${storeName}! Use code: ${code}`, 
            'home.html');
    },

    // ============ PRODUCT NOTIFICATIONS ============
    async priceDrop(userId, productName, oldPrice, newPrice) {
        return this.send(userId, 'price_drop', 
            `Price drop! "${productName}" went from $${oldPrice} to $${newPrice}`, 
            `products.html?id=${productId}`);
    },
    async backInStock(userId, productName) {
        return this.send(userId, 'back_in_stock', 
            `"${productName}" is back in stock! Grab it before it's gone.`, 
            `products.html?id=${productId}`);
    },
    async preorderAvailable(userId, productName, releaseDate) {
        return this.send(userId, 'preorder_available', 
            `Pre-orders open for "${productName}"! Releases ${releaseDate}`, 
            `products.html?id=${productId}`);
    },
    async waitlistNotify(userId, productName) {
        return this.send(userId, 'waitlist_notify', 
            `"${productName}" is now available! Complete your purchase.`, 
            `products.html?id=${productId}`);
    },

    // ============ SOCIAL NOTIFICATIONS ============
    async newMessage(userId, senderName, messagePreview) {
        return this.send(userId, 'new_message', 
            `${senderName}: ${messagePreview.substring(0, 50)}...`, 
            'chat.html');
    },
    async reviewReply(userId, storeName) {
        return this.send(userId, 'review_reply', 
            `${storeName} replied to your review.`, 
            'orders.html');
    },

    // ============ TEAM NOTIFICATIONS ============
    async teamInvite(userId, storeName, role) {
        return this.send(userId, 'team_invite', 
            `You've been invited to join ${storeName} as ${role.replace(/_/g, ' ')}`, 
            'team.html');
    },

    // ============ SYSTEM NOTIFICATIONS ============
    async systemAlert(userId, message) {
        return this.send(userId, 'system', message, null);
    }
};

// Auto-send event reminders (call this periodically)
async function sendEventReminders() {
    const allEvents = await db.collection('events').get();
    const allTickets = await db.collection('tickets').get();
    const now = new Date();
    
    allEvents.docs.forEach(async (doc) => {
        const event = doc.data();
        const startDate = new Date(event.startDate);
        const daysLeft = Math.ceil((startDate - now) / 86400000);
        
        if (daysLeft === 7 || daysLeft === 1 || daysLeft === 0) {
            const eventTickets = allTickets.docs.map(d => d.data()).filter(t => t.eventId === doc.id && t.status === 'active');
            for (const ticket of eventTickets) {
                await StoliyNotifications.eventReminder(ticket.userId, event.name, daysLeft);
            }
        }
    });
}

// Run reminders every hour
setInterval(sendEventReminders, 360000);