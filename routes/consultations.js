const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Get available consultations
router.get('/', asyncHandler(async (req, res) => {
    const db = new Database(dbPath);
    
    try {
        const consultations = db.prepare(`
            SELECT lc.*, l.full_name as lawyer_name, c.full_name as client_name
            FROM legal_consultations lc
            JOIN users l ON l.id = lc.lawyer_id
            JOIN users c ON c.id = lc.client_id
            WHERE lc.client_id = ? OR lc.lawyer_id = ?
            ORDER BY lc.scheduled_at DESC
        `).all(req.user.id, req.user.id);

        res.json({ consultations });

    } finally {
        db.close();
    }
}));

// Book consultation
router.post('/book', [
    body('consultationType').isIn(['chat', 'video', 'phone', 'in_person']),
    body('scheduledAt').isISO8601().toDate(),
    body('duration').optional().isInt({ min: 15, max: 180 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { consultationType, scheduledAt, duration = 30, notes } = req.body;

    const db = new Database(dbPath);
    
    try {
        const insertConsultation = db.prepare(`
            INSERT INTO legal_consultations (
                client_id, consultation_type, scheduled_at, duration_minutes, notes
            ) VALUES (?, ?, ?, ?, ?)
        `);

        const result = insertConsultation.run(
            req.user.id,
            consultationType,
            scheduledAt.toISOString(),
            duration,
            notes || null
        );

        res.status(201).json({
            message: 'Consultation booked successfully',
            consultationId: result.lastInsertRowid
        });

    } finally {
        db.close();
    }
}));

module.exports = router;