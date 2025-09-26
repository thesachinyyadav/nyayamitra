const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Get user notifications
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const db = new Database(dbPath);
    
    try {
        let whereClause = 'user_id = ?';
        const params = [req.user.id];

        if (unreadOnly) {
            whereClause += ' AND is_read = 0';
        }

        const notifications = db.prepare(`
            SELECT * FROM notifications 
            WHERE ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        const totalCount = db.prepare(`
            SELECT COUNT(*) as count FROM notifications WHERE ${whereClause}
        `).get(...params).count;

        res.json({
            notifications,
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

// Mark notification as read
router.put('/:id/read', asyncHandler(async (req, res) => {
    const notificationId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        const result = db.prepare(`
            UPDATE notifications 
            SET is_read = 1, read_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?
        `).run(notificationId, req.user.id);

        if (result.changes === 0) {
            throw new ApiError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
        }

        res.json({ message: 'Notification marked as read' });

    } finally {
        db.close();
    }
}));

// Mark all notifications as read
router.post('/mark-all-read', asyncHandler(async (req, res) => {
    const db = new Database(dbPath);
    
    try {
        const result = db.prepare(`
            UPDATE notifications 
            SET is_read = 1, read_at = CURRENT_TIMESTAMP 
            WHERE user_id = ? AND is_read = 0
        `).run(req.user.id);

        res.json({ 
            message: 'All notifications marked as read',
            updatedCount: result.changes
        });

    } finally {
        db.close();
    }
}));

module.exports = router;