const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Create civic feedback (can be anonymous)
router.post('/', optionalAuth, [
    body('category').isLength({ min: 2, max: 100 }).trim().escape(),
    body('subject').isLength({ min: 5, max: 200 }).trim().escape(),
    body('description').isLength({ min: 20, max: 2000 }).trim(),
    body('location').optional().isLength({ max: 200 }).trim(),
    body('isAnonymous').optional().isBoolean(),
    body('priority').optional().isIn(['low', 'medium', 'high'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { 
        category, 
        subject, 
        description, 
        location, 
        isAnonymous = false,
        priority = 'medium' 
    } = req.body;

    const db = new Database(dbPath);
    
    try {
        const insertFeedback = db.prepare(`
            INSERT INTO civic_feedback (
                user_id, category, subject, description, location, 
                priority, is_anonymous
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertFeedback.run(
            (req.user && !isAnonymous) ? req.user.id : null,
            category,
            subject,
            description,
            location || null,
            priority,
            isAnonymous ? 1 : 0  // Convert boolean to integer for SQLite
        );

        const feedbackId = result.lastInsertRowid;

        // Create notification for user if not anonymous
        if (req.user && !isAnonymous) {
            const insertNotification = db.prepare(`
                INSERT INTO notifications (user_id, title, message, type, category)
                VALUES (?, ?, ?, ?, ?)
            `);

            insertNotification.run(
                req.user.id,
                'Civic Feedback Submitted',
                `Your feedback "${subject}" has been submitted successfully and is under review.`,
                'success',
                'feedback'
            );
        }

        res.status(201).json({
            message: 'Civic feedback submitted successfully',
            feedbackId: feedbackId,
            trackingNumber: `CF-${feedbackId.toString().padStart(6, '0')}`
        });

    } finally {
        db.close();
    }
}));

// Get user's feedback (requires auth)
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const db = new Database(dbPath);
    
    try {
        const feedback = db.prepare(`
            SELECT * FROM civic_feedback 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `).all(req.user.id, limit, offset);

        const totalCount = db.prepare(`
            SELECT COUNT(*) as count FROM civic_feedback WHERE user_id = ?
        `).get(req.user.id).count;

        res.json({
            feedback,
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

module.exports = router;