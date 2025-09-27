// Nyaya Mitra - Standard Footer Component
// This file contains the standard footer HTML template and functionality
// to be included in all pages for consistency

/**
 * Inserts the standard footer into the page
 */
function insertFooter() {
    // Get or create the footer element
    let footer = document.querySelector('footer.modern-footer');
    if (!footer) {
        footer = document.createElement('footer');
        footer.className = 'modern-footer';
        document.body.appendChild(footer);
    }
    
    // Ensure footer styles are loaded
    if (!document.querySelector('link[href="css/modern-footer.css"]')) {
        const footerStyles = document.createElement('link');
        footerStyles.rel = 'stylesheet';
        footerStyles.href = 'css/modern-footer.css';
        document.head.appendChild(footerStyles);
    }
    
    // Footer HTML template with consistent branding and developer credits
    const footerHTML = `
        <div class="footer-top">
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-brand">
                        <div class="footer-logo">
                            <img src="nyaya_mitra_logo.jpg" alt="Nyaya Mitra">
                            <h3>Nyaya Mitra</h3>
                        </div>
                        <p>Empowering citizens with accessible legal services through advanced technology and innovation.</p>
                        <div class="social-icons">
                            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                            <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>
                    
                    <div class="footer-links">
                        <h3>Services</h3>
                        <ul>
                            <li><a href="sos-alerts.html">Emergency SOS</a></li>
                            <li><a href="document-analyzer.html">Document Analyzer</a></li>
                            <li><a href="whistleblower.html">Whistleblower Portal</a></li>
                            <li><a href="civic-feedback.html">Civic Feedback</a></li>
                            <li><a href="case-tracker.html">Case Tracker</a></li>
                            <li><a href="chatbot.html">NyayaBot</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-links">
                        <h3>Company</h3>
                        <ul>
                            <li><a href="about.html">About Us</a></li>
                            <li><a href="contact.html">Contact</a></li>
                            <li><a href="developers.html">Our Team</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-contact">
                        <h3>Contact Info</h3>
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <span>info@nyayamitra.com</span>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <span>+91 80 2345 6789</span>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Christ (Deemed to be University), Bangalore - 560027</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="container">
                <p>&copy; 2025 Nyaya Mitra - Christ (Deemed to be University), Bangalore. All rights reserved.</p>
                <p>Developed by Sachin Yadav (2341551), Surya Vamshi S (2341566), Hema C (2341530)</p>
            </div>
        </div>
    `;
    
    // Insert the footer HTML
    footer.innerHTML = footerHTML;
}

// Export function for use in other files
if (typeof module !== 'undefined') {
    module.exports = {
        insertFooter
    };
}