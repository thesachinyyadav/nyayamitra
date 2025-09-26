const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nyaya-mitra-secret-key-2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'nyaya-mitra-refresh-secret-2025';
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Validation rules
const registerValidation = [
    body('username').isLength({ min: 3, max: 50 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('fullName').isLength({ min: 2, max: 100 }).trim().escape(),
    body('phone').optional().isMobilePhone(),
    body('userType').optional().isIn(['citizen', 'lawyer'])
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { username, email, password, fullName, phone, userType = 'citizen' } = req.body;

    const db = new Database(dbPath);
    
    try {
        // Check if user already exists
        const existingUser = db.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        ).get(email, username);

        if (existingUser) {
            throw new ApiError('User already exists with this email or username', 409, 'USER_EXISTS');
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertUser = db.prepare(`
            INSERT INTO users (username, email, password_hash, full_name, phone, user_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = insertUser.run(username, email, passwordHash, fullName, phone, userType);
        const userId = result.lastInsertRowid;

        // Create welcome notification
        const insertNotification = db.prepare(`
            INSERT INTO notifications (user_id, title, message, type, category)
            VALUES (?, ?, ?, ?, ?)
        `);

        insertNotification.run(
            userId,
            'Welcome to Nyaya Mitra!',
            'Your account has been created successfully. Explore our legal services and get the help you need.',
            'success',
            'account'
        );

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: userId, userType: userType },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: userId, tokenType: 'refresh' },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Store session
        const sessionToken = uuidv4();
        const insertSession = db.prepare(`
            INSERT INTO user_sessions (
                user_id, session_token, refresh_token, device_info, 
                ip_address, user_agent, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
        `);

        insertSession.run(
            userId,
            accessToken,
            refreshToken,
            JSON.stringify({ device: 'web' }),
            req.ip,
            req.get('User-Agent')
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                username,
                email,
                fullName,
                userType,
                isVerified: false
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });

    } finally {
        db.close();
    }
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { email, password, rememberMe = false } = req.body;

    const db = new Database(dbPath);
    
    try {
        // Find user
        const user = db.prepare(`
            SELECT id, username, email, password_hash, full_name, user_type, 
                   is_verified, is_active, last_login
            FROM users 
            WHERE email = ?
        `).get(email);

        if (!user) {
            throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        if (!user.is_active) {
            throw new ApiError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        // Update last login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // Generate tokens
        const tokenExpiry = rememberMe ? '7d' : '15m';
        const refreshExpiry = rememberMe ? '30d' : '7d';

        const accessToken = jwt.sign(
            { userId: user.id, userType: user.user_type },
            JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, tokenType: 'refresh' },
            JWT_REFRESH_SECRET,
            { expiresIn: refreshExpiry }
        );

        // Store session
        const insertSession = db.prepare(`
            INSERT INTO user_sessions (
                user_id, session_token, refresh_token, device_info, 
                ip_address, user_agent, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
        `);

        const expiryDays = rememberMe ? '+30 days' : '+7 days';
        insertSession.run(
            user.id,
            accessToken,
            refreshToken,
            JSON.stringify({ device: 'web', rememberMe }),
            req.ip,
            req.get('User-Agent'),
            expiryDays
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                userType: user.user_type,
                isVerified: user.is_verified,
                lastLogin: user.last_login
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });

    } finally {
        db.close();
    }
}));

// Refresh token
router.post('/refresh-token', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    const db = new Database(dbPath);
    
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        // Find session
        const session = db.prepare(`
            SELECT us.*, u.user_type 
            FROM user_sessions us
            JOIN users u ON u.id = us.user_id
            WHERE us.refresh_token = ? AND us.is_active = 1 AND us.expires_at > datetime('now')
        `).get(refreshToken);

        if (!session) {
            throw new ApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: session.user_id, userType: session.user_type },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Update session with new access token
        db.prepare(`
            UPDATE user_sessions 
            SET session_token = ?, last_accessed = CURRENT_TIMESTAMP 
            WHERE refresh_token = ?
        `).run(newAccessToken, refreshToken);

        res.json({
            accessToken: newAccessToken
        });

    } finally {
        db.close();
    }
}));

// Logout
router.post('/logout', optionalAuth, asyncHandler(async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                 req.body.token;

    if (token) {
        const db = new Database(dbPath);
        
        try {
            // Deactivate session
            db.prepare(`
                UPDATE user_sessions 
                SET is_active = 0 
                WHERE session_token = ?
            `).run(token);
        } finally {
            db.close();
        }
    }

    res.json({ message: 'Logged out successfully' });
}));

// Get current user
router.get('/me', optionalAuth, asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const db = new Database(dbPath);
    
    try {
        const user = db.prepare(`
            SELECT id, username, email, full_name, phone, address, 
                   user_type, profile_image, is_verified, created_at, last_login
            FROM users 
            WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone,
                address: user.address,
                userType: user.user_type,
                profileImage: user.profile_image,
                isVerified: user.is_verified,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });

    } finally {
        db.close();
    }
}));

module.exports = router;