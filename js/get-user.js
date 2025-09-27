/**
 * Simple script to get a valid user for login
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to database file
const dbPath = path.join(__dirname, '..', 'data', 'nyaya_mitra.db');
console.log('Database path:', dbPath);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        return;
    }
    
    console.log('Successfully connected to the database');
    
    // Get one citizen user, or any user if no citizens exist
    db.all(`SELECT id, email, first_name, last_name, user_type FROM users ORDER BY user_type LIMIT 5`, 
        (err, users) => {
            if (err) {
                console.error('Error querying database:', err.message);
                db.close();
            } else if (users && users.length > 0) {
                console.log('=============================');
                console.log('USERS FOUND:');
                console.log('=============================');
                
                users.forEach((user, index) => {
                    console.log(`USER ${index + 1}:`);
                    console.log(`ID: ${user.id}`);
                    console.log(`Name: ${user.first_name} ${user.last_name}`);
                    console.log(`Email: ${user.email}`);
                    console.log(`Type: ${user.user_type}`);
                    console.log(`Password: Password@123 (original, not hashed)`);
                    console.log('-----------------------------');
                });
                
                console.log('=============================');
                console.log('USE ANY OF THESE EMAILS WITH Password@123 TO LOG IN');
                
                // Close the database
                db.close();
            } else {
                console.log('No users found in the database');
                db.close();
            }
        });
});