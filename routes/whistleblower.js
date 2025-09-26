const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Create whistleblower report (can be anonymous)
router.post('/report', optionalAuth, [
    body('title').isLength({ min: 10, max: 200 }).trim().escape(),
    body('description').isLength({ min: 50, max: 5000 }).trim(),
    body('category').isLength({ min: 2, max: 100 }).trim().escape(),
    body('isAnonymous').optional().isBoolean(),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('organizationInvolved').optional().isLength({ max: 200 }).trim()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { 
        title, 
        description, 
        category, 
        isAnonymous = false,
        severity = 'medium',
        organizationInvolved,
        estimatedImpact
    } = req.body;

    const reportId = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const db = new Database(dbPath);
    
    try {
        const insertReport = db.prepare(`
            INSERT INTO whistleblower_reports (
                reporter_id, report_id, title, description, category, 
                is_anonymous, severity, organization_involved, estimated_impact
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertReport.run(
            (req.user && !isAnonymous) ? req.user.id : null,
            reportId,
            title,
            description,
            category,
            isAnonymous,
            severity,
            organizationInvolved || null,
            estimatedImpact || null
        );

        // Create notification for user if not anonymous
        if (req.user && !isAnonymous) {
            const insertNotification = db.prepare(`
                INSERT INTO notifications (user_id, title, message, type, category)
                VALUES (?, ?, ?, ?, ?)
            `);

            insertNotification.run(
                req.user.id,
                'Whistleblower Report Submitted',
                `Your report "${title}" has been submitted securely. Report ID: ${reportId}`,
                'success',
                'whistleblower'
            );
        }

        res.status(201).json({
            message: 'Report submitted successfully',
            reportId: reportId,
            anonymousAccess: isAnonymous ? `Use report ID "${reportId}" to check status` : null
        });

    } finally {
        db.close();
    }
}));

// Check report status (anonymous access with report ID)
router.get('/status/:reportId', asyncHandler(async (req, res) => {
    const reportId = req.params.reportId;

    const db = new Database(dbPath);
    
    try {
        const report = db.prepare(`
            SELECT report_id, title, status, created_at, updated_at
            FROM whistleblower_reports 
            WHERE report_id = ?
        `).get(reportId);

        if (!report) {
            throw new ApiError('Report not found', 404, 'REPORT_NOT_FOUND');
        }

        res.json({
            reportId: report.report_id,
            title: report.title,
            status: report.status,
            createdAt: report.created_at,
            updatedAt: report.updated_at
        });

    } finally {
        db.close();
    }
}));

module.exports = router;