const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseInitializer {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');
        this.schemaPath = path.join(__dirname, 'schema.sql');
        
        // Ensure data directory exists
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🗄️  Initializing Nyaya Mitra Database...');
        
        try {
            // Create database connection
            const db = new Database(this.dbPath);
            
            // Enable foreign keys
            db.exec('PRAGMA foreign_keys = ON');
            
            // Read and execute schema
            const schema = fs.readFileSync(this.schemaPath, 'utf8');
            
            // Split schema into individual statements and execute
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            db.transaction(() => {
                statements.forEach(statement => {
                    if (statement.trim()) {
                        try {
                            db.exec(statement + ';');
                        } catch (error) {
                            if (!error.message.includes('already exists')) {
                                console.warn('Schema execution warning:', error.message);
                            }
                        }
                    }
                });
            })();
            
            // Verify database structure
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            console.log('📊 Created tables:', tables.map(t => t.name).join(', '));
            
            // Get user count
            const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
            console.log(`👥 Users in database: ${userCount.count}`);
            
            db.close();
            console.log('✅ Database initialized successfully!');
            console.log(`📍 Database location: ${this.dbPath}`);
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            throw error;
        }
    }

    async seed() {
        console.log('🌱 Seeding database with Indian sample data...');
        
        try {
            const db = new Database(this.dbPath);
            db.exec('PRAGMA foreign_keys = ON');
            
            // Indian sample data
            const indianSampleData = {
                // Indian users with realistic data
                users: [
                    {
                        username: 'arjun.ramesh',
                        email: 'arjun.ramesh@gmail.com',
                        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKBYOHh0owZ7QjES', // 'password123'
                        full_name: 'Arjun Ramesh',
                        phone: '+91 9876543210',
                        address: 'Brigade Road, Bangalore, Karnataka 560001',
                        user_type: 'citizen'
                    },
                    {
                        username: 'shubham.kundu',
                        email: 'shubham.kundu@yahoo.com',
                        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKBYOHh0owZ7QjES', // 'password123'
                        full_name: 'Shubham Kundu',
                        phone: '+91 8765432109',
                        address: 'Sector V, Salt Lake City, Kolkata, West Bengal 700091',
                        user_type: 'citizen'
                    },
                    {
                        username: 'mahi.shreedhar',
                        email: 'mahi.shreedhar@outlook.com',
                        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKBYOHh0owZ7QjES', // 'password123'
                        full_name: 'Mahi Shreedhar',
                        phone: '+91 7654321098',
                        address: 'Banjara Hills, Hyderabad, Telangana 500034',
                        user_type: 'lawyer'
                    },
                    {
                        username: 'surya.vamshi',
                        email: 'surya.vamshi@christuniversity.in',
                        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKBYOHh0owZ7QjES', // 'password123'
                        full_name: 'Surya Vamshi S',
                        phone: '+91 6543210987',
                        address: 'Hosur Road, Bangalore, Karnataka 560027',
                        user_type: 'admin'
                    }
                ],
                
                // Indian legal cases with realistic scenarios
                cases: [
                    {
                        case_number: 'NYM-2025-001',
                        title: 'Property Boundary Dispute - Brigade Road',
                        description: 'Dispute regarding property boundaries with adjacent plot in Brigade Road area, Bangalore. Neighbor has constructed a wall that encroaches 2 feet into my property according to the registered sale deed. Municipal records show different boundaries than what is being claimed.',
                        case_type: 'Property',
                        status: 'in_progress',
                        priority: 'medium',
                        court_name: 'Bangalore City Civil Court',
                        judge_name: 'Hon. Justice Sharma',
                        next_hearing_date: '2025-10-15 11:00:00'
                    },
                    {
                        case_number: 'NYM-2025-002',
                        title: 'Consumer Rights Violation - E-commerce',
                        description: 'Product defect issue with major e-commerce platform. Purchased a laptop worth ₹75,000 which had manufacturing defects. Company refusing replacement despite being within warranty period of 1 year. Seeking consumer protection redressal.',
                        case_type: 'Consumer',
                        status: 'pending',
                        priority: 'low',
                        court_name: 'District Consumer Disputes Redressal Forum, Kolkata',
                        next_hearing_date: '2025-09-30 10:30:00'
                    },
                    {
                        case_number: 'NYM-2025-003',
                        title: 'Workplace Harassment Claim',
                        description: 'Facing continuous workplace harassment at a multinational company in Hyderabad. Documentation of multiple incidents provided. HR has failed to take adequate action despite formal complaints.',
                        case_type: 'Employment',
                        status: 'pending',
                        priority: 'high',
                        next_hearing_date: null
                    }
                ],
                
                // Civic feedback with Indian context
                feedback: [
                    {
                        category: 'Municipal Services',
                        subject: 'Street Light Maintenance - Brigade Road',
                        description: 'Multiple street lights not functioning on Brigade Road causing safety concerns for pedestrians and vehicles during night hours. At least 8 lights are non-functional between the MG Road junction and Rest House Road intersection.',
                        location: 'Brigade Road, Bangalore, Karnataka',
                        priority: 'medium',
                        status: 'submitted'
                    },
                    {
                        category: 'Traffic Management',
                        subject: 'Traffic Signal Malfunction - Banjara Hills',
                        description: 'Traffic signal at Banjara Hills Road No. 12 junction has been malfunctioning for the past week, causing traffic congestion especially during peak hours (9-11 AM and 5-8 PM). Requires immediate attention.',
                        location: 'Banjara Hills, Hyderabad, Telangana',
                        priority: 'high',
                        status: 'in_progress'
                    },
                    {
                        category: 'Public Transport',
                        subject: 'Bus Route Frequency - Salt Lake',
                        description: 'Bus route 44A connecting Salt Lake to Howrah has very low frequency during afternoon hours. Currently only one bus every 45-60 minutes between 2-5 PM. Request to increase frequency to at least one bus every 30 minutes.',
                        location: 'Salt Lake City, Kolkata, West Bengal',
                        priority: 'low',
                        status: 'submitted'
                    }
                ],
                
                // SOS Alerts with Indian context
                sos_alerts: [
                    {
                        alert_type: 'legal',
                        description: 'Facing illegal detention at private security office in a shopping mall. Need immediate legal assistance.',
                        location_lat: 12.9716,
                        location_lng: 77.5946,
                        address: 'Phoenix Marketcity, Whitefield, Bangalore',
                        status: 'resolved',
                        severity: 'high'
                    },
                    {
                        alert_type: 'police',
                        description: 'Witnessing a violent altercation in parking lot. Requires immediate police intervention.',
                        location_lat: 22.5726,
                        location_lng: 88.3639,
                        address: 'Near Howrah Bridge, Kolkata',
                        status: 'active',
                        severity: 'critical'
                    }
                ],
                
                // Document analysis samples with Indian context
                document_analysis: [
                    {
                        original_filename: 'property_deed_bangalore.pdf',
                        file_path: '/uploads/documents/property_deed_bangalore.pdf',
                        file_type: 'application/pdf',
                        file_size: 2458743,
                        summary: 'Sale deed for property located at Brigade Road, Bangalore. Property measures 2400 sq ft with clear title. Registration completed on July 15, 2022.',
                        status: 'completed'
                    },
                    {
                        original_filename: 'employment_contract_tech.pdf',
                        file_path: '/uploads/documents/employment_contract_tech.pdf',
                        file_type: 'application/pdf',
                        file_size: 1582436,
                        summary: 'Employment contract with 2 year bond period, ₹50,000 monthly salary, and standard termination clause of 2 months notice.',
                        status: 'completed'
                    }
                ],
                
                // Notifications for Indian users
                notifications: [
                    {
                        title: 'Case Update: Property Boundary Dispute',
                        message: 'Your case has been assigned to Advocate Priya Sharma. Initial consultation scheduled for October 2, 2025 at 3:00 PM.',
                        type: 'info',
                        category: 'case_update'
                    },
                    {
                        title: 'Document Analysis Complete',
                        message: 'Analysis of your property deed has been completed. 3 legal inconsistencies detected. Review the detailed report in your dashboard.',
                        type: 'success',
                        category: 'document_analysis'
                    },
                    {
                        title: 'SOS Alert Response',
                        message: 'Legal assistance is on the way to your location. ETA: 15 minutes. Please remain at your location if safe to do so.',
                        type: 'warning',
                        category: 'emergency'
                    }
                ]
            };
            
            // Insert Indian users
            const insertUser = db.prepare(`
                INSERT OR IGNORE INTO users (username, email, password_hash, full_name, phone, address, user_type, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            indianSampleData.users.forEach(user => {
                try {
                    insertUser.run(
                        user.username,
                        user.email,
                        user.password_hash,
                        user.full_name,
                        user.phone,
                        user.address,
                        user.user_type,
                        true // verified
                    );
                } catch (error) {
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.warn('Indian user insertion warning:', error.message);
                    }
                }
            });
            
            // Get user IDs for reference
            const getUserIdByUsername = db.prepare(`SELECT id FROM users WHERE username = ?`);
            
            const userIds = {
                arjun: getUserIdByUsername.get('arjun.ramesh')?.id || 2,
                shubham: getUserIdByUsername.get('shubham.kundu')?.id || 3,
                mahi: getUserIdByUsername.get('mahi.shreedhar')?.id || 4,
                surya: getUserIdByUsername.get('surya.vamshi')?.id || 5
            };
            
            // Insert Indian cases
            const insertCase = db.prepare(`
                INSERT OR IGNORE INTO legal_cases (
                    user_id, case_number, title, description, case_type, status, priority, 
                    court_name, judge_name, next_hearing_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            indianSampleData.cases.forEach((caseData, index) => {
                try {
                    // Assign cases to different users
                    const userId = index === 0 ? userIds.arjun : (index === 1 ? userIds.shubham : userIds.mahi);
                    
                    insertCase.run(
                        userId,
                        caseData.case_number,
                        caseData.title,
                        caseData.description,
                        caseData.case_type,
                        caseData.status,
                        caseData.priority,
                        caseData.court_name || null,
                        caseData.judge_name || null,
                        caseData.next_hearing_date || null
                    );
                } catch (error) {
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.warn('Indian case insertion warning:', error.message);
                    }
                }
            });
            
            // Insert Indian civic feedback
            const insertFeedback = db.prepare(`
                INSERT OR IGNORE INTO civic_feedback (
                    user_id, category, subject, description, location, priority, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            indianSampleData.feedback.forEach((feedback, index) => {
                try {
                    // Assign feedback to different users
                    const userId = index === 0 ? userIds.arjun : (index === 1 ? userIds.mahi : userIds.shubham);
                    
                    insertFeedback.run(
                        userId,
                        feedback.category,
                        feedback.subject,
                        feedback.description,
                        feedback.location,
                        feedback.priority,
                        feedback.status
                    );
                } catch (error) {
                    console.warn('Indian feedback insertion warning:', error.message);
                }
            });
            
            // Insert Indian SOS alerts
            const insertSosAlert = db.prepare(`
                INSERT OR IGNORE INTO sos_alerts (
                    user_id, alert_type, description, location_lat, location_lng, address, status, severity
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            indianSampleData.sos_alerts.forEach((alert, index) => {
                try {
                    // Assign alerts to different users
                    const userId = index === 0 ? userIds.arjun : userIds.shubham;
                    
                    insertSosAlert.run(
                        userId,
                        alert.alert_type,
                        alert.description,
                        alert.location_lat,
                        alert.location_lng,
                        alert.address,
                        alert.status,
                        alert.severity
                    );
                } catch (error) {
                    console.warn('Indian SOS alert insertion warning:', error.message);
                }
            });
            
            // Insert Indian document analysis
            const insertDocAnalysis = db.prepare(`
                INSERT OR IGNORE INTO document_analysis (
                    user_id, original_filename, file_path, file_type, file_size, summary, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            indianSampleData.document_analysis.forEach((doc, index) => {
                try {
                    // Assign documents to different users
                    const userId = index === 0 ? userIds.arjun : userIds.mahi;
                    
                    insertDocAnalysis.run(
                        userId,
                        doc.original_filename,
                        doc.file_path,
                        doc.file_type,
                        doc.file_size,
                        doc.summary,
                        doc.status
                    );
                } catch (error) {
                    console.warn('Indian document analysis insertion warning:', error.message);
                }
            });
            
            // Insert Indian notifications
            const insertNotification = db.prepare(`
                INSERT INTO notifications (user_id, title, message, type, category)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            indianSampleData.notifications.forEach((notification, index) => {
                try {
                    // Assign notifications to different users
                    const userId = index === 0 ? userIds.arjun : (index === 1 ? userIds.shubham : userIds.mahi);
                    
                    insertNotification.run(
                        userId,
                        notification.title,
                        notification.message,
                        notification.type,
                        notification.category
                    );
                } catch (error) {
                    console.warn('Indian notification insertion warning:', error.message);
                }
            });
            
            db.close();
            console.log('✅ Database seeded successfully!');
            
        } catch (error) {
            console.error('❌ Database seeding failed:', error.message);
            throw error;
        }
    }
}

// Initialize database if run directly
if (require.main === module) {
    const initializer = new DatabaseInitializer();
    
    initializer.initialize()
        .then(() => initializer.seed())
        .then(() => {
            console.log('🚀 Database setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseInitializer;