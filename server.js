const express = require('express');
const path = require('path');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Express app setup
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection with absolute path
const dbPath = path.join(__dirname, 'data', 'nyaya_mitra.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', err => {
            if (err) console.warn('Warning: Could not enable foreign keys');
            else console.log('Foreign key constraints enabled');
            
            // Initialize database tables if they don't exist
            initDatabase();
        });
    }
});

// Initialize database tables
function initDatabase() {
    // Create users table if it doesn't exist
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
    )`);
    
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
    )`);
    
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
    )`);
    
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
    )`);
    
    console.log('Database tables initialized');
}

// JWT secret key
const JWT_SECRET = 'nyaya_mitra_secret_key'; // In production, use environment variables

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '.'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));

// API Routes

// Database status check
app.get('/api/db/status', (req, res) => {
    res.json({ status: 'connected' });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        
        // Extract fields, allowing for different casing/naming conventions
        const firstName = req.body.firstName || req.body.first_name || req.body.firstname;
        const lastName = req.body.lastName || req.body.last_name || req.body.lastname;
        const email = req.body.email;
        const phone = req.body.phone || req.body.phoneNumber;
        const password = req.body.password;
        
        // Validate input
        if (!firstName || !lastName || !email || !password) {
            console.log('Registration validation failed - missing fields');
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided',
                details: {
                    firstName: !firstName ? 'First name is required' : null,
                    lastName: !lastName ? 'Last name is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }
        
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Database error during user lookup:', err.message);
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }
            
            if (user) {
                console.log('User already exists with email:', email);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already in use', 
                    field: 'email' 
                });
            }
            
            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);
                console.log('Password hashed successfully');
                
                // Insert user into database
                const sql = `INSERT INTO users (first_name, last_name, email, phone, password) 
                            VALUES (?, ?, ?, ?, ?)`;
                db.run(sql, [firstName, lastName, email, phone || null, hashedPassword], function(err) {
                    if (err) {
                        console.error('Error inserting user into database:', err.message);
                        return res.status(500).json({ success: false, message: 'Error registering user', error: err.message });
                    }
                    
                    console.log('User registered successfully with ID:', this.lastID);
                    
                    // Generate JWT token for the new user
                    const token = jwt.sign(
                        { id: this.lastID, email: email },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );
                    
                    res.json({ 
                        success: true, 
                        message: 'User registered successfully',
                        userId: this.lastID,
                        token: token
                    });
                });
            } catch (error) {
                console.error('Error during password hashing:', error);
                res.status(500).json({ success: false, message: 'Error hashing password', error: error.message });
            }
        });
    } catch (error) {
        console.error('Server error during registration:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// User Login
app.post('/api/auth/login', (req, res) => {
    try {
        console.log('Login request received:', { email: req.body.email });
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            console.log('Login validation failed - missing fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required',
                details: {
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }
        
        // Find user by email
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Database error during login:', err.message);
                return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }
            
            if (!user) {
                console.log('Login failed - user not found for email:', email);
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            
            console.log('User found, comparing passwords');
            
            try {
                // Compare password
                const isPasswordValid = await bcrypt.compare(password, user.password);
                
                if (!isPasswordValid) {
                    console.log('Login failed - invalid password for email:', email);
                    return res.status(401).json({ success: false, message: 'Invalid email or password' });
                }
                
                console.log('Password validated, generating token');
                
                // Generate JWT token
                const token = jwt.sign(
                    { id: user.id, email: user.email, firstName: user.first_name },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                // Update last login timestamp if field exists
                db.get('PRAGMA table_info(users)', [], (schemaErr, columns) => {
                    const hasLastLogin = columns && columns.some(col => col.name === 'last_login');
                    
                    if (hasLastLogin) {
                        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id], function(updateErr) {
                            if (updateErr) {
                                console.warn('Failed to update last_login:', updateErr.message);
                            }
                        });
                    }
                    
                    console.log('Login successful for user ID:', user.id);
                    
                    res.json({
                        success: true,
                        message: 'Login successful',
                        token: token,
                        user: {
                            id: user.id,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            email: user.email
                        }
                    });
                });
                
            } catch (error) {
                console.error('Error comparing passwords:', error);
                res.status(500).json({ success: false, message: 'Authentication error', error: error.message });
            }
        });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, (req, res) => {
    // Get user details from database using req.user.id
    db.get('SELECT id, first_name, last_name, email, phone, address FROM users WHERE id = ?', 
        [req.user.id], (err, user) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            address: user.address
        });
    });
});

