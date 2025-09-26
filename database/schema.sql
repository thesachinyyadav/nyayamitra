-- Nyaya Mitra Database Schema
-- SQLite Database Schema for Legal Assistance Platform

-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    user_type TEXT CHECK(user_type IN ('citizen', 'lawyer', 'admin')) DEFAULT 'citizen',
    profile_image VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Cases Table
CREATE TABLE legal_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    case_number VARCHAR(50) UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'resolved', 'closed')) DEFAULT 'pending',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    assigned_lawyer_id INTEGER,
    estimated_resolution_date DATE,
    actual_resolution_date DATE,
    case_value DECIMAL(15,2),
    court_name VARCHAR(200),
    judge_name VARCHAR(100),
    next_hearing_date TIMESTAMP,
    case_documents JSON,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_lawyer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Document Analysis Table
CREATE TABLE document_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    case_id INTEGER,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    analysis_result JSON,
    confidence_score DECIMAL(3,2),
    processing_time DECIMAL(5,2),
    extracted_entities JSON,
    summary TEXT,
    key_points JSON,
    legal_references JSON,
    status TEXT CHECK(status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
    error_message TEXT,
    processed_by_ai_model VARCHAR(100),
    language_detected VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL
);

-- SOS Alerts Table
CREATE TABLE sos_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    alert_type TEXT CHECK(alert_type IN ('police', 'medical', 'legal', 'fire', 'general')) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    description TEXT NOT NULL,
    emergency_contacts JSON,
    status TEXT CHECK(status IN ('active', 'responded', 'resolved', 'cancelled')) DEFAULT 'active',
    response_time TIMESTAMP,
    resolved_at TIMESTAMP,
    responder_id INTEGER,
    response_notes TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    is_test_alert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Civic Feedback Table
CREATE TABLE civic_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200),
    attachments JSON,
    status TEXT CHECK(status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')) DEFAULT 'submitted',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    response TEXT,
    responded_by INTEGER,
    department VARCHAR(100),
    estimated_resolution_date DATE,
    resolved_at TIMESTAMP,
    satisfaction_rating INTEGER CHECK(satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    is_anonymous BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Whistleblower Reports Table
CREATE TABLE whistleblower_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER, -- Can be NULL for anonymous reports
    report_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    evidence_files JSON,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status TEXT CHECK(status IN ('submitted', 'investigating', 'verified', 'resolved', 'dismissed')) DEFAULT 'submitted',
    assigned_investigator INTEGER,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    organization_involved VARCHAR(200),
    estimated_impact TEXT,
    investigation_notes TEXT,
    resolution_summary TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_investigator) REFERENCES users(id) ON DELETE SET NULL
);

-- Legal Consultations Table
CREATE TABLE legal_consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    lawyer_id INTEGER,
    consultation_type TEXT CHECK(consultation_type IN ('chat', 'video', 'phone', 'in_person')) DEFAULT 'chat',
    scheduled_at TIMESTAMP,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT CHECK(status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
    consultation_fee DECIMAL(10,2),
    payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    notes TEXT,
    consultation_summary TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    feedback TEXT,
    documents_shared JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    category VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_pushed BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    action_data JSON,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    expires_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Sessions Table (for JWT token management)
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Log Table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Legal Resources Table
CREATE TABLE legal_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT,
    resource_type TEXT CHECK(resource_type IN ('article', 'form', 'template', 'guide', 'faq')) NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags JSON,
    file_url VARCHAR(500),
    download_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Case Updates Table
CREATE TABLE case_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    update_type TEXT CHECK(update_type IN ('status_change', 'document_added', 'hearing_scheduled', 'payment', 'note')) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    attachments JSON,
    is_milestone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System Settings Table
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT CHECK(setting_type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_legal_cases_user_id ON legal_cases(user_id);
CREATE INDEX idx_legal_cases_status ON legal_cases(status);
CREATE INDEX idx_legal_cases_case_number ON legal_cases(case_number);
CREATE INDEX idx_document_analysis_user_id ON document_analysis(user_id);
CREATE INDEX idx_document_analysis_case_id ON document_analysis(case_id);
CREATE INDEX idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX idx_civic_feedback_user_id ON civic_feedback(user_id);
CREATE INDEX idx_civic_feedback_status ON civic_feedback(status);
CREATE INDEX idx_whistleblower_reports_reporter_id ON whistleblower_reports(reporter_id);
CREATE INDEX idx_whistleblower_reports_status ON whistleblower_reports(status);
CREATE INDEX idx_legal_consultations_client_id ON legal_consultations(client_id);
CREATE INDEX idx_legal_consultations_lawyer_id ON legal_consultations(lawyer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'Nyaya Mitra', 'string', 'Website name', true),
('site_description', 'Comprehensive legal assistance platform', 'string', 'Website description', true),
('max_file_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', false),
('allowed_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx"]', 'json', 'Allowed file types for upload', false),
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications', false),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', false),
('api_rate_limit', '100', 'number', 'API requests per 15 minutes per IP', false);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, user_type, is_verified) VALUES
('admin', 'admin@nyayamitra.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKBYOHh0owZ7QjES', 'System Administrator', 'admin', true);