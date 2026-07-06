// ============================================
// STOLIY - CUSTOMER SUPPORT SYSTEM
// ============================================

class CustomerSupport {
    constructor() {
        this.currentDispute = null;
        this.disputes = [];
        this.isAgent = false;
    }

    // Initialize customer support
    async init() {
        // Check if user is a support agent
        await this.checkAgentStatus();
    }

    // Check if current user is a support agent
    async checkAgentStatus() {
        if (!app.isAuthenticated) return false;
        
        try {
            const agentDoc = await db.collection('supportAgents').doc(app.currentUser.uid).get();
            this.isAgent = agentDoc.exists && agentDoc.data().active === true;
            return this.isAgent;
        } catch (error) {
            console.error('Check agent status error:', error);
            return false;
        }
    }

    // Render customer support page
    async renderSupportPage() {
        const mainContent = document.getElementById('mainContent');
        
        if (!app.isAuthenticated) {
            app.showAuthModal();
            return;
        }

        utils.showLoading(mainContent);

        // Check if agent
        await this.checkAgentStatus();

        if (this.isAgent) {
            this.renderAgentDashboard();
            return;
        }

        // Regular customer support view
        mainContent.innerHTML = `
            <div class="support-page">
                <div style="padding: 16px;">
                    <button onclick="history.back()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    
                    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Customer Support</h2>
                    <p style="color: #636E72; margin-bottom: 20px;">How can we help you today?</p>
                </div>

                <!-- Quick Actions -->
                <div style="padding: 0 16px 16px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                        <div onclick="cs.renderNewDispute()" style="background: white; padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-plus-circle" style="font-size: 32px; color: #6C5CE7; margin-bottom: 8px;"></i>
                            <div style="font-weight: 700;">New Dispute</div>
                            <div style="font-size: 12px; color: #636E72;">Open a new case</div>
                        </div>
                        
                        <div onclick="cs.renderMyDisputes()" style="background: white; padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-history" style="font-size: 32px; color: #00B894; margin-bottom: 8px;"></i>
                            <div style="font-weight: 700;">My Disputes</div>
                            <div style="font-size: 12px; color: #636E72;">View your cases</div>
                        </div>
                        
                        <div onclick="cs.openFAQs()" style="background: white; padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-question-circle" style="font-size: 32px; color: #FDCB6E; margin-bottom: 8px;"></i>
                            <div style="font-weight: 700;">FAQs</div>
                            <div style="font-size: 12px; color: #636E72;">Common questions</div>
                        </div>
                        
                        <div onclick="cs.openLiveChat()" style="background: white; padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <i class="fas fa-comments" style="font-size: 32px; color: #FD79A8; margin-bottom: 8px;"></i>
                            <div style="font-weight: 700;">Live Chat</div>
                            <div style="font-size: 12px; color: #636E72;">Chat with us</div>
                        </div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div style="padding: 0 16px;">
                    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <h3 style="font-weight: 700; margin-bottom: 16px;">Contact Us</h3>
                        
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; background: #F5F6FA; border-radius: 8px;">
                            <i class="fas fa-envelope" style="color: #6C5CE7; font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Email</div>
                                <a href="mailto:${CONFIG.csEmail}" style="color: #6C5CE7; text-decoration: none;">${CONFIG.csEmail}</a>
                            </div>
                        </div>
                        
                        <div onclick="window.open('${CONFIG.whatsappCommunity}', '_blank')" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; background: #F5F6FA; border-radius: 8px; cursor: pointer;">
                            <i class="fab fa-whatsapp" style="color: #25D366; font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">WhatsApp Community</div>
                                <div style="font-size: 12px; color: #636E72;">Join our community</div>
                            </div>
                            <i class="fas fa-chevron-right" style="margin-left: auto; color: #B2BEC3;"></i>
                        </div>
                        
                        <div onclick="window.open('${CONFIG.whatsappAcademy}', '_blank')" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #F5F6FA; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-graduation-cap" style="color: #6C5CE7; font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">STOLIY Academy</div>
                                <div style="font-size: 12px; color: #636E72;">Learn & earn</div>
                            </div>
                            <i class="fas fa-chevron-right" style="margin-left: auto; color: #B2BEC3;"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render new dispute form
    renderNewDispute() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div style="padding: 16px;">
                <button onclick="cs.renderSupportPage()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Open a Dispute</h2>
                
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div class="input-group">
                        <i class="fas fa-tag"></i>
                        <select id="disputeType" required>
                            <option value="">Select Issue Type</option>
                            <option value="order_issue">Order Issue</option>
                            <option value="payment_issue">Payment Issue</option>
                            <option value="product_issue">Product Issue</option>
                            <option value="delivery_issue">Delivery Issue</option>
                            <option value="refund_issue">Refund Issue</option>
                            <option value="account_issue">Account Issue</option>
                            <option value="store_issue">Store Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-hashtag"></i>
                        <input type="text" id="disputeOrderId" placeholder="Order ID (if applicable)">
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-heading"></i>
                        <input type="text" id="disputeSubject" placeholder="Subject" required>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-align-left"></i>
                        <textarea id="disputeDescription" placeholder="Describe your issue in detail..." rows="5" required></textarea>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                            <i class="fas fa-paperclip"></i> Attachments (optional)
                        </label>
                        <input type="file" id="disputeAttachments" multiple accept="image/*" style="margin-top: 8px;">
                        <div style="font-size: 12px; color: #636E72; margin-top: 4px;">Max 5 images</div>
                    </div>
                    
                    <button onclick="cs.submitDispute()" class="btn-primary" style="margin-top: 20px;">
                        Submit Dispute
                    </button>
                </div>
            </div>
        `;
    }

