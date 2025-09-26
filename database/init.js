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
        console.log('🌱 Seeding database with sample data...');
        
        try {
            const db = new Database(this.dbPath);
            db.exec('PRAGMA foreign_keys = ON');
            
            // Sample data for testing
            const sampleData = {
                // Sample cases
                cases: [
                    {
                        user_id: 1,
                        case_number: 'NYM-2025-001',
                        title: 'Property Dispute Resolution',
                        description: 'Boundary dispute with neighbor requiring legal intervention',
                        case_type: 'Property',
                        status: 'pending',
                        priority: 'medium'
                    }
                ],
                
                // Sample notifications
                notifications: [
                    {
                        user_id: 1,
                        title: 'Welcome to Nyaya Mitra',
                        message: 'Your account has been created successfully. Explore our legal services.',
                        type: 'success',
                        category: 'account'
                    }
                ]
            };
            
            // Insert sample cases
            const insertCase = db.prepare(`
                INSERT INTO legal_cases (user_id, case_number, title, description, case_type, status, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            sampleData.cases.forEach(caseData => {
                try {
                    insertCase.run(
                        caseData.user_id,
                        caseData.case_number,
                        caseData.title,
                        caseData.description,
                        caseData.case_type,
                        caseData.status,
                        caseData.priority
                    );
                } catch (error) {
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.warn('Sample case insertion warning:', error.message);
                    }
                }
            });
            
            // Insert sample notifications
            const insertNotification = db.prepare(`
                INSERT INTO notifications (user_id, title, message, type, category)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            sampleData.notifications.forEach(notification => {
                try {
                    insertNotification.run(
                        notification.user_id,
                        notification.title,
                        notification.message,
                        notification.type,
                        notification.category
                    );
                } catch (error) {
                    console.warn('Sample notification insertion warning:', error.message);
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