const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { adminOnly } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
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

// Update user profile
router.put('/profile', [
    body('fullName').optional().isLength({ min: 2, max: 100 }).trim().escape(),
    body('phone').optional().isMobilePhone(),
    body('address').optional().isLength({ max: 500 }).trim()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { fullName, phone, address } = req.body;
    const updateFields = [];
    const updateValues = [];

    if (fullName !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(fullName);
    }
    if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
    }
    if (address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(address);
    }

    if (updateFields.length === 0) {
        throw new ApiError('No valid fields to update', 400, 'NO_UPDATE_FIELDS');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id);

    const db = new Database(dbPath);
    
    try {
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = db.prepare(updateQuery).run(...updateValues);

        if (result.changes === 0) {
            throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Get updated user data
        const updatedUser = db.prepare(`
            SELECT id, username, email, full_name, phone, address, 
                   user_type, profile_image, is_verified, updated_at
            FROM users 
            WHERE id = ?
        `).get(req.user.id);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                fullName: updatedUser.full_name,
                phone: updatedUser.phone,
                address: updatedUser.address,
                userType: updatedUser.user_type,
                profileImage: updatedUser.profile_image,
                isVerified: updatedUser.is_verified,
                updatedAt: updatedUser.updated_at
            }
        });

    } finally {
        db.close();
    }
}));

// Get user dashboard data
router.get('/dashboard', asyncHandler(async (req, res) => {
    const db = new Database(dbPath);
    
    try {
        // Get user's cases
        const cases = db.prepare(`
            SELECT id, case_number, title, status, priority, created_at
            FROM legal_cases 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `).all(req.user.id);

        // Get user's recent documents
        const documents = db.prepare(`
            SELECT id, original_filename, status, created_at
            FROM document_analysis 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `).all(req.user.id);

        // Get unread notifications
        const notifications = db.prepare(`
            SELECT id, title, message, type, created_at
            FROM notifications 
            WHERE user_id = ? AND is_read = 0 
            ORDER BY created_at DESC 
            LIMIT 10
        `).all(req.user.id);

        // Get recent SOS alerts
        const sosAlerts = db.prepare(`
            SELECT id, alert_type, status, created_at
            FROM sos_alerts 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 3
        `).all(req.user.id);

        // Get statistics
        const stats = {
            totalCases: db.prepare('SELECT COUNT(*) as count FROM legal_cases WHERE user_id = ?').get(req.user.id).count,
            activeCases: db.prepare('SELECT COUNT(*) as count FROM legal_cases WHERE user_id = ? AND status IN ("pending", "in_progress")').get(req.user.id).count,
            totalDocuments: db.prepare('SELECT COUNT(*) as count FROM document_analysis WHERE user_id = ?').get(req.user.id).count,
            unreadNotifications: db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count
        };

        res.json({
            cases,
            documents,
            notifications,
            sosAlerts,
            stats
        });

    } finally {
        db.close();
    }
}));

// Get all users (admin only)
router.get('/all', adminOnly, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const userType = req.query.userType || '';

    const db = new Database(dbPath);
    
    try {
        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (userType) {
            whereClause += ' AND user_type = ?';
            params.push(userType);
        }

        // Get users
        const users = db.prepare(`
            SELECT id, username, email, full_name, user_type, is_verified, 
                   is_active, created_at, last_login
            FROM users 
            WHERE ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        // Get total count
        const totalCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE ${whereClause}
        `).get(...params).count;

        res.json({
            users,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });

    } finally {
        db.close();
    }
}));

// Update user status (admin only)
router.put('/:id/status', adminOnly, [
    body('isActive').isBoolean(),
    body('isVerified').optional().isBoolean()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const userId = parseInt(req.params.id);
    const { isActive, isVerified } = req.body;

    if (userId === req.user.id) {
        throw new ApiError('Cannot modify your own status', 400, 'CANNOT_MODIFY_SELF');
    }

    const db = new Database(dbPath);
    
    try {
        const updateFields = ['is_active = ?', 'updated_at = CURRENT_TIMESTAMP'];
        const updateValues = [isActive];

        if (isVerified !== undefined) {
            updateFields.push('is_verified = ?');
            updateValues.push(isVerified);
        }

        updateValues.push(userId);

        const result = db.prepare(`
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE id = ?
        `).run(...updateValues);

        if (result.changes === 0) {
            throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
        }

        res.json({ message: 'User status updated successfully' });

    } finally {
        db.close();
    }
}));

// Delete user account (admin only)
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
        throw new ApiError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    const db = new Database(dbPath);
    
    try {
        // Check if user exists
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
            throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Delete user (cascading deletes will handle related records)
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ message: 'User account deleted successfully' });

    } finally {
        db.close();
    }
}));

module.exports = router;