    // Submit new dispute
    async submitDispute() {
        const type = document.getElementById('disputeType').value;
        const orderId = document.getElementById('disputeOrderId').value;
        const subject = document.getElementById('disputeSubject').value;
        const description = document.getElementById('disputeDescription').value;

        if (!type || !subject || !description) {
            utils.showToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            // Upload attachments if any
            const attachmentFiles = document.getElementById('disputeAttachments').files;
            let attachments = [];
            
            if (attachmentFiles.length > 0) {
                utils.showToast('Uploading attachments...', 'warning');
                
                for (let i = 0; i < Math.min(attachmentFiles.length, 5); i++) {
                    const url = await utils.uploadToCloudinary(attachmentFiles[i], 'disputes');
                    attachments.push(url);
                }
            }

            // Create dispute
            const disputeId = await api.submitDispute({
                userId: app.currentUser.uid,
                userName: app.currentUser.displayName || 'User',
                userEmail: app.currentUser.email,
                type: type,
                orderId: orderId || null,
                subject: subject,
                description: description,
                attachments: attachments,
                status: 'open',
                priority: 'normal'
            });

            utils.showToast('Dispute submitted successfully!', 'success');
            
            // Show dispute details
            setTimeout(() => {
                this.renderDisputeDetail(disputeId);
            }, 1000);

        } catch (error) {
            console.error('Submit dispute error:', error);
            utils.showToast('Failed to submit dispute: ' + error.message, 'error');
        }
    }

