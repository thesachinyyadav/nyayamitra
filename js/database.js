// Database Configuration and Integration
class DatabaseClient {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `http://${window.location.hostname}:3000/api`
            : '/api';
            
        console.log('📊 SQLite database client initialized');
    }

    async query(endpoint, data = null, method = 'POST') {
        try {
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const options = {
                method: method,
                headers: headers
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`Database error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Database operation failed:', error);
            // Fallback to local storage for demo purposes when server is not available
            return this.fallbackStorage(endpoint, data, method);
        }
    }
    
    // Fallback storage for demo or development purposes
    fallbackStorage(endpoint, data, method) {
        const storageKey = `nyaya_mitra_${endpoint.split('/').pop()}`;
        
        try {
            if (method === 'POST') {
                const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const newRecord = {
                    id: Date.now(),
                    created_at: new Date().toISOString(),
                    ...data
                };
                existing.push(newRecord);
                localStorage.setItem(storageKey, JSON.stringify(existing));
                return { success: true, data: [newRecord] };
            } else if (method === 'GET') {
                return JSON.parse(localStorage.getItem(storageKey) || '[]');
            }
        } catch (error) {
            console.error('Fallback storage error:', error);
            return { success: false, message: 'Storage operation failed' };
        }
    }
    
    // SOS Alerts operations
    async createSOSAlert(alertData) {
        return await this.query('sos/create', {
            alertType: alertData.type,
            description: alertData.description,
            location: alertData.location
        });
    }
    
    async getSOSAlerts() {
        return await this.query('sos/user-alerts', null, 'GET');
    }
    
    // Whistleblower Reports operations
    async createWhistleblowerReport(reportData) {
        return await this.query('whistleblower/submit', {
            type: reportData.type,
            title: reportData.title,
            description: reportData.description,
            location: reportData.location,
            anonymity: reportData.anonymity
        });
    }
    
    // Civic Feedback operations
    async createCivicFeedback(feedbackData) {
        return await this.query('feedback/submit', {
            category: feedbackData.category,
            title: feedbackData.title,
            description: feedbackData.description,
            location: feedbackData.location
        });
    }
    
    // Contact Messages operations
    async createContactMessage(messageData) {
        return await this.query('contact/submit', {
            name: messageData.name,
            email: messageData.email,
            subject: messageData.subject,
            message: messageData.message
        });
    }
    
    // Document Analysis operations
    async saveDocumentAnalysis(analysisData) {
        return await this.query('documents/save-analysis', {
            filename: analysisData.fileName,
            fileType: analysisData.fileType,
            analysisResults: analysisData.results
        });
    }
    
    async getUserDocuments() {
        return await this.query('documents/user-documents', null, 'GET');
    }
}

// Initialize database client
const db = new DatabaseClient();

// Auth functions
async function loginUser(email, password) {
    return await db.query('auth/login', { email, password });
}

async function registerUser(userData) {
    return await db.query('auth/register', userData);
}

async function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        return await db.query('auth/me', null, 'GET');
    } catch (error) {
        localStorage.removeItem('authToken');
        return null;
    }
}

// Utility functions for form integration
function showDatabaseStatus(success, message) {
    // Check if showNotification is defined in script.js
    if (typeof showNotification === 'function') {
        showNotification(message, success ? 'success' : 'error');
        return;
    }
    
    // Fallback notification
    const statusDiv = document.createElement('div');
    statusDiv.className = `database-status ${success ? 'success' : 'error'}`;
    statusDiv.innerHTML = `
        <i class="fas ${success ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 5000);
}

// Add database status styles for fallback notifications
const dbStyles = document.createElement('style');
dbStyles.textContent = `
    .database-status {
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    }
    
    .database-status.success {
        background: linear-gradient(135deg, #4CAF50, #45a049);
    }
    
    .database-status.error {
        background: linear-gradient(135deg, #f44336, #d32f2f);
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(dbStyles);

// Check database connection
async function checkDatabaseConnection() {
    try {
        const status = await fetch(`${db.apiBaseUrl}/db/status`);
        const data = await status.json();
        return data.status === 'connected';
    } catch (error) {
        console.error('Database connection check failed:', error);
        return false;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DatabaseClient, 
        db, 
        loginUser, 
        registerUser, 
        getCurrentUser,
        checkDatabaseConnection,
        showDatabaseStatus 
    };
}
