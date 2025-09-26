const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Create SOS alert
router.post('/alert', [
    body('alertType').isIn(['police', 'medical', 'legal', 'fire', 'general']),
    body('description').isLength({ min: 10, max: 1000 }).trim(),
    body('locationLat').optional().isFloat({ min: -90, max: 90 }),
    body('locationLng').optional().isFloat({ min: -180, max: 180 }),
    body('address').optional().isLength({ max: 500 }).trim(),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { 
        alertType, 
        description, 
        locationLat, 
        locationLng, 
        address, 
        emergencyContacts,
        severity = 'medium',
        isTestAlert = false
    } = req.body;

    const db = new Database(dbPath);
    
    try {
        const insertAlert = db.prepare(`
            INSERT INTO sos_alerts (
                user_id, alert_type, location_lat, location_lng, 
                address, description, emergency_contacts, severity, is_test_alert
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertAlert.run(
            req.user.id,
            alertType,
            locationLat || null,
            locationLng || null,
            address || null,
            description,
            emergencyContacts ? JSON.stringify(emergencyContacts) : null,
            severity,
            isTestAlert
        );

        const alertId = result.lastInsertRowid;

        // Create high-priority notification
        const insertNotification = db.prepare(`
            INSERT INTO notifications (user_id, title, message, type, category, priority)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertNotification.run(
            req.user.id,
            `SOS Alert Created - ${alertType.toUpperCase()}`,
            `Your ${alertType} emergency alert has been created and relevant authorities have been notified.`,
            'warning',
            'sos',
            severity === 'critical' ? 'urgent' : 'high'
        );

        // Get the created alert
        const newAlert = db.prepare(`
            SELECT * FROM sos_alerts WHERE id = ?
        `).get(alertId);

        // Emit real-time event if Socket.io is available
        const io = req.app.get('io');
        if (io) {
            io.emit('sos_alert_created', {
                alertId: alertId,
                alertType: alertType,
                severity: severity,
                location: { lat: locationLat, lng: locationLng },
                userId: req.user.id
            });
        }

        res.status(201).json({
            message: 'SOS alert created successfully',
            alert: {
                ...newAlert,
                emergencyContacts: newAlert.emergency_contacts ? JSON.parse(newAlert.emergency_contacts) : null
            }
        });

    } finally {
        db.close();
    }
}));

