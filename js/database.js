// Database Configuration and Integration
class SupabaseClient {
    constructor() {
        this.supabaseUrl = 'https://your-project-id.supabase.co'; // Replace with actual URL
        this.supabaseKey = 'your-anon-key'; // Replace with actual anon key
        this.apiUrl = `${this.supabaseUrl}/rest/v1`;
        
        // Note: In production, replace with your actual Supabase credentials
        console.log('⚠️ Database integration ready - Configure Supabase credentials for production');
    }

    async query(table, data, method = 'POST') {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Prefer': 'return=representation'
            };

            const options = {
                method: method,
                headers: headers
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiUrl}/${table}`, options);
            
            if (!response.ok) {
                throw new Error(`Database error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Database operation failed:', error);
            // Fallback to local storage for demo purposes
            return this.fallbackStorage(table, data, method);
        }
    }

    // Fallback storage for demo purposes
    fallbackStorage(table, data, method) {
        const storageKey = `nyaya_mitra_${table}`;
        
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
                return [newRecord];
            } else if (method === 'GET') {
                return JSON.parse(localStorage.getItem(storageKey) || '[]');
            }
        } catch (error) {
            console.error('Fallback storage error:', error);
            return [];
        }
    }

    // SOS Alerts table operations
    async createSOSAlert(alertData) {
        const data = {
            user_id: alertData.userId || `user_${Date.now()}`,
            alert_type: alertData.type,
            description: alertData.description,
            gps_location: alertData.location,
            status: 'active',
            priority: alertData.priority || 'high'
        };
        
        return await this.query('sos_alerts', data);
    }

    async getSOSAlerts(userId = null) {
        let url = 'sos_alerts';
        if (userId) {
            url += `?user_id=eq.${userId}`;
        }
        return await this.query(url, null, 'GET');
    }

    // Whistleblower Reports table operations
    async createWhistleblowerReport(reportData) {
        const data = {
            reporter_id: reportData.reporterId || `reporter_${Date.now()}`,
            report_type: reportData.type,
            title: reportData.title,
            description: reportData.description,
            location: reportData.location,
            evidence_files: reportData.evidenceFiles || [],
            anonymity_level: reportData.anonymityLevel,
            status: 'submitted'
        };
        
        return await this.query('whistleblower_reports', data);
    }

    async getWhistleblowerReports(reporterId = null) {
        let url = 'whistleblower_reports';
        if (reporterId) {
            url += `?reporter_id=eq.${reporterId}`;
        }
        return await this.query(url, null, 'GET');
    }

    // Civic Feedback table operations
    async createCivicFeedback(feedbackData) {
        const data = {
            citizen_id: feedbackData.citizenId || `citizen_${Date.now()}`,
            feedback_type: feedbackData.type,
            category: feedbackData.category,
            title: feedbackData.title,
            description: feedbackData.description,
            location: feedbackData.location,
            priority: feedbackData.priority,
            status: 'submitted'
        };
        
        return await this.query('civic_feedback', data);
    }

    async getCivicFeedback(citizenId = null) {
        let url = 'civic_feedback';
        if (citizenId) {
            url += `?citizen_id=eq.${citizenId}`;
        }
        return await this.query(url, null, 'GET');
    }

    // Contact Messages table operations
    async createContactMessage(messageData) {
        const data = {
            name: messageData.name,
            email: messageData.email,
            phone: messageData.phone,
            subject: messageData.subject,
            message: messageData.message,
            status: 'new'
        };
        
        return await this.query('contact_messages', data);
    }

    async getContactMessages() {
        return await this.query('contact_messages', null, 'GET');
    }

    // Document Analysis Results (optional)
    async saveDocumentAnalysis(analysisData) {
        const data = {
            user_id: analysisData.userId || `user_${Date.now()}`,
            document_name: analysisData.fileName,
            analysis_result: analysisData.result,
            confidence_score: analysisData.confidence,
            analysis_type: analysisData.type || 'legal_document'
        };
        
        return await this.query('document_analyses', data);
    }
}

// Initialize database client
const db = new SupabaseClient();

// Utility functions for form integration
function showDatabaseStatus(success, message) {
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

// Add database status styles
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseClient, db, showDatabaseStatus };
}
