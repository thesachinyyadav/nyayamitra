/**
 * Nyaya Mitra - Chatbot Enhancements
 * This file contains additional functionality to enhance the chatbot experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Chat History Management
    class ChatHistoryManager {
        constructor() {
            this.conversations = this.loadConversations();
            this.initEventListeners();
        }
        
        loadConversations() {
            // Try to load from localStorage, or use demo data
            const saved = localStorage.getItem('nyayabot-history');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch(e) {
                    console.error('Error parsing saved conversations:', e);
                    return this.getDemoConversations();
                }
            } else {
                return this.getDemoConversations();
            }
        }
        
        getDemoConversations() {
            return [
                {
                    id: 'c1',
                    date: 'September 25, 2025',
                    topic: 'Property Boundary Dispute',
                    preview: 'I understand your concern about a property boundary dispute. Here\'s what you should do: 1) Gather all property documents (sale deed, survey records, etc.) 2) Get a survey done by a licensed surveyor 3) Try mediation first 4) If needed, file a civil suit for declaration of title.',
                    category: 'Property Law'
                },
                {
                    id: 'c2',
                    date: 'September 20, 2025',
                    topic: 'Employment Termination Issue',
                    preview: 'अगर आपको बिना proper notice के terminate किया गया है, तो यह labor law का violation हो सकता है। आप: 1) Labor Commissioner के पास complaint file कर सकते हैं 2) Employment tribunal में case ले जा सकते हैं 3) Notice period की salary और compensation का claim कर सकते हैं।',
                    category: 'Labor Law'
                },
                {
                    id: 'c3',
                    date: 'September 18, 2025',
                    topic: 'Motor Vehicle Accident Claim',
                    preview: 'For a motor vehicle accident claim, you\'ll need to file Form 54 (Accident Information Report) with the police and submit a claim petition to the Motor Accident Claims Tribunal (MACT). Be sure to collect evidence including medical reports, accident photos, and witness statements.',
                    category: 'Civil Law'
                }
            ];
        }
        
        saveConversation(conversation) {
            this.conversations.unshift(conversation);
            localStorage.setItem('nyayabot-history', JSON.stringify(this.conversations));
        }
        
        deleteConversation(id) {
            this.conversations = this.conversations.filter(c => c.id !== id);
            localStorage.setItem('nyayabot-history', JSON.stringify(this.conversations));
        }
        
        filterConversations(category) {
            if (category === 'All') {
                return this.conversations;
            } else {
                return this.conversations.filter(c => c.category.includes(category));
            }
        }
        
        searchConversations(query) {
            if (!query) return this.conversations;
            
            const lowercaseQuery = query.toLowerCase();
            return this.conversations.filter(c => 
                c.topic.toLowerCase().includes(lowercaseQuery) || 
                c.preview.toLowerCase().includes(lowercaseQuery) ||
                c.category.toLowerCase().includes(lowercaseQuery)
            );
        }
        
        renderConversations(conversations = this.conversations) {
            const historyCardsContainer = document.querySelector('.history-cards');
            if (!historyCardsContainer) return;
            
            historyCardsContainer.innerHTML = '';
            
            if (conversations.length === 0) {
                historyCardsContainer.innerHTML = `
                    <div class="empty-history">
                        <div class="empty-icon">
                            <i class="fas fa-history"></i>
                        </div>
                        <h3>No conversations found</h3>
                        <p>Start chatting with NyayaBot to see your conversation history here.</p>
                    </div>
                `;
                return;
            }
            
            conversations.forEach(conv => {
                const card = document.createElement('div');
                card.className = 'history-card';
                card.innerHTML = `
                    <div class="history-header">
                        <div class="history-date">
                            <i class="far fa-calendar"></i> ${conv.date}
                        </div>
                        <div class="history-topic">${conv.topic}</div>
                    </div>
                    <div class="history-preview">
                        ${conv.preview}
                    </div>
                    <div class="history-footer">
                        <span class="history-category">${conv.category}</span>
                        <div class="history-actions">
                            <span class="history-action" title="Continue Conversation" data-action="continue" data-id="${conv.id}">
                                <i class="fas fa-reply"></i>
                            </span>
                            <span class="history-action" title="Share Conversation" data-action="share" data-id="${conv.id}">
                                <i class="fas fa-share-alt"></i>
                            </span>
                            <span class="history-action" title="Delete" data-action="delete" data-id="${conv.id}">
                                <i class="fas fa-trash-alt"></i>
                            </span>
                        </div>
                    </div>
                `;
                historyCardsContainer.appendChild(card);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.history-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.getAttribute('data-action');
                    const id = e.currentTarget.getAttribute('data-id');
                    this.handleAction(action, id);
                });
            });
        }
        
        handleAction(action, id) {
            const conversation = this.conversations.find(c => c.id === id);
            if (!conversation) return;
            
            switch (action) {
                case 'continue':
                    // Scroll to chatbot section
                    document.getElementById('chatbot-embed')?.scrollIntoView({ behavior: 'smooth' });
                    showNotification('Continuing your conversation about: ' + conversation.topic, 'info');
                    break;
                    
                case 'share':
                    if (navigator.share) {
                        navigator.share({
                            title: 'My Legal Consultation about ' + conversation.topic,
                            text: conversation.preview,
                            url: window.location.href
                        })
                        .catch(error => console.log('Error sharing:', error));
                    } else {
                        // Fallback
                        prompt('Copy this text to share your conversation:', conversation.preview);
                    }
                    break;
                    
                case 'delete':
                    if (confirm('Are you sure you want to delete this conversation?')) {
                        this.deleteConversation(id);
                        this.renderConversations();
                        showNotification('Conversation deleted', 'success');
                    }
                    break;
            }
        }
        
        initEventListeners() {
            // Filter options
            document.querySelectorAll('.filter-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    
                    const category = option.textContent;
                    const filteredConversations = this.filterConversations(category);
                    this.renderConversations(filteredConversations);
                });
            });
            
            // Search input
            const searchInput = document.querySelector('.search-history input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value;
                    const searchResults = this.searchConversations(query);
                    this.renderConversations(searchResults);
                });
            }
        }
    }
    
    // Resource Library Manager
    class ResourceLibraryManager {
        constructor() {
            this.initEventListeners();
        }
        
        initEventListeners() {
            // Tab switching
            document.querySelectorAll('.resources-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const resource = tab.getAttribute('data-resource');
                    
                    // Update active tab
                    document.querySelectorAll('.resources-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Update content
                    document.querySelectorAll('.resources-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    document.getElementById(resource + '-content')?.classList.add('active');
                });
            });
            
            // Resource download/view tracking
            document.querySelectorAll('.resource-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    // For demo, prevent default and show notification
                    e.preventDefault();
                    
                    const resourceTitle = e.target.closest('.resource-info').querySelector('h3').textContent;
                    const isDownload = e.target.textContent.includes('Download');
                    
                    if (isDownload) {
                        showNotification(`Downloading: ${resourceTitle}`, 'success');
                    } else {
                        showNotification(`Opening: ${resourceTitle}`, 'info');
                    }
                });
            });
        }
    }
    
    // Initialize components
    try {
        // Initialize Chat History Manager
        const historyManager = new ChatHistoryManager();
        historyManager.renderConversations();
        
        // Initialize Resource Library Manager
        const resourceManager = new ResourceLibraryManager();
        
        // Usage statistics (demo)
        const statisticsUpdate = () => {
            const userCountElement = document.querySelector('.stat-number[data-target="10000"]');
            if (userCountElement) {
                // Simulate increasing users
                const currentCount = parseInt(userCountElement.textContent.replace(/\D/g, ''));
                userCountElement.textContent = (currentCount + Math.floor(Math.random() * 5)) + '+';
            }
        };
        
        // Update statistics every few minutes for demo purposes
        setInterval(statisticsUpdate, 300000); // 5 minutes
        
    } catch (error) {
        console.error('Error initializing chatbot enhancements:', error);
    }
    
    // Add smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Add to global window for use in other scripts
    window.showChatbotFeedback = function() {
        const feedbackWidget = document.getElementById('feedback-widget');
        if (feedbackWidget) {
            feedbackWidget.classList.add('show');
        }
    };
});

// Helper function for globally accessible notifications
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
};