// SQLite Database Integration for Nyaya Mitra
// This file provides functions to interact with the SQLite database

// Establish connection to the database
async function connectToDatabase() {
    try {
        console.log('Connecting to Nyaya Mitra database...');
        
        // The database is accessed through API endpoints
        // This client-side script will communicate with the server
        // which handles actual database operations
        
        // Check if database connection is working
        const response = await fetch('/api/db/status');
        const data = await response.json();
        
        if (data.status === 'connected') {
            console.log('Database connected successfully');
            return true;
        } else {
            console.error('Database connection failed');
            return false;
        }
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

// User Authentication Functions
async function loginUser(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            message: 'Network error. Please check your connection and try again.'
        };
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        return { 
            success: false, 
            message: 'Network error. Please check your connection and try again.'
        };
    }
}

async function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            localStorage.removeItem('authToken');
            return null;
        }
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// Document Analysis Functions
async function saveDocumentAnalysis(analysisData) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/documents/save-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(analysisData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Save document analysis error:', error);
        return { 
            success: false, 
            message: 'Failed to save document analysis'
        };
    }
}

async function getUserDocuments() {
    const token = localStorage.getItem('authToken');
    if (!token) return [];
    
    try {
        const response = await fetch('/api/documents/user-documents', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            return [];
        }
    } catch (error) {
        console.error('Get user documents error:', error);
        return [];
    }
}

// SOS Alert Functions
async function createSOSAlert(alertData) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/sos/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(alertData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Create SOS alert error:', error);
        return { 
            success: false, 
            message: 'Failed to create SOS alert'
        };
    }
}

async function getUserSOSAlerts() {
    const token = localStorage.getItem('authToken');
    if (!token) return [];
    
    try {
        const response = await fetch('/api/sos/user-alerts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            return [];
        }
    } catch (error) {
        console.error('Get user SOS alerts error:', error);
        return [];
    }
}

// Whistleblower Report Functions
async function submitWhistleblowerReport(reportData) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/whistleblower/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(reportData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Submit whistleblower report error:', error);
        return { 
            success: false, 
            message: 'Failed to submit whistleblower report'
        };
    }
}

// Civic Feedback Functions
async function submitCivicFeedback(feedbackData) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/feedback/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(feedbackData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Submit civic feedback error:', error);
        return { 
            success: false, 
            message: 'Failed to submit civic feedback'
        };
    }
}

// Contact Message Functions
async function submitContactMessage(messageData) {
    try {
        const response = await fetch('/api/contact/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Submit contact message error:', error);
        return { 
            success: false, 
            message: 'Failed to submit contact message'
        };
    }
}

// Utility functions
function showDatabaseStatus(success, message) {
    // Use the showNotification function from script.js
    if (typeof showNotification === 'function') {
        showNotification(message, success ? 'success' : 'error');
    } else {
        alert(message);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectToDatabase,
        loginUser,
        registerUser,
        getCurrentUser,
        saveDocumentAnalysis,
        getUserDocuments,
        createSOSAlert,
        getUserSOSAlerts,
        submitWhistleblowerReport,
        submitCivicFeedback,
        submitContactMessage,
        showDatabaseStatus
    };
}