// Get User Documents
app.get('/api/documents/user-documents', authenticateToken, (req, res) => {
    db.all('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC', 
        [req.user.id], (err, documents) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.json(documents || []);
    });
});

// Save Document Analysis
app.post('/api/documents/save-analysis', authenticateToken, (req, res) => {
    try {
        const { filename, fileType, analysisResults } = req.body;
        
        if (!filename || !fileType) {
            return res.status(400).json({ success: false, message: 'Filename and file type are required' });
        }
        
        const sql = `INSERT INTO documents (user_id, filename, file_type, analysis_results, analyzed)
                    VALUES (?, ?, ?, ?, ?)`;
        
        db.run(sql, [
            req.user.id,
            filename,
            fileType,
            analysisResults || null,
            analysisResults ? 1 : 0
        ], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ success: false, message: 'Error saving document' });
            }
            
            res.json({
                success: true,
                message: 'Document saved successfully',
                documentId: this.lastID
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create SOS Alert
app.post('/api/sos/create', (req, res) => {
    try {
        const { alertType, description, location } = req.body;
        const userId = req.headers.authorization ? 
            jwt.decode(req.headers.authorization.split(' ')[1])?.id : null;
        
        if (!alertType) {
            return res.status(400).json({ success: false, message: 'Alert type is required' });
        }
        
        const sql = `INSERT INTO sos_alerts (user_id, alert_type, description, location)
                    VALUES (?, ?, ?, ?)`;
        
        db.run(sql, [userId, alertType, description, JSON.stringify(location)], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ success: false, message: 'Error creating SOS alert' });
            }
            
            res.json({
                success: true,
                message: 'SOS alert created successfully',
                alertId: this.lastID
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get User SOS Alerts
app.get('/api/sos/user-alerts', authenticateToken, (req, res) => {
    db.all('SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY created_at DESC', 
        [req.user.id], (err, alerts) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.json(alerts || []);
    });
});

// Submit Whistleblower Report
app.post('/api/whistleblower/submit', (req, res) => {
    try {
        const { type, title, description, location, anonymity } = req.body;
        const userId = req.headers.authorization ? 
            jwt.decode(req.headers.authorization.split(' ')[1])?.id : null;
        
        if (!type || !title || !description) {
            return res.status(400).json({ success: false, message: 'Type, title and description are required' });
        }
        
        // For simplicity, this endpoint just returns success
        // In a real app, you'd save this to a whistleblower_reports table
        res.json({
            success: true,
            message: 'Whistleblower report submitted successfully',
            reportId: Date.now()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Submit Civic Feedback
app.post('/api/feedback/submit', (req, res) => {
    try {
        const { category, title, description, location } = req.body;
        const userId = req.headers.authorization ? 
            jwt.decode(req.headers.authorization.split(' ')[1])?.id : null;
        
        if (!category || !title || !description) {
            return res.status(400).json({ success: false, message: 'Category, title and description are required' });
        }
        
        // For simplicity, this endpoint just returns success
        // In a real app, you'd save this to a civic_feedback table
        res.json({
            success: true,
            message: 'Civic feedback submitted successfully',
            feedbackId: Date.now()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Submit Contact Message
app.post('/api/contact/submit', (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email and message are required' });
        }
        
        // For simplicity, this endpoint just returns success
        // In a real app, you'd save this to a contact_messages table
        res.json({
            success: true,
            message: 'Contact message sent successfully',
            messageId: Date.now()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Nyaya Mitra Server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
});

// Close database connection when server stops
process.on('SIGINT', () => {
    db.close();
    console.log('Database connection closed');
    process.exit(0);
});

module.exports = { app, server };