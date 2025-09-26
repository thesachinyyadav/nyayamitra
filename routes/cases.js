const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { captureOriginalData } = require('../middleware/auditLogger');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Generate case number
const generateCaseNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NYM-${year}-${random}`;
};

// Get user's cases
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const caseType = req.query.caseType || '';

    const db = new Database(dbPath);
    
    try {
        let whereClause = 'user_id = ?';
        const params = [req.user.id];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (caseType) {
            whereClause += ' AND case_type = ?';
            params.push(caseType);
        }

        // Get cases
        const cases = db.prepare(`
            SELECT lc.*, u.full_name as lawyer_name
            FROM legal_cases lc
            LEFT JOIN users u ON u.id = lc.assigned_lawyer_id
            WHERE ${whereClause}
            ORDER BY lc.created_at DESC 
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        // Get total count
        const totalCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM legal_cases 
            WHERE ${whereClause}
        `).get(...params).count;

        res.json({
            cases,
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

// Create new case
router.post('/', [
    body('title').isLength({ min: 5, max: 200 }).trim().escape(),
    body('description').isLength({ min: 20, max: 5000 }).trim(),
    body('caseType').isLength({ min: 2, max: 50 }).trim().escape(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { title, description, caseType, priority = 'medium' } = req.body;
    const caseNumber = generateCaseNumber();

    const db = new Database(dbPath);
    
    try {
        const insertCase = db.prepare(`
            INSERT INTO legal_cases (
                user_id, case_number, title, description, case_type, priority
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = insertCase.run(req.user.id, caseNumber, title, description, caseType, priority);
        const caseId = result.lastInsertRowid;

        // Create case update entry
        const insertUpdate = db.prepare(`
            INSERT INTO case_updates (case_id, user_id, update_type, title, description, is_milestone)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertUpdate.run(
            caseId,
            req.user.id,
            'status_change',
            'Case Created',
            'Case has been successfully created and is pending review.',
            true
        );

        // Create notification
        const insertNotification = db.prepare(`
            INSERT INTO notifications (user_id, title, message, type, category)
            VALUES (?, ?, ?, ?, ?)
        `);

        insertNotification.run(
            req.user.id,
            'New Case Created',
            `Your case "${title}" (${caseNumber}) has been created successfully.`,
            'success',
            'case'
        );

        // Get the created case with lawyer info
        const newCase = db.prepare(`
            SELECT lc.*, u.full_name as lawyer_name
            FROM legal_cases lc
            LEFT JOIN users u ON u.id = lc.assigned_lawyer_id
            WHERE lc.id = ?
        `).get(caseId);

        res.status(201).json({
            message: 'Case created successfully',
            case: newCase
        });

    } finally {
        db.close();
    }
}));

// Get specific case
router.get('/:id', asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        const case_data = db.prepare(`
            SELECT lc.*, u.full_name as lawyer_name, u.email as lawyer_email
            FROM legal_cases lc
            LEFT JOIN users u ON u.id = lc.assigned_lawyer_id
            WHERE lc.id = ? AND lc.user_id = ?
        `).get(caseId, req.user.id);

        if (!case_data) {
            throw new ApiError('Case not found', 404, 'CASE_NOT_FOUND');
        }

        // Get case updates
        const updates = db.prepare(`
            SELECT cu.*, u.full_name as updated_by_name
            FROM case_updates cu
            JOIN users u ON u.id = cu.user_id
            WHERE cu.case_id = ?
            ORDER BY cu.created_at DESC
        `).all(caseId);

        // Get related documents
        const documents = db.prepare(`
            SELECT id, original_filename, file_type, status, created_at
            FROM document_analysis
            WHERE case_id = ?
            ORDER BY created_at DESC
        `).all(caseId);

        res.json({
            case: case_data,
            updates,
            documents
        });

    } finally {
        db.close();
    }
}));

// Update case
router.put('/:id', captureOriginalData('cases'), [
    body('title').optional().isLength({ min: 5, max: 200 }).trim().escape(),
    body('description').optional().isLength({ min: 20, max: 5000 }).trim(),
    body('caseType').optional().isLength({ min: 2, max: 50 }).trim().escape(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['pending', 'in_progress', 'resolved', 'closed'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const caseId = parseInt(req.params.id);
    const { title, description, caseType, priority, status } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
    }
    if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
    }
    if (caseType !== undefined) {
        updateFields.push('case_type = ?');
        updateValues.push(caseType);
    }
    if (priority !== undefined) {
        updateFields.push('priority = ?');
        updateValues.push(priority);
    }
    if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
    }

    if (updateFields.length === 0) {
        throw new ApiError('No valid fields to update', 400, 'NO_UPDATE_FIELDS');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id, caseId);

    const db = new Database(dbPath);
    
    try {
        // Verify case ownership
        const case_data = db.prepare('SELECT id, status FROM legal_cases WHERE id = ? AND user_id = ?').get(caseId, req.user.id);
        if (!case_data) {
            throw new ApiError('Case not found', 404, 'CASE_NOT_FOUND');
        }

        // Update case
        const updateQuery = `UPDATE legal_cases SET ${updateFields.join(', ')} WHERE user_id = ? AND id = ?`;
        const result = db.prepare(updateQuery).run(...updateValues);

        if (result.changes === 0) {
            throw new ApiError('Case not found', 404, 'CASE_NOT_FOUND');
        }

        // If status changed, create update entry
        if (status !== undefined && status !== case_data.status) {
            const insertUpdate = db.prepare(`
                INSERT INTO case_updates (case_id, user_id, update_type, title, description, is_milestone)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            const statusMessages = {
                'pending': 'Case is pending review',
                'in_progress': 'Case is now in progress',
                'resolved': 'Case has been resolved',
                'closed': 'Case has been closed'
            };

            insertUpdate.run(
                caseId,
                req.user.id,
                'status_change',
                `Status Changed to ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                statusMessages[status] || `Case status updated to ${status}`,
                true
            );
        }

        // Get updated case
        const updatedCase = db.prepare(`
            SELECT lc.*, u.full_name as lawyer_name
            FROM legal_cases lc
            LEFT JOIN users u ON u.id = lc.assigned_lawyer_id
            WHERE lc.id = ?
        `).get(caseId);

        res.json({
            message: 'Case updated successfully',
            case: updatedCase
        });

    } finally {
        db.close();
    }
}));

// Delete case
router.delete('/:id', asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        // Verify case ownership
        const case_data = db.prepare('SELECT id FROM legal_cases WHERE id = ? AND user_id = ?').get(caseId, req.user.id);
        if (!case_data) {
            throw new ApiError('Case not found', 404, 'CASE_NOT_FOUND');
        }

        // Delete case (cascading deletes will handle related records)
        db.prepare('DELETE FROM legal_cases WHERE id = ? AND user_id = ?').run(caseId, req.user.id);

        res.json({ message: 'Case deleted successfully' });

    } finally {
        db.close();
    }
}));

// Add case update
router.post('/:id/updates', [
    body('title').isLength({ min: 5, max: 200 }).trim().escape(),
    body('description').isLength({ min: 10, max: 1000 }).trim(),
    body('updateType').isIn(['status_change', 'document_added', 'hearing_scheduled', 'payment', 'note']),
    body('isMilestone').optional().isBoolean()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const caseId = parseInt(req.params.id);
    const { title, description, updateType, isMilestone = false } = req.body;

    const db = new Database(dbPath);
    
    try {
        // Verify case ownership
        const case_data = db.prepare('SELECT id FROM legal_cases WHERE id = ? AND user_id = ?').get(caseId, req.user.id);
        if (!case_data) {
            throw new ApiError('Case not found', 404, 'CASE_NOT_FOUND');
        }

        // Insert update
        const insertUpdate = db.prepare(`
            INSERT INTO case_updates (case_id, user_id, update_type, title, description, is_milestone)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = insertUpdate.run(caseId, req.user.id, updateType, title, description, isMilestone);

        // Get the created update
        const newUpdate = db.prepare(`
            SELECT cu.*, u.full_name as updated_by_name
            FROM case_updates cu
            JOIN users u ON u.id = cu.user_id
            WHERE cu.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Case update added successfully',
            update: newUpdate
        });

    } finally {
        db.close();
    }
}));

module.exports = router;