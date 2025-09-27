// Nyaya Mitra - Standard Navigation Component
// This file contains the standard navigation HTML template and functionality
// to be included in all pages for consistency

/**
 * Inserts the standard navigation bar into the page
 * @param {string} currentPage - The current page filename (e.g., 'index.html')
 */
function insertNavigation(currentPage) {
    // Get the header element
    const header = document.querySelector('header.header');
    if (!header) return;
    
    // Navigation HTML template with dropdown menus
    const navigationHTML = `
        <div class="container">
            <nav class="modern-nav">
                <div class="nav-logo">
                    <a href="index.html">
                        <img src="nyaya_mitra_logo.jpg" alt="Nyaya Mitra Logo">
                        <span>Nyaya Mitra</span>
                    </a>
                </div>
                
                <div class="nav-toggle" id="navToggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                
                <div class="nav-menu" id="navMenu">
                    <ul class="nav-list">
                        <li class="nav-item ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">
                            <a href="index.html">Home</a>
                        </li>
                        
                        <li class="nav-item dropdown ${['sos-alerts.html', 'document-analyzer.html', 'civic-feedback.html', 'whistleblower.html', 'case-tracker.html', 'chatbot.html'].includes(currentPage) ? 'active' : ''}">
                            <a href="#" class="dropdown-toggle">Services <i class="fas fa-chevron-down"></i></a>
                            <ul class="dropdown-menu">
                                <li><a href="sos-alerts.html" class="${currentPage === 'sos-alerts.html' ? 'active' : ''}">Emergency SOS</a></li>
                                <li><a href="document-analyzer.html" class="${currentPage === 'document-analyzer.html' ? 'active' : ''}">Document Analyzer</a></li>
                                <li><a href="civic-feedback.html" class="${currentPage === 'civic-feedback.html' ? 'active' : ''}">Civic Feedback</a></li>
                                <li><a href="whistleblower.html" class="${currentPage === 'whistleblower.html' ? 'active' : ''}">Whistleblower Portal</a></li>
                                <li><a href="case-tracker.html" class="${currentPage === 'case-tracker.html' ? 'active' : ''}">Case Tracker</a></li>
                                <li><a href="chatbot.html" class="${currentPage === 'chatbot.html' ? 'active' : ''}">NyayaBot</a></li>
                            </ul>
                        </li>
                        
                        <li class="nav-item dropdown ${['about.html', 'contact.html', 'developers.html'].includes(currentPage) ? 'active' : ''}">
                            <a href="#" class="dropdown-toggle">About <i class="fas fa-chevron-down"></i></a>
                            <ul class="dropdown-menu">
                                <li><a href="about.html" class="${currentPage === 'about.html' ? 'active' : ''}">About Us</a></li>
                                <li><a href="contact.html" class="${currentPage === 'contact.html' ? 'active' : ''}">Contact</a></li>
                                <li><a href="developers.html" class="${currentPage === 'developers.html' ? 'active' : ''}">Our Team</a></li>
                            </ul>
                        </li>
                    </ul>
                    
                    <div class="nav-cta">
                        <a href="login.html" class="btn btn-text">Login</a>
                        <a href="signup.html" class="btn btn-text">Sign Up</a>
                        <a href="chatbot.html" class="btn btn-text">NyayaBot</a>
                        <a href="sos-alerts.html" class="btn btn-primary">Emergency SOS</a>
                    </div>
                </div>
            </nav>
        </div>
    `;
    
    // Insert the navigation HTML
    header.innerHTML = navigationHTML;
    
    // Initialize dropdown functionality
    initializeNavDropdowns();
}

/**
 * Initializes dropdown menu functionality
 */
function initializeNavDropdowns() {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });
    }
    
    // Handle dropdown menus
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Close other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('active');
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// Export functions for use in other files
if (typeof module !== 'undefined') {
    module.exports = {
        insertNavigation,
        initializeNavDropdowns
    };
}