    // Render my disputes list
    async renderMyDisputes() {
        const mainContent = document.getElementById('mainContent');
        utils.showLoading(mainContent);

        try {
            const disputesSnapshot = await db.collection('disputes')
                .where('userId', '==', app.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            if (disputesSnapshot.empty) {
                utils.showEmptyState(mainContent, 'No Disputes', 'fa-check-circle', 'You have no open disputes');
                return;
            }

            const disputes = disputesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            mainContent.innerHTML = `
                <div style="padding: 16px;">
                    <button onclick="cs.renderSupportPage()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    
                    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">My Disputes</h2>
                    
                    <button onclick="cs.renderNewDispute()" style="width: 100%; padding: 12px; background: #6C5CE7; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; margin-bottom: 16px;">
                        <i class="fas fa-plus"></i> New Dispute
                    </button>
                    
                    ${disputes.map(dispute => `
                        <div onclick="cs.renderDisputeDetail('${dispute.id}')" style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <div style="font-weight: 700;">${dispute.disputeId}</div>
                                <span style="padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; ${this.getStatusStyle(dispute.status)}">
                                    ${dispute.status.toUpperCase()}
                                </span>
                            </div>
                            <div style="font-weight: 600; margin-bottom: 4px;">${dispute.subject}</div>
                            <div style="font-size: 12px; color: #636E72; margin-bottom: 8px;">${utils.truncateText(dispute.description, 80)}</div>
                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #B2BEC3;">
                                <span><i class="far fa-clock"></i> ${utils.formatDate(dispute.createdAt)}</span>
                                <span><i class="fas fa-tag"></i> ${dispute.type.replace('_', ' ')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Render disputes error:', error);
            mainContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Disputes</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

    // Render dispute detail
    async renderDisputeDetail(disputeId) {
        const mainContent = document.getElementById('mainContent');
        utils.showLoading(mainContent);

        try {
            const disputeDoc = await db.collection('disputes').doc(disputeId).get();
            
            if (!disputeDoc.exists) {
                utils.showToast('Dispute not found', 'error');
                return;
            }

            const dispute = {
                id: disputeDoc.id,
                ...disputeDoc.data()
            };

            this.currentDispute = dispute;

            // Subscribe to real-time updates
            this.subscribeToDisputeUpdates(disputeId);

            mainContent.innerHTML = `
                <div style="padding: 16px; padding-bottom: 100px;">
                    <button onclick="cs.renderMyDisputes()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    
                    <!-- Dispute Header -->
                    <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <div>
                                <div style="font-size: 12px; color: #636E72;">Dispute ID</div>
                                <div style="font-weight: 700;">${dispute.disputeId}</div>
                            </div>
                            <span style="padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; ${this.getStatusStyle(dispute.status)}">
                                ${dispute.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <h3 style="font-weight: 700; margin-bottom: 8px;">${dispute.subject}</h3>
                        <p style="color: #636E72; margin-bottom: 8px;">${dispute.description}</p>
                        
                        <div style="display: flex; gap: 16px; font-size: 12px; color: #B2BEC3;">
                            <span><i class="far fa-clock"></i> ${utils.formatDate(dispute.createdAt)}</span>
                            <span><i class="fas fa-tag"></i> ${dispute.type.replace('_', ' ')}</span>
                            ${dispute.orderId ? `<span><i class="fas fa-box"></i> ${dispute.orderId}</span>` : ''}
                        </div>
                        
                        ${dispute.attachments && dispute.attachments.length > 0 ? `
                            <div style="margin-top: 12px; display: flex; gap: 8px; overflow-x: auto;">
                                ${dispute.attachments.map(url => `
                                    <img src="${url}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; cursor: pointer;" onclick="window.open('${url}', '_blank')">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Messages -->
                    <div class="chat-messages" id="disputeMessages">
                        ${this.renderMessages(dispute.messages || [])}
                    </div>
                </div>
            `;

            // Add message input at bottom
            this.addMessageInput(disputeId);

            // Scroll to bottom of messages
            setTimeout(() => {
                const messagesContainer = document.getElementById('disputeMessages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 100);

        } catch (error) {
            console.error('Render dispute detail error:', error);
            utils.showToast('Failed to load dispute', 'error');
        }
    }

    // Render messages
    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #B2BEC3;">
                    <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 12px;"></i>
                    <p>No messages yet</p>
                    <p style="font-size: 12px;">Send a message to get help</p>
                </div>
            `;
        }

        return messages.map(msg => {
            const isCurrentUser = msg.sender === app.currentUser.uid;
            const messageClass = msg.senderType === 'agent' ? 'agent' : 'customer';
            
            return `
                <div class="message ${messageClass}" style="${isCurrentUser ? 'margin-left: auto;' : 'margin-right: auto;'}">
                    <div style="font-size: 14px;">${msg.message}</div>
                    <div class="message-time">
                        ${msg.timestamp ? utils.formatDate(msg.timestamp) : 'Just now'}
                        ${msg.senderType === 'agent' ? ' • Support Agent' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Add message input
    addMessageInput(disputeId) {
        const mainContent = document.getElementById('mainContent');
        
        const messageInput = document.createElement('div');
        messageInput.style.cssText = `
            position: fixed;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 480px;
            background: white;
            padding: 12px 16px;
            display: flex;
            gap: 8px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 999;
        `;
        
        messageInput.innerHTML = `
            <input type="text" id="messageInput" placeholder="Type your message..." 
                   style="flex: 1; padding: 12px; border: 2px solid #DFE6E9; border-radius: 24px; font-size: 14px; outline: none;">
            <button onclick="cs.sendMessage('${disputeId}')" 
                    style="width: 48px; height: 48px; background: #6C5CE7; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-paper-plane"></i>
            </button>
        `;
        
        mainContent.appendChild(messageInput);

        // Enter key to send
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage(disputeId);
            }
        });
    }

    // Send message
    async sendMessage(disputeId) {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            await api.sendDisputeMessage(
                disputeId,
                message,
                app.currentUser.uid,
                this.isAgent ? 'agent' : 'customer'
            );

            input.value = '';
            
            // Refresh messages
            const disputeDoc = await db.collection('disputes').doc(disputeId).get();
            const messages = disputeDoc.data().messages || [];
            
            const messagesContainer = document.getElementById('disputeMessages');
            if (messagesContainer) {
                messagesContainer.innerHTML = this.renderMessages(messages);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

        } catch (error) {
            console.error('Send message error:', error);
            utils.showToast('Failed to send message', 'error');
        }
    }

    // Subscribe to real-time dispute updates
    subscribeToDisputeUpdates(disputeId) {
        db.collection('disputes').doc(disputeId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const messages = doc.data().messages || [];
                    const messagesContainer = document.getElementById('disputeMessages');
                    
                    if (messagesContainer) {
                        const shouldScroll = messagesContainer.scrollHeight - messagesContainer.scrollTop === messagesContainer.clientHeight;
                        messagesContainer.innerHTML = this.renderMessages(messages);
                        
                        if (shouldScroll) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    }
                }
            });
    }

    // Render agent dashboard
    async renderAgentDashboard() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="cs-dashboard">
                <div style="padding: 16px;">
                    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Support Dashboard</h2>
                    <p style="color: #636E72;">Welcome back, Agent</p>
                </div>

                <!-- Stats -->
                <div class="cs-stats" style="padding: 0 16px;">
                    <div class="cs-stat-card">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px; color: #E17055;"></i>
                        <div class="cs-stat-value" id="openDisputes">-</div>
                        <div style="font-size: 12px; color: #636E72;">Open</div>
                    </div>
                    <div class="cs-stat-card">
                        <i class="fas fa-clock" style="font-size: 24px; color: #FDCB6E;"></i>
                        <div class="cs-stat-value" id="pendingDisputes">-</div>
                        <div style="font-size: 12px; color: #636E72;">Pending</div>
                    </div>
                    <div class="cs-stat-card">
                        <i class="fas fa-check-circle" style="font-size: 24px; color: #00B894;"></i>
                        <div class="cs-stat-value" id="resolvedDisputes">-</div>
                        <div style="font-size: 12px; color: #636E72;">Resolved</div>
                    </div>
                </div>

                <!-- Disputes List -->
                <div style="padding: 16px;">
                    <h3 style="font-weight: 700; margin-bottom: 12px;">Active Disputes</h3>
                    <div id="agentDisputesList">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load agent disputes
        this.loadAgentDisputes();
        this.loadAgentStats();
    }

    // Load agent disputes
    async loadAgentDisputes() {
        try {
            const disputesSnapshot = await db.collection('disputes')
                .where('status', 'in', ['open', 'pending', 'in_progress'])
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            const disputes = disputesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const container = document.getElementById('agentDisputesList');
            
            if (disputes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <h3>No Active Disputes</h3>
                        <p>All caught up!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = disputes.map(dispute => `
                <div class="dispute-card" onclick="cs.renderAgentDisputeDetail('${dispute.id}')">
                    <div class="dispute-header">
                        <div>
                            <div class="dispute-id">${dispute.disputeId}</div>
                            <div style="font-weight: 600;">${dispute.subject}</div>
                            <div style="font-size: 12px; color: #636E72;">${dispute.userName} • ${utils.formatDate(dispute.createdAt)}</div>
                        </div>
                        <span class="dispute-status" style="background: ${this.getStatusColor(dispute.status)}; color: white;">
                            ${dispute.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="font-size: 14px; color: #636E72; margin-top: 8px;">
                        ${utils.truncateText(dispute.description, 100)}
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button onclick="event.stopPropagation(); cs.updateDisputeStatus('${dispute.id}', 'in_progress')" 
                                style="padding: 6px 12px; background: #6C5CE7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            Take Over
                        </button>
                        <button onclick="event.stopPropagation(); cs.renderAgentDisputeDetail('${dispute.id}')" 
                                style="padding: 6px 12px; background: #00B894; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            View
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Load agent disputes error:', error);
        }
    }

    // Load agent stats
    async loadAgentStats() {
        try {
            const [openSnap, pendingSnap, resolvedSnap] = await Promise.all([
                db.collection('disputes').where('status', '==', 'open').get(),
                db.collection('disputes').where('status', 'in', ['pending', 'in_progress']).get(),
                db.collection('disputes').where('status', '==', 'resolved').get()
            ]);

            document.getElementById('openDisputes').textContent = openSnap.size;
            document.getElementById('pendingDisputes').textContent = pendingSnap.size;
            document.getElementById('resolvedDisputes').textContent = resolvedSnap.size;
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    // Render agent dispute detail
    async renderAgentDisputeDetail(disputeId) {
        // Redirect to dedicated dashboard page
        window.location.href = `Customerservicedashboard.html?dispute=${disputeId}`;
    }

    // Update dispute status
    async updateDisputeStatus(disputeId, newStatus) {
        try {
            await db.collection('disputes').doc(disputeId).update({
                status: newStatus,
                assignedTo: app.currentUser.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            utils.showToast('Status updated', 'success');
            this.loadAgentDisputes();
            this.loadAgentStats();
        } catch (error) {
            console.error('Update status error:', error);
            utils.showToast('Failed to update status', 'error');
        }
    }

    // Get status style
    getStatusStyle(status) {
        const styles = {
            'open': 'background: #FFF3E0; color: #E65100;',
            'pending': 'background: #E3F2FD; color: #1565C0;',
            'in_progress': 'background: #F3E5F5; color: #6A1B9A;',
            'resolved': 'background: #E8F5E9; color: #2E7D32;',
            'closed': 'background: #FFEBEE; color: #C62828;'
        };
        return styles[status] || styles['open'];
    }

    // Get status color
    getStatusColor(status) {
        const colors = {
            'open': '#E65100',
            'pending': '#1565C0',
            'in_progress': '#6A1B9A',
            'resolved': '#2E7D32',
            'closed': '#C62828'
        };
        return colors[status] || colors['open'];
    }

    // Open FAQs
    openFAQs() {
        const mainContent = document.getElementById('mainContent');
        
        const faqs = [
            { q: 'How do I track my order?', a: 'Go to My Orders in your profile to track your order status.' },
            { q: 'How do I request a refund?', a: 'Go to My Orders, find the delivered order, and click Refund.' },
            { q: 'How do I become a seller?', a: 'Go to Profile > Become a Seller and create your store.' },
            { q: 'How do I change my currency?', a: 'Go to Profile > Settings > Currency to change your preferred currency.' },
            { q: 'What payment methods are accepted?', a: 'We accept card payments, bank transfers, and USSD through Flutterwave.' },
            { q: 'How long does delivery take?', a: 'Standard delivery takes 5-7 business days. Express delivery takes 1-3 business days.' }
        ];

        mainContent.innerHTML = `
            <div style="padding: 16px;">
                <button onclick="cs.renderSupportPage()" style="background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Frequently Asked Questions</h2>
                
                ${faqs.map((faq, index) => `
                    <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div onclick="cs.toggleFAQ(${index})" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                            <h3 style="font-weight: 600; font-size: 16px;">${faq.q}</h3>
                            <i class="fas fa-chevron-down" id="faqIcon${index}"></i>
                        </div>
                        <p id="faqAnswer${index}" style="margin-top: 8px; color: #636E72; display: none;">${faq.a}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Toggle FAQ
    toggleFAQ(index) {
        const answer = document.getElementById(`faqAnswer${index}`);
        const icon = document.getElementById(`faqIcon${index}`);
        
        if (answer.style.display === 'none') {
            answer.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            answer.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    }

    // Open live chat
    openLiveChat() {
        window.open(CONFIG.whatsappCommunity, '_blank');
    }
}

// Initialize customer support
const cs = new CustomerSupport();

// Make globally accessible
window.cs = cs;