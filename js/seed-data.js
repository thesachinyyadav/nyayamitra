/**
 * Nyaya Mitra Database Seed Script
 * 
 * This script populates the database with realistic Indian sample data:
 * - Users (citizens, lawyers, and admin)
 * - Legal cases
 * - Documents
 * - SOS alerts
 * - Civic feedback
 * - Whistleblower reports
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Path to database file
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Indian sample data
const indianSampleData = {
    // Indian users with realistic data
    users: [
        {
            first_name: 'Arjun',
            last_name: 'Sharma',
            email: `arjun.sharma${Date.now()}@gmail.com`,
            password: 'Password@123',
            phone: '+91 9876543210',
            address: 'B-303, Prestige Apartments, Koramangala, Bangalore, Karnataka 560034'
        },
        {
            first_name: 'Priya',
            last_name: 'Patel',
            email: `priya.patel${Date.now()+1}@outlook.com`,
            password: 'SecurePwd#456',
            phone: '+91 8765432109',
            address: '42, Park Street, Kolkata, West Bengal 700016'
        },
        {
            first_name: 'Sanjay',
            last_name: 'Malhotra',
            email: `sanjay.malhotra${Date.now()+10}@gmail.com`,
            password: 'SanjayM@2025',
            phone: '+91 9911223344',
            address: '503, Lodha Paradise, Thane West, Mumbai, Maharashtra 400601'
        },
        {
            first_name: 'Deepika',
            last_name: 'Iyer',
            email: `deepika.iyer${Date.now()+11}@yahoo.com`,
            password: 'Deepika!2025',
            phone: '+91 8822334455',
            address: '24, 4th Cross, Indiranagar, Bangalore, Karnataka 560038'
        },
        {
            first_name: 'Karthik',
            last_name: 'Nair',
            email: `karthik.nair${Date.now()+12}@outlook.com`,
            password: 'Karthik#123',
            phone: '+91 7733442211',
            address: 'Flat 202, Palm Groves, Alwarpet, Chennai, Tamil Nadu 600018'
        },
        {
            first_name: 'Vikram',
            last_name: 'Mehta',
            email: `vikram.mehta${Date.now()+2}@gmail.com`,
            password: 'VikMehta@789',
            phone: '+91 7654321098',
            address: 'C-12, Versova, Andheri West, Mumbai, Maharashtra 400053'
        },
        {
            first_name: 'Neha',
            last_name: 'Reddy',
            email: `neha.reddy${Date.now()+3}@yahoo.com`,
            password: 'NehaR@2025',
            phone: '+91 9876123450',
            address: 'Plot 78, Jubilee Hills, Hyderabad, Telangana 500033'
        },
        {
            first_name: 'Rajesh',
            last_name: 'Kumar',
            email: `rajesh.kumar${Date.now()+4}@hotmail.com`,
            password: 'RajKum@2025',
            phone: '+91 9988776655',
            address: '15, Civil Lines, Delhi 110054'
        },
        {
            first_name: 'Aisha',
            last_name: 'Khan',
            email: `aisha.khan${Date.now()+5}@gmail.com`,
            password: 'AishaK@2025',
            phone: '+91 8877665544',
            address: '7-B, Hazratganj, Lucknow, Uttar Pradesh 226001'
        },
        {
            first_name: 'Kavita',
            last_name: 'Joshi',
            email: `kavita.joshi${Date.now()+6}@advocate.com`,
            password: 'Adv@Kavita2025',
            phone: '+91 7766554433',
            address: '145, MG Road, Pune, Maharashtra 411001',
            user_type: 'lawyer'
        },
        {
            first_name: 'Amit',
            last_name: 'Desai',
            email: `amit.desai${Date.now()+7}@legalpractice.com`,
            password: 'LegalAmit@2025',
            phone: '+91 6655443322',
            address: '222, Sector 17, Chandigarh 160017',
            user_type: 'lawyer'
        },
        {
            first_name: 'Divya',
            last_name: 'Singh',
            email: `divya.singh${Date.now()+8}@advocate.org`,
            password: 'AdvDs@2025',
            phone: '+91 8899776655',
            address: '37, Civil Court Road, Ahmedabad, Gujarat 380001',
            user_type: 'lawyer'
        },
        {
            first_name: 'Suresh',
            last_name: 'Menon',
            email: `admin${Date.now()+9}@nyayamitra.com`,
            password: 'Admin@2025',
            phone: '+91 9999888877',
            address: '1, Justice Avenue, Bangalore, Karnataka 560001',
            user_type: 'admin'
        },
        {
            first_name: 'Pradeep',
            last_name: 'Varma',
            email: `pradeep.varma${Date.now()+13}@advocate.com`,
            password: 'PradeepLaw@2025',
            phone: '+91 9944556677',
            address: '78, Lawyers Colony, Panjagutta, Hyderabad, Telangana 500082',
            user_type: 'lawyer'
        },
        {
            first_name: 'Meera',
            last_name: 'Chadha',
            email: `meera.chadha${Date.now()+14}@legalaid.org`,
            password: 'MeeraC@2025',
            phone: '+91 8855667788',
            address: '15, High Court Lane, Kolkata, West Bengal 700001',
            user_type: 'lawyer'
        },
        {
            first_name: 'Rajan',
            last_name: 'Pillai',
            email: `rajan${Date.now()+15}@nyayamitra.com`,
            password: 'RajanAdmin@2025',
            phone: '+91 7788990011',
            address: '45, Secretariat Road, Chennai, Tamil Nadu 600009',
            user_type: 'admin'
        }
    ],
    
    // Indian legal cases with realistic scenarios
    cases: [
        {
            case_number: 'NYM-2025-001',
            title: 'Property Boundary Dispute - Koramangala',
            description: 'Dispute regarding property boundaries with adjacent plot in Koramangala area, Bangalore. Neighbor has constructed a wall that encroaches 3 feet into my property according to the registered sale deed. Municipal records show different boundaries than what is being claimed.',
            status: 'in_progress',
            priority: 'medium'
        },
        {
            case_number: 'NYM-2025-002',
            title: 'Consumer Rights Violation - E-commerce Refund',
            description: 'Product defect issue with major e-commerce platform. Purchased a smartphone worth ₹45,000 which had manufacturing defects. Company refusing replacement despite being within warranty period of 1 year. Seeking consumer protection redressal.',
            status: 'pending',
            priority: 'low'
        },
        {
            case_number: 'NYM-2025-008',
            title: 'Matrimonial Property Division',
            description: 'Seeking legal assistance for equitable division of jointly owned property after divorce. Assets include flat in Powai (Mumbai) worth approximately ₹1.2 crore, joint investments of ₹45 lakhs, and personal belongings. Need guidance on legal provisions under Hindu Marriage Act.',
            status: 'pending',
            priority: 'medium'
        },
        {
            case_number: 'NYM-2025-009',
            title: 'Copyright Infringement - Mobile Application UI',
            description: 'My mobile application design and UI has been copied by a competitor startup based in Pune. Our app was launched in April 2025, and the infringing app appeared in August 2025 with nearly identical interface, features and even similar logo design. Have documentation of our development timeline and design process.',
            status: 'in_progress',
            priority: 'high'
        },
        {
            case_number: 'NYM-2025-010',
            title: 'Bank Loan Default Harassment',
            description: 'Education loan of ₹8 lakhs from PSU bank was defaulted due to job loss during economic downturn. Despite communication about situation and request for restructuring, recovery agents have been harassing family members, visiting home at inappropriate hours, and using threatening language.',
            status: 'pending',
            priority: 'critical'
        },
        {
            case_number: 'NYM-2025-003',
            title: 'Workplace Harassment Claim',
            description: 'Facing continuous workplace harassment at a multinational company in Mumbai. Documentation of multiple incidents provided. HR has failed to take adequate action despite formal complaints.',
            status: 'pending',
            priority: 'high'
        },
        {
            case_number: 'NYM-2025-004',
            title: 'Motor Vehicle Accident Compensation',
            description: 'Hit by a delivery truck on NH-8 near Gurgaon on August 15, 2025. Suffered fractures and required hospitalization for 3 weeks. Insurance company offering inadequate compensation. Medical expenses exceed ₹3 lakhs.',
            status: 'in_progress',
            priority: 'medium'
        },
        {
            case_number: 'NYM-2025-005',
            title: 'Rental Agreement Dispute - Pune',
            description: 'Landlord refusing to return security deposit of ₹1,50,000 after termination of rental agreement in Pune. Property vacated in same condition as documented at move-in, but landlord claims damages without evidence.',
            status: 'pending',
            priority: 'medium'
        },
        {
            case_number: 'NYM-2025-006',
            title: 'Unpaid Salary and Benefits',
            description: 'Former employer in Hyderabad has not paid final 2 months of salary totaling ₹1,20,000 and pending benefits after company downsizing. Multiple follow-ups via email and phone have been ignored.',
            status: 'in_progress',
            priority: 'high'
        },
        {
            case_number: 'NYM-2025-007',
            title: 'Medical Negligence - Hospital Treatment',
            description: 'Wrong medication administered at private hospital in Delhi resulting in adverse reactions and extended hospitalization. Medical records confirm the error but hospital refusing to acknowledge negligence.',
            status: 'pending',
            priority: 'critical'
        }
    ],
    
    // Documents for analysis
    documents: [
        {
            filename: 'property_deed_bangalore.pdf',
            file_type: 'application/pdf',
            analysis_results: JSON.stringify({
                key_findings: [
                    'Property boundaries clearly defined in Section 4.2',
                    'Discrepancy found between sale deed and municipal records',
                    'Survey numbers don\'t match with neighbor\'s documentation',
                    'Easement rights not clearly specified'
                ],
                suggested_actions: [
                    'Request resurvey from BDA',
                    'File RTI for complete municipal records',
                    'Consider boundary wall agreement with neighbor'
                ],
                risk_assessment: 'Medium risk of prolonged legal dispute'
            }),
            analyzed: true
        },
        {
            filename: 'divorce_settlement_draft.pdf',
            file_type: 'application/pdf',
            analysis_results: JSON.stringify({
                key_findings: [
                    'Inequitable division of property in Section 3',
                    'Child custody arrangement lacks detailed visitation schedule',
                    'Maintenance amount below standard guidelines',
                    'No provision for education expenses'
                ],
                suggested_actions: [
                    'Renegotiate property division terms',
                    'Create detailed visitation schedule',
                    'Calculate maintenance as per Supreme Court guidelines',
                    'Include education expense sharing clause'
                ],
                risk_assessment: 'High risk of court rejection without modifications'
            }),
            analyzed: true
        },
        {
            filename: 'startup_founders_agreement.pdf',
            file_type: 'application/pdf',
            analysis_results: JSON.stringify({
                key_findings: [
                    'Equity vesting schedule ambiguous',
                    'Intellectual property assignment clauses too broad',
                    'Exit clauses favor majority shareholder excessively',
                    'Non-compete duration of 5 years likely unenforceable'
                ],
                suggested_actions: [
                    'Clearly define monthly/quarterly vesting schedule',
                    'Narrow IP assignment to company-related work only',
                    'Balance exit provisions for all founders',
                    'Reduce non-compete to 1-2 years maximum'
                ],
                risk_assessment: 'Multiple clauses potentially unenforceable, high litigation risk'
            }),
            analyzed: true
        },
        {
            filename: 'employment_contract_tech.pdf',
            file_type: 'application/pdf',
            analysis_results: JSON.stringify({
                key_findings: [
                    'Non-compete clause exceeds reasonable limitations',
                    'Termination clause requires 3 months notice',
                    'Intellectual property clause extends beyond employment scope',
                    'Variable pay terms are ambiguous'
                ],
                suggested_actions: [
                    'Negotiate non-compete clause geographic limitation',
                    'Request clarification on variable pay calculation',
                    'Add specific IP exclusions for personal projects'
                ],
                risk_assessment: 'Several clauses may be legally unenforceable in Indian courts'
            }),
            analyzed: true
        },
        {
            filename: 'insurance_claim_documents.pdf',
            file_type: 'application/pdf',
            analysis_results: JSON.stringify({
                key_findings: [
                    'Claim filing deadline missed by 3 days',
                    'Medical documentation complete and relevant',
                    'Policy covers the claimed condition with 80% reimbursement',
                    'Pre-existing condition clause not applicable'
                ],
                suggested_actions: [
                    'Request deadline extension with documented reason for delay',
                    'Highlight relevant policy sections in appeal',
                    'Include additional medical opinion on severity'
                ],
                risk_assessment: 'Good chance of successful appeal despite missed deadline'
            }),
            analyzed: true
        },
        {
            filename: 'rental_agreement_pune.pdf',
            file_type: 'application/pdf',
            analysis_results: null,
            analyzed: false
        },
        {
            filename: 'vehicle_accident_report.pdf',
            file_type: 'application/pdf',
            analysis_results: null,
            analyzed: false
        }
    ],
    
    // SOS alerts with Indian context
    sos_alerts: [
        {
            alert_type: 'legal',
            description: 'Being detained at mall security office in Forum Mall, Bangalore for alleged shoplifting. Need immediate legal assistance. No evidence against me.',
            location: JSON.stringify({
                lat: 12.9716,
                lng: 77.5946,
                address: 'Forum Mall, Koramangala, Bangalore'
            }),
            status: 'active'
        },
        {
            alert_type: 'police',
            description: 'Witnessing an assault incident near Howrah Bridge. Urgent police assistance needed. Two individuals fighting, one appears severely injured.',
            location: JSON.stringify({
                lat: 22.5726,
                lng: 88.3639,
                address: 'Near Howrah Bridge, Kolkata'
            }),
            status: 'active'
        },
        {
            alert_type: 'legal',
            description: 'Arrested during peaceful protest at Jantar Mantar. Police not allowing phone call to family or lawyer. Need urgent legal representation.',
            location: JSON.stringify({
                lat: 28.6292,
                lng: 77.2100,
                address: 'Jantar Mantar, New Delhi'
            }),
            status: 'active'
        },
        {
            alert_type: 'police',
            description: 'Hit and run accident at Marine Drive. Elderly pedestrian hit by white Innova. Vehicle number plate partially noted as MH01-XX-5432. Driver fled scene towards Nariman Point.',
            location: JSON.stringify({
                lat: 18.9438,
                lng: 72.8231,
                address: 'Marine Drive, Mumbai'
            }),
            status: 'active'
        },
        {
            alert_type: 'medical',
            description: 'Medical emergency at Lajpat Nagar Metro Station. Woman collapsed on platform with possible seizure. Need immediate medical assistance.',
            location: JSON.stringify({
                lat: 28.5701,
                lng: 77.2373,
                address: 'Lajpat Nagar Metro Station, Delhi'
            }),
            status: 'pending'
        },
        {
            alert_type: 'legal',
            description: 'Traffic police demanding bribe for alleged signal violation at Silk Board junction. Need legal guidance immediately.',
            location: JSON.stringify({
                lat: 12.9177,
                lng: 77.6213,
                address: 'Silk Board Junction, Bangalore'
            }),
            status: 'resolved'
        },
        {
            alert_type: 'medical',
            description: 'Medical emergency at Mumbai Central Station. Person collapsed on platform 3. Appears to be cardiac issue. Medical assistance requested.',
            location: JSON.stringify({
                lat: 18.9692,
                lng: 72.8193,
                address: 'Mumbai Central Railway Station, Mumbai'
            }),
            status: 'resolved'
        }
    ],
    
    // Civic feedback with Indian context
    civic_feedback: [
        {
            category: 'Municipal Services',
            subject: 'Street Light Maintenance - Koramangala',
            description: 'Multiple street lights not functioning on 80 Feet Road in Koramangala 8th Block causing safety concerns for pedestrians and vehicles during night hours. At least 8 lights are non-functional between the Forum Mall junction and BDA Complex.',
            location: 'Koramangala 8th Block, Bangalore, Karnataka',
            priority: 'medium',
            status: 'submitted'
        },
        {
            category: 'Traffic Management',
            subject: 'Traffic Signal Malfunction - Jubilee Hills',
            description: 'Traffic signal at Jubilee Hills Road No. 10 junction has been malfunctioning for the past week, causing traffic congestion especially during peak hours (9-11 AM and 5-8 PM). Requires immediate attention.',
            location: 'Jubilee Hills, Hyderabad, Telangana',
            priority: 'high',
            status: 'in_progress'
        },
        {
            category: 'Roads and Infrastructure',
            subject: 'Dangerous Pothole - Mumbai Western Express Highway',
            description: 'Large pothole (approximately 3 feet diameter, 8 inches deep) on Western Express Highway near Andheri flyover causing traffic hazards and vehicle damage. Located on northbound lane approximately 200 meters after Andheri East metro station exit.',
            location: 'Western Express Highway, Andheri East, Mumbai, Maharashtra',
            priority: 'critical',
            status: 'submitted'
        },
        {
            category: 'Sanitation',
            subject: 'Blocked Drainage - T. Nagar',
            description: 'Main drainage line blocked in T. Nagar residential area causing water logging during recent rains. Stagnant water has been present for over 5 days creating mosquito breeding grounds and health hazards. Area covering approximately 4 streets near Panagal Park.',
            location: 'T. Nagar, Chennai, Tamil Nadu',
            priority: 'high',
            status: 'submitted'
        },
        {
            category: 'Public Health',
            subject: 'Dengue Prevention Measures - Sector 45',
            description: 'Recent increase in dengue cases in Sector 45. At least 12 confirmed cases in last two weeks. Request urgent fogging and preventive measures in the entire sector, especially around parks and open areas where water may collect.',
            location: 'Sector 45, Noida, Uttar Pradesh',
            priority: 'critical',
            status: 'in_progress'
        },
        {
            category: 'Public Transport',
            subject: 'Bus Route Frequency - Salt Lake',
            description: 'Bus route 44A connecting Salt Lake to Howrah has very low frequency during afternoon hours. Currently only one bus every 45-60 minutes between 2-5 PM. Request to increase frequency to at least one bus every 30 minutes.',
            location: 'Salt Lake City, Kolkata, West Bengal',
            priority: 'low',
            status: 'submitted'
        },
        {
            category: 'Waste Management',
            subject: 'Irregular Garbage Collection - Aundh',
            description: 'Garbage collection in Aundh D Block has been irregular for the past month. Waste bins overflowing causing health hazards. Previously collection was daily, now happening only 2-3 times per week.',
            location: 'Aundh, Pune, Maharashtra',
            priority: 'high',
            status: 'submitted'
        },
        {
            category: 'Water Supply',
            subject: 'Low Water Pressure - Civil Lines',
            description: 'Experiencing very low water pressure in Civil Lines area for the past 2 weeks. Supply only available for 1-2 hours instead of the scheduled 4 hours. Multiple households affected in the neighborhood.',
            location: 'Civil Lines, Delhi',
            priority: 'medium',
            status: 'in_progress'
        }
    ],
    
    // Whistleblower reports
    whistleblower_reports: [
        {
            report_id: 'WB-2025-001',
            title: 'Corporate Tax Evasion - Tech Company',
            description: 'Large technology company headquartered in Bangalore is creating fake service invoices to offshore entities to reduce taxable income in India. Estimated tax evasion of approximately ₹45 crores over 3 years. Have internal documentation as evidence.',
            category: 'Financial Fraud',
            is_anonymous: true,
            status: 'investigating',
            severity: 'high',
            organization_involved: 'Tech Solutions India Pvt. Ltd.'
        },
        {
            report_id: 'WB-2025-002',
            title: 'Food Safety Violations - Restaurant Chain',
            description: 'Popular restaurant chain in Delhi NCR is using expired ingredients and mislabeling food preparation dates. Manager instructed staff to change date labels. Health violations observed at 3 different branch locations. Have photographs as evidence.',
            category: 'Public Health',
            is_anonymous: false,
            status: 'submitted',
            severity: 'critical',
            organization_involved: 'Tasty Bites Restaurant Chain'
        },
        {
            report_id: 'WB-2025-004',
            title: 'Pharmaceutical Medicine Adulteration',
            description: 'Major pharmaceutical company manufacturing blood pressure medication with substandard active ingredients. Quality testing results are being manipulated to show compliance. Working as QA manager and have evidence of both raw material testing and final product variation.',
            category: 'Public Health',
            is_anonymous: true,
            status: 'submitted',
            severity: 'critical',
            organization_involved: 'LifePharm Laboratories'
        },
        {
            report_id: 'WB-2025-005',
            title: 'Government Tender Manipulation',
            description: 'State highway project tender worth ₹350 crores was rigged by changing technical qualification criteria overnight before submission deadline. Only one company qualified after changes. Have copies of both original and modified tender documents showing suspicious amendments.',
            category: 'Government Corruption',
            is_anonymous: true,
            status: 'investigating',
            severity: 'high',
            organization_involved: 'State Highway Department & Roadways Infrastructure Corp'
        },
        {
            report_id: 'WB-2025-006',
            title: 'Environmental Compliance Violations',
            description: 'Chemical factory in industrial area bypassing effluent treatment requirements by releasing toxic waste directly into river during night hours (1-4 AM). Have collected water samples showing dangerous levels of heavy metals and documented pattern of illegal discharge over 3 months.',
            category: 'Environmental Hazard',
            is_anonymous: false,
            status: 'submitted',
            severity: 'critical',
            organization_involved: 'ChemTech Industries Ltd.'
        },
        {
            report_id: 'WB-2025-003',
            title: 'Employee Safety Regulations Ignored - Manufacturing Plant',
            description: 'Manufacturing facility in Gujarat is bypassing mandatory safety protocols for chemical handling. Required protective equipment not provided to workers. Several unreported worker injuries in past 6 months. Have documented safety protocol violations.',
            category: 'Workplace Safety',
            is_anonymous: true,
            status: 'investigating',
            severity: 'high',
            organization_involved: 'Industrial Products Manufacturing Ltd.'
        }
    ],
    
    // Legal consultations
    legal_consultations: [
        {
            consultation_type: 'video',
            scheduled_at: '2025-10-05 14:00:00',
            duration_minutes: 45,
            status: 'scheduled',
            consultation_fee: 2500,
            payment_status: 'paid',
            notes: 'Property dispute consultation regarding ancestral property in Chennai'
        },
        {
            consultation_type: 'in_person',
            scheduled_at: '2025-09-30 11:30:00',
            duration_minutes: 60,
            status: 'completed',
            consultation_fee: 3500,
            payment_status: 'paid',
            notes: 'Review of employment termination letter and severance package offer',
            follow_up_required: true,
            follow_up_date: '2025-10-15'
        },
        {
            consultation_type: 'video',
            scheduled_at: '2025-09-29 10:00:00',
            duration_minutes: 30,
            status: 'scheduled',
            consultation_fee: 1800,
            payment_status: 'paid',
            notes: 'Consultation regarding trademark infringement by competitor business'
        },
        {
            consultation_type: 'in_person',
            scheduled_at: '2025-10-01 15:30:00',
            duration_minutes: 90,
            status: 'scheduled',
            consultation_fee: 5000,
            payment_status: 'pending',
            notes: 'Review of commercial lease agreement for new restaurant premises in Mumbai'
        },
        {
            consultation_type: 'chat',
            scheduled_at: '2025-09-28 17:15:00',
            duration_minutes: 30,
            status: 'completed',
            consultation_fee: 1200,
            payment_status: 'paid',
            notes: 'Initial consultation on tenant rights for apartment maintenance issues',
            follow_up_required: true,
            follow_up_date: '2025-10-03'
        },
        {
            consultation_type: 'video',
            scheduled_at: '2025-10-10 11:00:00',
            duration_minutes: 45,
            status: 'scheduled',
            consultation_fee: 2800,
            payment_status: 'pending',
            notes: 'Follow-up on divorce proceedings and child custody arrangements'
        },
        {
            consultation_type: 'chat',
            scheduled_at: '2025-09-28 16:00:00',
            duration_minutes: 30,
            status: 'scheduled',
            consultation_fee: 1500,
            payment_status: 'pending',
            notes: 'Initial assessment of medical negligence case against private hospital'
        }
    ]
};

// Connect to database
console.log(`\n${'='.repeat(80)}`);
console.log(`NYAYA MITRA DATABASE SEED - INDIAN SAMPLE DATA`);
console.log(`${'='.repeat(80)}`);
console.log('\n🔌 Connecting to database...');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    
    console.log('✅ Successfully connected to SQLite database');
    
    try {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // Start seeding data
        await seedData(db);
        
        // Close database connection
        db.close(() => {
            console.log('\n👋 Database connection closed');
            console.log(`\n${'='.repeat(80)}`);
        });
    } catch (error) {
        console.error('❌ Error during database seeding:', error);
        db.close();
    }
});

async function seedData(db) {
    // Check if data already exists
    const existingDataCount = await getTableCount(db, 'users');
    
    if (existingDataCount > 10) {
        console.log(`\n⚠️ Found ${existingDataCount} existing users in database.`);
        const answer = await promptUser("Do you want to proceed and potentially create duplicate entries? (y/n): ");
        
        if (answer.toLowerCase() !== 'y') {
            console.log('❌ Seeding canceled by user.');
            return;
        }
        console.log('✅ Proceeding with data seeding...');
    }
    
    // Check if users table exists
    const tableCheck = await checkTableExists(db, 'users');
    
    if (tableCheck) {
        console.log('Found existing users table, checking structure...');
        
        // Check if user_type column exists
        const columnCheck = await checkColumnExists(db, 'users', 'user_type');
        
        if (!columnCheck) {
            console.log('Adding user_type column to users table...');
            try {
                await runQuery(db, `ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'citizen'`);
                console.log('✅ user_type column added successfully');
            } catch (err) {
                console.error('❌ Error adding user_type column:', err.message);
            }
        } else {
            console.log('✅ user_type column already exists');
        }
    } else {
        // Create users table if not exists
        await runQuery(db, `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            user_type TEXT DEFAULT 'citizen',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
    
    // Create cases table if not exists
    await runQuery(db, `CREATE TABLE IF NOT EXISTS cases (
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
    
    // Create documents table if not exists
    await runQuery(db, `CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        analysis_results TEXT,
        analyzed BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // Check if sos_alerts table exists
    const sosTableExists = await checkTableExists(db, 'sos_alerts');
    if (sosTableExists) {
        console.log('Found existing sos_alerts table, checking structure...');
        
        // Check if location column exists
        const locationColumnExists = await checkColumnExists(db, 'sos_alerts', 'location');
        if (!locationColumnExists) {
            console.log('Adding location column to sos_alerts table...');
            try {
                await runQuery(db, `ALTER TABLE sos_alerts ADD COLUMN location TEXT`);
                console.log('✅ location column added to sos_alerts table');
            } catch (err) {
                console.error('❌ Error adding location column:', err.message);
            }
        }
    } else {
        // Create SOS alerts table if not exists
        await runQuery(db, `CREATE TABLE IF NOT EXISTS sos_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            alert_type TEXT NOT NULL,
            description TEXT,
            location TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    }
    
    // Create civic_feedback table if not exists
    await runQuery(db, `CREATE TABLE IF NOT EXISTS civic_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        category VARCHAR(100) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(200),
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // Check if whistleblower_reports table exists and has correct structure
    const wbReportsExist = await checkTableExists(db, 'whistleblower_reports');
    if (wbReportsExist) {
        console.log('Found existing whistleblower_reports table, checking structure...');
        
        // Check table structure
        try {
            // Drop and recreate the table if it doesn't have required columns
            // This approach is used because SQLite doesn't support adding multiple columns in a single statement
            await runQuery(db, `DROP TABLE IF EXISTS whistleblower_reports`);
            console.log('✅ Recreating whistleblower_reports table with proper structure');
            
            await runQuery(db, `CREATE TABLE IF NOT EXISTS whistleblower_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                report_id VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                is_anonymous BOOLEAN DEFAULT FALSE,
                status TEXT DEFAULT 'submitted',
                severity TEXT DEFAULT 'medium',
                organization_involved VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);
        } catch (err) {
            console.error('❌ Error recreating whistleblower_reports table:', err.message);
        }
    } else {
        // Create whistleblower_reports table if not exists
        await runQuery(db, `CREATE TABLE IF NOT EXISTS whistleblower_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            report_id VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(100) NOT NULL,
            is_anonymous BOOLEAN DEFAULT FALSE,
            status TEXT DEFAULT 'submitted',
            severity TEXT DEFAULT 'medium',
            organization_involved VARCHAR(200),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    }
    
    // Create legal_consultations table if not exists
    await runQuery(db, `CREATE TABLE IF NOT EXISTS legal_consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        consultation_type TEXT DEFAULT 'chat',
        scheduled_at TIMESTAMP,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT DEFAULT 'scheduled',
        consultation_fee DECIMAL(10,2),
        payment_status TEXT DEFAULT 'pending',
        notes TEXT,
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users (id),
        FOREIGN KEY (lawyer_id) REFERENCES users (id)
    )`);
    
    // Insert users
    console.log('\n👤 Inserting users...');
    const userIds = [];
    const lawyerIds = [];
    
    for (const user of indianSampleData.users) {
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            // Insert user
            const userId = await runQuery(db, 
                `INSERT OR IGNORE INTO users (first_name, last_name, email, password, phone, address, user_type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.first_name,
                    user.last_name,
                    user.email,
                    hashedPassword,
                    user.phone,
                    user.address,
                    user.user_type || 'citizen'
                ]
            );
            
            if (userId) {
                if (user.user_type === 'lawyer') {
                    lawyerIds.push(userId);
                } else if (user.user_type !== 'admin') {
                    userIds.push(userId);
                }
                console.log(`  ✅ Added user: ${user.first_name} ${user.last_name}`);
            }
        } catch (error) {
            console.error(`  ❌ Error adding user ${user.email}:`, error.message);
        }
    }
    console.log(`  ✅ Added ${userIds.length + lawyerIds.length + 1} users successfully`);
    
    // Insert cases
    if (userIds.length > 0) {
        console.log('\n📂 Inserting legal cases...');
        for (const [index, caseData] of indianSampleData.cases.entries()) {
            try {
                // Assign case to a random user
                const userId = userIds[index % userIds.length];
                
                await runQuery(db,
                    `INSERT OR IGNORE INTO cases (user_id, case_number, title, description, status, priority)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        caseData.case_number,
                        caseData.title,
                        caseData.description,
                        caseData.status,
                        caseData.priority
                    ]
                );
                
                console.log(`  ✅ Added case: ${caseData.title}`);
            } catch (error) {
                console.error(`  ❌ Error adding case ${caseData.case_number}:`, error.message);
            }
        }
        console.log(`  ✅ Added ${indianSampleData.cases.length} cases successfully`);
        
        // Insert documents
        console.log('\n📄 Inserting documents...');
        for (const [index, doc] of indianSampleData.documents.entries()) {
            try {
                // Assign document to a random user
                const userId = userIds[index % userIds.length];
                
                await runQuery(db,
                    `INSERT OR IGNORE INTO documents (user_id, filename, file_type, analysis_results, analyzed)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        doc.filename,
                        doc.file_type,
                        doc.analysis_results,
                        doc.analyzed ? 1 : 0
                    ]
                );
                
                console.log(`  ✅ Added document: ${doc.filename}`);
            } catch (error) {
                console.error(`  ❌ Error adding document ${doc.filename}:`, error.message);
            }
        }
        console.log(`  ✅ Added ${indianSampleData.documents.length} documents successfully`);
        
        // Insert SOS alerts
        console.log('\n🚨 Inserting SOS alerts...');
        for (const [index, alert] of indianSampleData.sos_alerts.entries()) {
            try {
                // Assign alert to a random user
                const userId = userIds[index % userIds.length];
                
                await runQuery(db,
                    `INSERT OR IGNORE INTO sos_alerts (user_id, alert_type, description, location, status)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        alert.alert_type,
                        alert.description,
                        alert.location,
                        alert.status
                    ]
                );
                
                console.log(`  ✅ Added SOS alert: ${alert.alert_type} alert`);
            } catch (error) {
                console.error(`  ❌ Error adding SOS alert:`, error.message);
            }
        }
        console.log(`  ✅ Added ${indianSampleData.sos_alerts.length} SOS alerts successfully`);
        
        // Insert civic feedback
        console.log('\n📝 Inserting civic feedback...');
        for (const [index, feedback] of indianSampleData.civic_feedback.entries()) {
            try {
                // Assign feedback to a random user
                const userId = userIds[index % userIds.length];
                
                await runQuery(db,
                    `INSERT OR IGNORE INTO civic_feedback (user_id, category, subject, description, location, priority, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        feedback.category,
                        feedback.subject,
                        feedback.description,
                        feedback.location,
                        feedback.priority,
                        feedback.status
                    ]
                );
                
                console.log(`  ✅ Added civic feedback: ${feedback.subject}`);
            } catch (error) {
                console.error(`  ❌ Error adding civic feedback:`, error.message);
            }
        }
        console.log(`  ✅ Added ${indianSampleData.civic_feedback.length} civic feedback entries successfully`);
        
        // Insert whistleblower reports
        console.log('\n🕵️ Inserting whistleblower reports...');
        for (const [index, report] of indianSampleData.whistleblower_reports.entries()) {
            try {
                // Assign report to a random user or null if anonymous
                const userId = report.is_anonymous ? null : userIds[index % userIds.length];
                
                await runQuery(db,
                    `INSERT OR IGNORE INTO whistleblower_reports 
                     (user_id, report_id, title, description, category, is_anonymous, status, severity, organization_involved)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        report.report_id,
                        report.title,
                        report.description,
                        report.category,
                        report.is_anonymous ? 1 : 0,
                        report.status,
                        report.severity,
                        report.organization_involved
                    ]
                );
                
                console.log(`  ✅ Added whistleblower report: ${report.title}`);
            } catch (error) {
                console.error(`  ❌ Error adding whistleblower report:`, error.message);
            }
        }
        console.log(`  ✅ Added ${indianSampleData.whistleblower_reports.length} whistleblower reports successfully`);
        
        // Insert legal consultations
        if (lawyerIds.length > 0) {
            console.log('\n⚖️ Inserting legal consultations...');
            for (const [index, consultation] of indianSampleData.legal_consultations.entries()) {
                try {
                    // Assign client and lawyer
                    const clientId = userIds[index % userIds.length];
                    const lawyerId = lawyerIds[index % lawyerIds.length];
                    
                    await runQuery(db,
                        `INSERT OR IGNORE INTO legal_consultations 
                         (client_id, lawyer_id, consultation_type, scheduled_at, duration_minutes, status, 
                          consultation_fee, payment_status, notes, follow_up_required, follow_up_date)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            clientId,
                            lawyerId,
                            consultation.consultation_type,
                            consultation.scheduled_at,
                            consultation.duration_minutes,
                            consultation.status,
                            consultation.consultation_fee,
                            consultation.payment_status,
                            consultation.notes,
                            consultation.follow_up_required ? 1 : 0,
                            consultation.follow_up_date || null
                        ]
                    );
                    
                    console.log(`  ✅ Added legal consultation: ${consultation.consultation_type} consultation`);
                } catch (error) {
                    console.error(`  ❌ Error adding legal consultation:`, error.message);
                }
            }
            console.log(`  ✅ Added ${indianSampleData.legal_consultations.length} legal consultations successfully`);
        }
    } else {
        console.log('❌ No regular users found. Skipping data insertion.');
    }
    
    console.log('\n🎉 Data seeding completed successfully!');
}

// Helper function to run queries with promises
function runQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        if (sql.trim().toLowerCase().startsWith('insert')) {
            db.run(sql, params, function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        // For unique constraint failures, just log and resolve with null
                        resolve(null);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(this.lastID);
                }
            });
        } else {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(true);
            });
        }
    });
}

// Helper function to check if a table exists
function checkTableExists(db, tableName) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
        });
    });
}

// Helper function to check if a column exists in a table
function checkColumnExists(db, tableName, columnName) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
            if (err) reject(err);
            else resolve(columns.some(col => col.name === columnName));
        });
    });
}

// Helper function to get the count of records in a table
function getTableCount(db, tableName) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, result) => {
            if (err) {
                // Table might not exist
                if (err.message.includes('no such table')) {
                    resolve(0);
                } else {
                    reject(err);
                }
            } else {
                resolve(result.count);
            }
        });
    });
}

// Helper function to prompt user for input
function promptUser(question) {
    return new Promise((resolve) => {
        // For simplicity, we'll just proceed automatically
        console.log(question + " (Automatically answering 'y')");
        resolve('y');
        
        /* In a real interactive environment, you would use:
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question(question, (answer) => {
            readline.close();
            resolve(answer);
        });
        */
    });
}