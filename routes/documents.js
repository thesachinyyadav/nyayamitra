const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'documents');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.', 400, 'INVALID_FILE_TYPE'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Mock AI analysis function (replace with actual AI service)
const analyzeDocument = async (filePath, fileName) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
        summary: `AI-generated summary of ${fileName}. This document contains important legal information that requires attention.`,
        keyPoints: [
            'Document type: Legal Document',
            'Key parties mentioned',
            'Important dates identified',
            'Legal references found'
        ],
        entities: {
            persons: ['John Doe', 'Jane Smith'],
            organizations: ['ABC Company', 'XYZ Legal Firm'],
            dates: ['2025-01-15', '2025-02-20'],
            locations: ['New Delhi', 'Mumbai']
        },
        legalReferences: [
            'Section 498A IPC',
            'Article 21 Constitution of India'
        ],
        confidenceScore: 0.85,
        processingTime: 2.1
    };
};

// Upload and analyze document
router.post('/upload', upload.single('document'), [
    body('caseId').optional().isInt({ min: 1 })
], asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError('No file uploaded', 400, 'NO_FILE');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { caseId } = req.body;
    const file = req.file;
    const filePath = `/uploads/documents/${file.filename}`;

    const db = new Database(dbPath);
    
    try {
        // Verify case ownership if caseId provided
        if (caseId) {
            const case_data = db.prepare('SELECT id FROM legal_cases WHERE id = ? AND user_id = ?').get(caseId, req.user.id);
            if (!case_data) {
                throw new ApiError('Case not found', 404, 'CASE_NOT_FOUND');
            }
        }

        // Insert document record
        const insertDocument = db.prepare(`
            INSERT INTO document_analysis (
                user_id, case_id, original_filename, file_path, 
                file_type, file_size, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertDocument.run(
            req.user.id,
            caseId || null,
            file.originalname,
            filePath,
            file.mimetype,
            file.size,
            'processing'
        );

        const documentId = result.lastInsertRowid;

        // Start AI analysis asynchronously
        analyzeDocument(file.path, file.originalname)
            .then(analysis => {
                const updateDocument = db.prepare(`
                    UPDATE document_analysis 
                    SET analysis_result = ?, confidence_score = ?, processing_time = ?, 
                        extracted_entities = ?, summary = ?, key_points = ?, 
                        legal_references = ?, status = ?
                    WHERE id = ?
                `);

                updateDocument.run(
                    JSON.stringify(analysis),
                    analysis.confidenceScore,
                    analysis.processingTime,
                    JSON.stringify(analysis.entities),
                    analysis.summary,
                    JSON.stringify(analysis.keyPoints),
                    JSON.stringify(analysis.legalReferences),
                    'completed',
                    documentId
                );

                // Create notification
                const insertNotification = db.prepare(`
                    INSERT INTO notifications (user_id, title, message, type, category)
                    VALUES (?, ?, ?, ?, ?)
                `);

                insertNotification.run(
                    req.user.id,
                    'Document Analysis Complete',
                    `Analysis of "${file.originalname}" has been completed successfully.`,
                    'success',
                    'document'
                );

                db.close();
            })
            .catch(error => {
                console.error('Document analysis failed:', error);
                
                const updateDocument = db.prepare(`
                    UPDATE document_analysis 
                    SET status = ?, error_message = ?
                    WHERE id = ?
                `);

                updateDocument.run('failed', error.message, documentId);
                db.close();
            });

        res.status(201).json({
            message: 'Document uploaded successfully. Analysis in progress.',
            document: {
                id: documentId,
                originalFilename: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                status: 'processing'
            }
        });

    } catch (error) {
        db.close();
        throw error;
    }
}));

// Get user's documents
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const caseId = req.query.caseId || '';

    const db = new Database(dbPath);
    
    try {
        let whereClause = 'user_id = ?';
        const params = [req.user.id];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (caseId) {
            whereClause += ' AND case_id = ?';
            params.push(caseId);
        }

        // Get documents
        const documents = db.prepare(`
            SELECT da.*, lc.case_number, lc.title as case_title
            FROM document_analysis da
            LEFT JOIN legal_cases lc ON lc.id = da.case_id
            WHERE ${whereClause}
            ORDER BY da.created_at DESC 
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        // Get total count
        const totalCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM document_analysis 
            WHERE ${whereClause}
        `).get(...params).count;

        res.json({
            documents,
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

// Get document analysis
router.get('/:id/analysis', asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        const document = db.prepare(`
            SELECT da.*, lc.case_number, lc.title as case_title
            FROM document_analysis da
            LEFT JOIN legal_cases lc ON lc.id = da.case_id
            WHERE da.id = ? AND da.user_id = ?
        `).get(documentId, req.user.id);

        if (!document) {
            throw new ApiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        res.json({
            document: {
                ...document,
                analysisResult: document.analysis_result ? JSON.parse(document.analysis_result) : null,
                extractedEntities: document.extracted_entities ? JSON.parse(document.extracted_entities) : null,
                keyPoints: document.key_points ? JSON.parse(document.key_points) : null,
                legalReferences: document.legal_references ? JSON.parse(document.legal_references) : null
            }
        });

    } finally {
        db.close();
    }
}));

// Re-analyze document
router.post('/:id/re-analyze', asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        const document = db.prepare(`
            SELECT * FROM document_analysis 
            WHERE id = ? AND user_id = ?
        `).get(documentId, req.user.id);

        if (!document) {
            throw new ApiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        // Update status to processing
        db.prepare('UPDATE document_analysis SET status = ? WHERE id = ?').run('processing', documentId);

        // Start analysis
        const fullPath = path.join(__dirname, '..', 'public', document.file_path);
        
        analyzeDocument(fullPath, document.original_filename)
            .then(analysis => {
                const updateDocument = db.prepare(`
                    UPDATE document_analysis 
                    SET analysis_result = ?, confidence_score = ?, processing_time = ?, 
                        extracted_entities = ?, summary = ?, key_points = ?, 
                        legal_references = ?, status = ?
                    WHERE id = ?
                `);

                updateDocument.run(
                    JSON.stringify(analysis),
                    analysis.confidenceScore,
                    analysis.processingTime,
                    JSON.stringify(analysis.entities),
                    analysis.summary,
                    JSON.stringify(analysis.keyPoints),
                    JSON.stringify(analysis.legalReferences),
                    'completed',
                    documentId
                );

                db.close();
            })
            .catch(error => {
                console.error('Document re-analysis failed:', error);
                
                const updateDocument = db.prepare(`
                    UPDATE document_analysis 
                    SET status = ?, error_message = ?
                    WHERE id = ?
                `);

                updateDocument.run('failed', error.message, documentId);
                db.close();
            });

        res.json({
            message: 'Document re-analysis started successfully'
        });

    } catch (error) {
        db.close();
        throw error;
    }
}));

// Delete document
router.delete('/:id', asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.id);

    const db = new Database(dbPath);
    
    try {
        const document = db.prepare(`
            SELECT * FROM document_analysis 
            WHERE id = ? AND user_id = ?
        `).get(documentId, req.user.id);

        if (!document) {
            throw new ApiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        // Delete file from filesystem
        const fullPath = path.join(__dirname, '..', 'public', document.file_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Delete from database
        db.prepare('DELETE FROM document_analysis WHERE id = ?').run(documentId);

        res.json({ message: 'Document deleted successfully' });

    } finally {
        db.close();
    }
}));

module.exports = router;