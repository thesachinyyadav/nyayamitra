const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

const auditLogger = (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    
    res.json = function(data) {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            logAuditEntry(req, res, data);
        }
        
        // Call original json method
        return originalJson.call(this, data);
    };

    next();
};

const logAuditEntry = async (req, res, responseData) => {
    try {
        // Skip audit logging for certain endpoints
        const skipPaths = ['/api/health', '/api/notifications'];
        if (skipPaths.some(path => req.path.startsWith(path))) {
            return;
        }

        const db = new Database(dbPath);
        
        // Determine action based on HTTP method and path
        let action = req.method;
        let resourceType = 'unknown';
        let resourceId = null;
        
        // Extract resource info from path
        const pathParts = req.path.split('/').filter(part => part);
        if (pathParts.length >= 2) {
            resourceType = pathParts[1]; // e.g., 'cases', 'documents', 'users'
        }
        
        // Try to extract resource ID from path params or response
        if (req.params && req.params.id) {
            resourceId = parseInt(req.params.id);
        } else if (responseData && responseData.id) {
            resourceId = responseData.id;
        } else if (responseData && responseData.data && responseData.data.id) {
            resourceId = responseData.data.id;
        }

        // Create more descriptive action names
        const actionMap = {
            'GET': 'view',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete'
        };
        
        action = actionMap[req.method] || req.method.toLowerCase();
        
        // Add specific actions for certain endpoints
        if (req.path.includes('/login')) action = 'login';
        if (req.path.includes('/logout')) action = 'logout';
        if (req.path.includes('/upload')) action = 'upload';
        if (req.path.includes('/download')) action = 'download';

        // Prepare audit data
        const auditData = {
            userId: req.user ? req.user.id : null,
            action: action,
            resourceType: resourceType,
            resourceId: resourceId,
            oldValues: null,
            newValues: req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };

        // Store old values for update operations
        if (req.method === 'PUT' || req.method === 'PATCH') {
            if (req.originalData) {
                auditData.oldValues = JSON.stringify(req.originalData);
            }
        }

        // Insert audit log
        const insertAudit = db.prepare(`
            INSERT INTO audit_logs (
                user_id, action, resource_type, resource_id, 
                old_values, new_values, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertAudit.run(
            auditData.userId,
            auditData.action,
            auditData.resourceType,
            auditData.resourceId,
            auditData.oldValues,
            auditData.newValues,
            auditData.ipAddress,
            auditData.userAgent
        );

        db.close();
    } catch (error) {
        console.error('Audit logging error:', error);
        // Don't fail the request if audit logging fails
    }
};

// Middleware to capture original data for update operations
const captureOriginalData = (resourceType) => {
    return async (req, res, next) => {
        if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id) {
            try {
                const db = new Database(dbPath);
                const resourceId = parseInt(req.params.id);
                
                let query;
                switch (resourceType) {
                    case 'cases':
                        query = 'SELECT * FROM legal_cases WHERE id = ?';
                        break;
                    case 'documents':
                        query = 'SELECT * FROM document_analysis WHERE id = ?';
                        break;
                    case 'sos':
                        query = 'SELECT * FROM sos_alerts WHERE id = ?';
                        break;
                    case 'feedback':
                        query = 'SELECT * FROM civic_feedback WHERE id = ?';
                        break;
                    default:
                        query = null;
                }
                
                if (query) {
                    const originalData = db.prepare(query).get(resourceId);
                    req.originalData = originalData;
                }
                
                db.close();
            } catch (error) {
                console.error('Error capturing original data:', error);
            }
        }
        next();
    };
};

module.exports = {
    auditLogger,
    captureOriginalData
};