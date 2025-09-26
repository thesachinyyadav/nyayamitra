const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'nyaya-mitra-secret-key-2025';
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token ||
                     req.query.token;

        if (!token) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Check if token exists in database and is active
            const db = new Database(dbPath);
            const session = db.prepare(`
                SELECT us.*, u.username, u.email, u.user_type, u.is_active, u.is_verified
                FROM user_sessions us
                JOIN users u ON u.id = us.user_id
                WHERE us.session_token = ? AND us.is_active = 1 AND us.expires_at > datetime('now')
            `).get(token);
            
            db.close();

            if (!session) {
                return res.status(401).json({ 
                    error: 'Invalid or expired token.',
                    code: 'INVALID_TOKEN'
                });
            }

            if (!session.is_active) {
                return res.status(401).json({ 
                    error: 'Account is deactivated.',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            // Update last accessed time
            const updateDb = new Database(dbPath);
            updateDb.prepare(`
                UPDATE user_sessions 
                SET last_accessed = CURRENT_TIMESTAMP 
                WHERE session_token = ?
            `).run(token);
            updateDb.close();

            req.user = {
                id: decoded.userId,
                username: session.username,
                email: session.email,
                userType: session.user_type,
                isVerified: session.is_verified
            };

            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                error: 'Invalid token.',
                code: 'JWT_INVALID'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            error: 'Authentication error.',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies?.token ||
                 req.query.token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const db = new Database(dbPath);
        const session = db.prepare(`
            SELECT us.*, u.username, u.email, u.user_type, u.is_active, u.is_verified
            FROM user_sessions us
            JOIN users u ON u.id = us.user_id
            WHERE us.session_token = ? AND us.is_active = 1 AND us.expires_at > datetime('now')
        `).get(token);
        
        db.close();

        if (session && session.is_active) {
            req.user = {
                id: decoded.userId,
                username: session.username,
                email: session.email,
                userType: session.user_type,
                isVerified: session.is_verified
            };
        } else {
            req.user = null;
        }
    } catch (error) {
        req.user = null;
    }

    next();
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!userRoles.includes(req.user.userType)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions.',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

// Admin only middleware
const adminOnly = requireRole('admin');

// Lawyer or admin middleware
const lawyerOrAdmin = requireRole(['lawyer', 'admin']);

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
module.exports.requireRole = requireRole;
module.exports.adminOnly = adminOnly;
module.exports.lawyerOrAdmin = lawyerOrAdmin;