// Get user's SOS alerts
router.get('/alerts', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const alertType = req.query.alertType || '';

    const db = new Database(dbPath);
    
    try {
        let whereClause = 'user_id = ?';
        const params = [req.user.id];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (alertType) {
            whereClause += ' AND alert_type = ?';
            params.push(alertType);
        }

        // Get alerts
        const alerts = db.prepare(`
            SELECT sa.*, u.full_name as responder_name
            FROM sos_alerts sa
            LEFT JOIN users u ON u.id = sa.responder_id
            WHERE ${whereClause}
            ORDER BY sa.created_at DESC 
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        // Parse JSON fields
        const alertsWithParsedData = alerts.map(alert => ({
            ...alert,
            emergencyContacts: alert.emergency_contacts ? JSON.parse(alert.emergency_contacts) : null
        }));

        // Get total count
        const totalCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM sos_alerts 
            WHERE ${whereClause}
        `).get(...params).count;

        res.json({
            alerts: alertsWithParsedData,
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

// Update SOS alert
router.put('/alerts/:id', [
    body('status').optional().isIn(['active', 'responded', 'resolved', 'cancelled']),
    body('responseNotes').optional().isLength({ max: 1000 }).trim()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const alertId = parseInt(req.params.id);
    const { status, responseNotes } = req.body;

    const db = new Database(dbPath);
    
    try {
        // Verify alert ownership
        const alert = db.prepare('SELECT * FROM sos_alerts WHERE id = ? AND user_id = ?').get(alertId, req.user.id);
        if (!alert) {
            throw new ApiError('SOS alert not found', 404, 'ALERT_NOT_FOUND');
        }

        const updateFields = [];
        const updateValues = [];

        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
            
            if (status === 'responded' && !alert.response_time) {
                updateFields.push('response_time = CURRENT_TIMESTAMP');
            }
            
            if (status === 'resolved' && !alert.resolved_at) {
                updateFields.push('resolved_at = CURRENT_TIMESTAMP');
            }
        }

        if (responseNotes !== undefined) {
            updateFields.push('response_notes = ?');
            updateValues.push(responseNotes);
        }

        if (updateFields.length === 0) {
            throw new ApiError('No valid fields to update', 400, 'NO_UPDATE_FIELDS');
        }

        updateValues.push(alertId);

        const updateQuery = `UPDATE sos_alerts SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = db.prepare(updateQuery).run(...updateValues);

        if (result.changes === 0) {
            throw new ApiError('SOS alert not found', 404, 'ALERT_NOT_FOUND');
        }

        // Create notification for status change
        if (status !== undefined && status !== alert.status) {
            const insertNotification = db.prepare(`
                INSERT INTO notifications (user_id, title, message, type, category)
                VALUES (?, ?, ?, ?, ?)
            `);

            const statusMessages = {
                'responded': 'Your SOS alert has received a response',
                'resolved': 'Your SOS alert has been resolved',
                'cancelled': 'Your SOS alert has been cancelled'
            };

            insertNotification.run(
                req.user.id,
                'SOS Alert Status Updated',
                statusMessages[status] || `Your SOS alert status has been updated to ${status}`,
                status === 'resolved' ? 'success' : 'info',
                'sos'
            );
        }

        // Get updated alert
        const updatedAlert = db.prepare(`
            SELECT sa.*, u.full_name as responder_name
            FROM sos_alerts sa
            LEFT JOIN users u ON u.id = sa.responder_id
            WHERE sa.id = ?
        `).get(alertId);

        res.json({
            message: 'SOS alert updated successfully',
            alert: {
                ...updatedAlert,
                emergencyContacts: updatedAlert.emergency_contacts ? JSON.parse(updatedAlert.emergency_contacts) : null
            }
        });

    } finally {
        db.close();
    }
}));

// Delete SOS alert
router.delete('/alerts/:id', asyncHandler(async (req, res) => {
    const alertId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        // Verify alert ownership
        const alert = db.prepare('SELECT id FROM sos_alerts WHERE id = ? AND user_id = ?').get(alertId, req.user.id);
        if (!alert) {
            throw new ApiError('SOS alert not found', 404, 'ALERT_NOT_FOUND');
        }

        // Only allow deletion of resolved or cancelled alerts
        const alertDetails = db.prepare('SELECT status FROM sos_alerts WHERE id = ?').get(alertId);
        if (!['resolved', 'cancelled'].includes(alertDetails.status)) {
            throw new ApiError('Only resolved or cancelled alerts can be deleted', 400, 'CANNOT_DELETE_ACTIVE_ALERT');
        }

        db.prepare('DELETE FROM sos_alerts WHERE id = ?').run(alertId);

        res.json({ message: 'SOS alert deleted successfully' });

    } finally {
        db.close();
    }
}));

// Get emergency contacts (public endpoint with basic info)
router.get('/emergency-contacts', asyncHandler(async (req, res) => {
    const emergencyContacts = {
        police: {
            national: '100',
            women: '1091',
            cyber: '1930'
        },
        medical: {
            ambulance: '108',
            emergency: '102'
        },
        fire: {
            emergency: '101'
        },
        disaster: {
            management: '1078'
        },
        helplines: {
            childHelpline: '1098',
            elderlyHelpline: '1291',
            mentalHealth: '9152987821'
        }
    };

    res.json({
        emergencyContacts,
        message: 'Emergency contacts retrieved successfully'
    });
}));

// Get SOS statistics (for dashboard)
router.get('/stats', asyncHandler(async (req, res) => {
    const db = new Database(dbPath);
    
    try {
        const stats = {
            total: db.prepare('SELECT COUNT(*) as count FROM sos_alerts WHERE user_id = ?').get(req.user.id).count,
            active: db.prepare('SELECT COUNT(*) as count FROM sos_alerts WHERE user_id = ? AND status = "active"').get(req.user.id).count,
            resolved: db.prepare('SELECT COUNT(*) as count FROM sos_alerts WHERE user_id = ? AND status = "resolved"').get(req.user.id).count,
            byType: {}
        };

        // Get alerts by type
        const alertTypes = ['police', 'medical', 'legal', 'fire', 'general'];
        alertTypes.forEach(type => {
            stats.byType[type] = db.prepare('SELECT COUNT(*) as count FROM sos_alerts WHERE user_id = ? AND alert_type = ?').get(req.user.id, type).count;
        });

        res.json(stats);

    } finally {
        db.close();
    }
}));

module.exports = router;