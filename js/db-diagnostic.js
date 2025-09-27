/**
 * Nyaya Mitra Database Diagnostic Tool
 * 
 * This script helps diagnose database issues by:
 * 1. Checking database connection
 * 2. Verifying table structure
 * 3. Testing user registration
 * 4. Testing user login
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Path to database file
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');
console.log(`\n\n${'='.repeat(80)}`);
console.log(`NYAYA MITRA DATABASE DIAGNOSTIC TOOL`);
console.log(`${'='.repeat(80)}`);

// Check if database file exists
console.log('\n📂 Checking database file...');
if (fs.existsSync(dbPath)) {
    console.log(`✅ Database file found at: ${dbPath}`);
    
    // Get file size
    const stats = fs.statSync(dbPath);
    console.log(`📊 Database file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Check if file is accessible
    try {
        fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
        console.log('✅ Database file is readable and writable');
    } catch (err) {
        console.error('❌ Database file access error:', err.message);
    }
} else {
    console.log('❌ Database file does not exist');
    
    // Check if data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        console.log(`❌ Data directory does not exist: ${dataDir}`);
        console.log('📂 Creating data directory...');
        try {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('✅ Data directory created successfully');
        } catch (err) {
            console.error('❌ Error creating data directory:', err.message);
        }
    } else {
        console.log(`✅ Data directory exists at: ${dataDir}`);
    }
}

// Connect to database
console.log('\n🔌 Connecting to database...');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Successfully connected to SQLite database');
    
    // Run diagnostics
    runDiagnostics(db);
});

async function runDiagnostics(db) {
    try {
        // Check foreign keys
        console.log('\n🔑 Checking foreign key constraints...');
        db.get('PRAGMA foreign_keys', (err, result) => {
            if (err) {
                console.error('❌ Error checking foreign keys:', err.message);
            } else {
                console.log(`${result.foreign_keys ? '✅' : '⚠️'} Foreign keys are ${result.foreign_keys ? 'enabled' : 'disabled'}`);
                if (!result.foreign_keys) {
                    db.run('PRAGMA foreign_keys = ON');
                    console.log('✅ Foreign keys have been enabled');
                }
            }
            
            // Check tables
            checkTables(db);
        });
    } catch (error) {
        console.error('❌ Error during diagnostics:', error.message);
        db.close();
    }
}

function checkTables(db) {
    console.log('\n📋 Checking database tables...');
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
        if (err) {
            console.error('❌ Error checking tables:', err.message);
            return;
        }
        
        if (tables.length === 0) {
            console.log('⚠️ No tables found in database');
            initializeTables(db);
            return;
        }
        
        console.log('📊 Tables found in database:');
        tables.forEach(table => {
            console.log(`   - ${table.name}`);
        });
        
        // Check if users table exists and has the correct structure
        const hasUsersTable = tables.some(t => t.name === 'users');
        
        if (!hasUsersTable) {
            console.log('⚠️ Users table not found, will create it');
            initializeTables(db);
            return;
        }
        
        // Check users table structure
        checkUsersTableStructure(db);
    });
}

function checkUsersTableStructure(db) {
    console.log('\n🔍 Checking users table structure...');
    db.all(`PRAGMA table_info(users)`, [], (err, columns) => {
        if (err) {
            console.error('❌ Error checking users table structure:', err.message);
            return;
        }
        
        console.log('📊 Users table columns:');
        columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}`);
        });
        
        // Check if we have the required columns
        const requiredColumns = ['id', 'email', 'password'];
        const hasAllRequired = requiredColumns.every(col => 
            columns.some(c => c.name === col)
        );
        
        // Check if we have the server.js format or the schema.sql format
        const hasFirstLastName = columns.some(c => c.name === 'first_name') && columns.some(c => c.name === 'last_name');
        const hasFullName = columns.some(c => c.name === 'full_name');
        
        const hasPasswordHash = columns.some(c => c.name === 'password_hash');
        const hasPassword = columns.some(c => c.name === 'password');
        
        console.log(`\n📋 Users table format analysis:`);
        if (hasFirstLastName) {
            console.log('✅ Table uses "first_name" and "last_name" format (server.js format)');
        } else if (hasFullName) {
            console.log('✅ Table uses "full_name" format (schema.sql format)');
        } else {
            console.log('❌ Table is missing name fields');
        }
        
        if (hasPasswordHash) {
            console.log('✅ Table uses "password_hash" field (schema.sql format)');
        } else if (hasPassword) {
            console.log('✅ Table uses "password" field (server.js format)');
        } else {
            console.log('❌ Table is missing password field');
        }
        
        if (!hasAllRequired) {
            console.log('⚠️ Users table is missing required columns, needs to be recreated');
            recreateUsersTable(db);
            return;
        }
        
        // Count users
        db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
            if (err) {
                console.error('❌ Error counting users:', err.message);
                return;
            }
            
            console.log(`\n👥 Users in database: ${result.count}`);
            
            if (result.count > 0) {
                // Sample one user
                db.get('SELECT * FROM users LIMIT 1', [], (err, user) => {
                    if (err) {
                        console.error('❌ Error retrieving user:', err.message);
                        return;
                    }
                    
                    console.log('📊 Sample user structure:');
                    
                    // Filter out password fields from display
                    const displayUser = {...user};
                    if (displayUser.password) displayUser.password = '********';
                    if (displayUser.password_hash) displayUser.password_hash = '********';
                    
                    // Display user details
                    Object.keys(displayUser).forEach(key => {
                        console.log(`   - ${key}: ${displayUser[key]}`);
                    });
                    
                    // Test user registration
                    testUserRegistration(db);
                });
            } else {
                console.log('⚠️ No users found in database');
                testUserRegistration(db);
            }
        });
    });
}

function initializeTables(db) {
    console.log('\n🔧 Initializing database tables...');
    
    // Create users table based on server.js schema
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating users table:', err.message);
            return;
        }
        console.log('✅ Users table created successfully');
        
        // Create other required tables
        createOtherTables(db);
    });
}

function recreateUsersTable(db) {
    console.log('\n🔧 Recreating users table with correct structure...');
    
    // Backup existing users if possible
    db.all('SELECT * FROM users', [], (err, users) => {
        // Drop and recreate the table
        db.run('DROP TABLE IF EXISTS users', (err) => {
            if (err) {
                console.error('❌ Error dropping users table:', err.message);
                return;
            }
            
            // Create with correct structure
            db.run(`CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('❌ Error creating users table:', err.message);
                    return;
                }
                console.log('✅ Users table recreated successfully');
                
                // Restore users if we had any
                if (!err && users && users.length) {
                    console.log(`⏳ Restoring ${users.length} users...`);
                    
                    // Prepare insert statement
                    const insertUser = db.prepare(`
                        INSERT INTO users (first_name, last_name, email, password, phone, address)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `);
                    
                    let restoredCount = 0;
                    users.forEach(user => {
                        try {
                            // Handle different schema formats
                            const firstName = user.first_name || (user.full_name ? user.full_name.split(' ')[0] : 'Unknown');
                            const lastName = user.last_name || (user.full_name ? user.full_name.split(' ')[1] || '' : '');
                            const password = user.password || user.password_hash || 'CANNOT_LOGIN';
                            
                            insertUser.run(
                                firstName,
                                lastName,
                                user.email,
                                password,
                                user.phone || null,
                                user.address || null
                            );
                            restoredCount++;
                        } catch (error) {
                            console.warn(`⚠️ Could not restore user ${user.email}:`, error.message);
                        }
                    });
                    
                    console.log(`✅ Restored ${restoredCount} out of ${users.length} users`);
                    insertUser.finalize();
                }
                
                // Create other tables
                createOtherTables(db);
            });
        });
    });
}

function createOtherTables(db) {
    console.log('\n🔧 Creating other required tables...');
    
    // Create documents table
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        analysis_results TEXT,
        analyzed BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating documents table:', err.message);
        } else {
            console.log('✅ Documents table created successfully');
        }
    });
    
    // Create SOS alerts table
    db.run(`CREATE TABLE IF NOT EXISTS sos_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        alert_type TEXT NOT NULL,
        description TEXT,
        location TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating sos_alerts table:', err.message);
        } else {
            console.log('✅ SOS alerts table created successfully');
        }
    });
    
    // Create cases table
    db.run(`CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        case_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating cases table:', err.message);
        } else {
            console.log('✅ Cases table created successfully');
        }
        
        // Test user registration
        testUserRegistration(db);
    });
}

async function testUserRegistration(db) {
    console.log('\n🧪 Testing user registration...');
    
    try {
        // Hash a test password
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        // Create a test user
        const testUser = {
            first_name: 'Test',
            last_name: 'User',
            email: `test${Date.now()}@example.com`,
            phone: '9876543210',
            password: hashedPassword
        };
        
        console.log('📝 Trying to insert test user...');
        
        // Determine proper column names based on table structure
        db.all('PRAGMA table_info(users)', [], (err, columns) => {
            if (err) {
                console.error('❌ Error checking users table structure:', err.message);
                finishTests(db);
                return;
            }
            
            // Check which format to use based on columns
            const hasFirstName = columns.some(c => c.name === 'first_name');
            const hasFullName = columns.some(c => c.name === 'full_name');
            const hasPasswordHash = columns.some(c => c.name === 'password_hash');
            
            let insertSql, params;
            
            if (hasFirstName) {
                // server.js format
                insertSql = `
                    INSERT INTO users (first_name, last_name, email, phone, password) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [testUser.first_name, testUser.last_name, testUser.email, testUser.phone, testUser.password];
            } else if (hasFullName) {
                // schema.sql format
                insertSql = `
                    INSERT INTO users (full_name, email, phone, ${hasPasswordHash ? 'password_hash' : 'password'})
                    VALUES (?, ?, ?, ?)
                `;
                params = [`${testUser.first_name} ${testUser.last_name}`, testUser.email, testUser.phone, testUser.password];
            } else {
                console.error('❌ Cannot determine user table format');
                finishTests(db);
                return;
            }
            
            // Insert test user
            db.run(insertSql, params, function(err) {
                if (err) {
                    console.error('❌ Error inserting test user:', err.message);
                    finishTests(db);
                } else {
                    console.log(`✅ Test user inserted successfully with ID: ${this.lastID}`);
                    
                    // Try to retrieve the inserted user
                    const testUserId = this.lastID;
                    db.get(`SELECT * FROM users WHERE id = ?`, [testUserId], (err, user) => {
                        if (err) {
                            console.error('❌ Error retrieving test user:', err.message);
                        } else if (!user) {
                            console.error('❌ Test user not found after insertion');
                        } else {
                            console.log('✅ Test user retrieved successfully:');
                            
                            // Filter out password
                            const displayUser = {...user};
                            if (displayUser.password) displayUser.password = '********';
                            if (displayUser.password_hash) displayUser.password_hash = '********';
                            
                            Object.keys(displayUser).forEach(key => {
                                console.log(`   - ${key}: ${displayUser[key]}`);
                            });
                            
                            // Test password comparison
                            testPasswordComparison(db, user, 'test123', testUserId);
                            return;
                        }
                        finishTests(db);
                    });
                }
            });
        });
    } catch (error) {
        console.error('❌ Error during user registration test:', error.message);
        finishTests(db);
    }
}

async function testPasswordComparison(db, user, plainPassword, userId) {
    console.log('\n🔐 Testing password comparison...');
    
    try {
        // Determine which field contains the password hash
        const passwordField = user.password_hash ? 'password_hash' : 'password';
        const storedHash = user[passwordField];
        
        // Compare with bcrypt
        const isMatch = await bcrypt.compare(plainPassword, storedHash);
        console.log(`${isMatch ? '✅' : '❌'} Password comparison ${isMatch ? 'successful' : 'failed'}`);
        
        // Clean up by deleting test user
        db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
            if (err) {
                console.error('❌ Error deleting test user:', err.message);
            } else {
                console.log(`✅ Test user deleted successfully`);
            }
            finishTests(db);
        });
    } catch (error) {
        console.error('❌ Error testing password comparison:', error.message);
        finishTests(db);
    }
}

function finishTests(db) {
    console.log('\n✅ Database diagnostics completed');
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`RESULTS SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    
    console.log(`
📋 If you experienced database issues:

1. The diagnostic script has checked your database structure and made 
   repairs if necessary.

2. For signup/login issues:
   - Check that the frontend forms submit to the correct API endpoints:
     - /api/auth/register for signup
     - /api/auth/login for login
   
   - Ensure the request body matches what the server expects:
     - firstName/lastName instead of first_name/last_name
     - password should be sent in plain text (will be hashed on server)
     
3. To completely reset your database:
   - Delete the file at: ${dbPath}
   - Restart your server
   - Server.js will recreate the database with the correct schema
   
4. If issues persist, check browser console for network errors and
   server console for database errors.
`);
    
    db.close(() => {
        console.log('👋 Database connection closed');
    });
}