// Nyaya Mitra - Main JavaScript File
// This file integrates the standardized components and provides shared functionality
// across all pages in the Nyaya Mitra website

// Import navigation and footer components on page load
document.addEventListener('DOMContentLoaded', function() {
    // Import and initialize navigation component
    const navScript = document.createElement('script');
    navScript.src = 'components/navigation.js';
    navScript.onload = function() {
        // Insert navigation with current page context
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (typeof insertNavigation === 'function') {
            insertNavigation(currentPage);
        }
    };
    document.head.appendChild(navScript);
    
    // Import and initialize footer component
    const footerScript = document.createElement('script');
    footerScript.src = 'components/footer.js';
    footerScript.onload = function() {
        // Insert standardized footer
        if (typeof insertFooter === 'function') {
            insertFooter();
        }
    };
    document.head.appendChild(footerScript);
    
    // Connect to database for dynamic content
    initDatabaseConnection();
});

// Initialize database connection and fetch required data
function initDatabaseConnection() {
    // Import the database connector
    const dbScript = document.createElement('script');
    dbScript.src = 'js/db-connector.js';
    dbScript.onload = function() {
        // Connect to the database using the connector
        if (typeof connectToDatabase === 'function') {
            connectToDatabase().then(isConnected => {
                if (isConnected) {
                    // Fetch any initial data required for the page
                    fetchPageData();
                    
                    // Check if user is logged in
                    checkUserAuth();
                }
            });
        }
    };
    document.head.appendChild(dbScript);
}

// Check user authentication status
function checkUserAuth() {
    if (typeof getCurrentUser === 'function') {
        getCurrentUser().then(user => {
            if (user) {
                console.log('User is logged in:', user.firstName);
                updateUIForLoggedInUser(user);
            } else {
                updateUIForLoggedOutUser();
            }
        });
    }
}

// Update UI elements for logged in user
function updateUIForLoggedInUser(user) {
    // Find login/signup buttons in navigation
    const navCta = document.querySelector('.nav-cta');
    if (navCta) {
        // Replace login/signup buttons with user profile button
        const loginBtn = navCta.querySelector('a[href="login.html"]');
        const signupBtn = navCta.querySelector('a[href="signup.html"]');
        
        if (loginBtn && signupBtn) {
            // Remove the buttons
            loginBtn.remove();
            signupBtn.remove();
            
            // Add user profile button
            const userBtn = document.createElement('a');
            userBtn.href = 'dashboard.html';
            userBtn.className = 'btn btn-text user-btn';
            userBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                ${user.firstName}
            `;
            
            // Insert at the beginning of nav-cta
            navCta.insertBefore(userBtn, navCta.firstChild);
        }
    }
}

// Update UI elements for logged out user
function updateUIForLoggedOutUser() {
    // Nothing to do as the default state is logged out
    console.log('User is not logged in');
}

// Fetch data specific to the current page
function fetchPageData() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Based on current page, fetch specific data
    switch(currentPage) {
        case 'index.html':
            // Fetch testimonials, statistics for homepage
            fetchTestimonials();
            break;
        case 'case-tracker.html':
            // Fetch active cases
            fetchCases();
            break;
        case 'document-analyzer.html':
            // No initial data needed
            break;
        case 'civic-feedback.html':
            // Fetch feedback categories
            fetchFeedbackCategories();
            break;
        // Add more cases as needed
    }
}

// Example database fetch functions
function fetchTestimonials() {
    // Simulated data for testimonials
    const testimonials = [
        {
            id: 1,
            name: 'Arjun Ramesh',
            location: 'Bangalore',
            rating: 5,
            message: "Nyaya Mitra's document analyzer saved me hours of reading complex legal documents. The AI summarized everything perfectly!"
        },
        {
            id: 2,
            name: 'Shubham Kundu',
            location: 'Kolkata',
            rating: 5,
            message: "The SOS feature helped me get immediate assistance during an emergency situation. This app is truly a lifesaver!"
        },
        {
            id: 3,
            name: 'Mahi Shreedhar',
            location: 'Hyderabad',
            rating: 4.5,
            message: "The civic feedback system has helped our community address several longstanding issues with local services. Excellent platform!"
        }
    ];
    
    // Update testimonials in the DOM if the slider exists
    const testimonialTrack = document.getElementById('testimonialTrack');
    if (testimonialTrack) {
        testimonialTrack.innerHTML = testimonials.map(t => `
            <div class="testimonial-card">
                <div class="testimonial-content">
                    <div class="quote-icon">
                        <i class="fas fa-quote-left"></i>
                    </div>
                    <p>${t.message}</p>
                    <div class="testimonial-rating">
                        ${generateRatingStars(t.rating)}
                    </div>
                </div>
                <div class="testimonial-author">
                    <div class="author-info">
                        <h4>${t.name}</h4>
                        <p>${t.location}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Helper function to generate star ratings
function generateRatingStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star if needed
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect - Updated for new white navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.background = '#ffffff';
        navbar.style.backdropFilter = 'none';
        navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
    }
});

// Simple AOS (Animate On Scroll) implementation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
        }
    });
}, observerOptions);

// Observe all elements with data-aos attribute
document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
});

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('.form-control[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
        } else {
            input.style.borderColor = '#d37827';
        }
    });

    return isValid;
}

// Add form submission handlers
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm(this)) {
            // Show success message
            showNotification('Form submitted successfully!', 'success');
            this.reset();
        } else {
            showNotification('Please fill in all required fields.', 'error');
        }
    });
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 400px;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success {
                border-left: 4px solid #4CAF50;
            }
            .notification-error {
                border-left: 4px solid #e74c3c;
            }
            .notification-info {
                border-left: 4px solid #d37827;
            }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: 15px;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// Active navigation link highlighting - Updated for new navbar structure
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-center a');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}// Set active nav link on page load
document.addEventListener('DOMContentLoaded', setActiveNavLink);

// Floating chatbot interaction
const floatingChatbot = document.querySelector('.floating-chatbot');
if (floatingChatbot) {
    floatingChatbot.addEventListener('click', function(e) {
        // Add click animation
        const btn = this.querySelector('.chatbot-float-btn');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }, 100);
    });
}

// Parallax effect for hero sections
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero, .page-hero');
    
    parallaxElements.forEach(element => {
        const rate = scrolled * -0.5;
        element.style.transform = `translateY(${rate}px)`;
    });
});

// Statistics counter animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.dataset.suffix || '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.dataset.suffix || '');
        }
    }, 16);
}

// Animate counters when they come into view
const counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.target);
            animateCounter(entry.target, target);
            counterObserver.unobserve(entry.target);
        }
    });
});

document.querySelectorAll('.stat-number').forEach(counter => {
    const text = counter.textContent;
    const number = parseInt(text.replace(/\D/g, ''));
    const suffix = text.replace(/\d/g, '');
    
    counter.dataset.target = number;
    counter.dataset.suffix = suffix;
    counter.textContent = '0' + suffix;
    
    counterObserver.observe(counter);
});

// Loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Add loading styles if not present
    if (!document.querySelector('#loading-styles')) {
        const styles = document.createElement('style');
        styles.id = 'loading-styles';
        styles.textContent = `
            body:not(.loaded) {
                overflow: hidden;
            }
            body:not(.loaded)::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #171a1c;
                z-index: 10000;
                transition: opacity 0.5s ease;
            }
            body.loaded::before {
                opacity: 0;
                pointer-events: none;
            }
        `;
        document.head.appendChild(styles);
    }
});

// Emergency button functionality
document.addEventListener('DOMContentLoaded', function() {
    const emergencyBtn = document.querySelector('.emergency-btn');
    if (emergencyBtn) {
        let holdTimer;
        let isHeld = false;

        emergencyBtn.addEventListener('mousedown', startHold);
        emergencyBtn.addEventListener('touchstart', startHold);
        emergencyBtn.addEventListener('mouseup', endHold);
        emergencyBtn.addEventListener('touchend', endHold);
        emergencyBtn.addEventListener('mouseleave', endHold);

        function startHold() {
            isHeld = false;
            emergencyBtn.classList.add('holding');
            holdTimer = setTimeout(() => {
                isHeld = true;
                triggerEmergency();
            }, 2000); // 2 second hold
        }

        function endHold() {
            clearTimeout(holdTimer);
            emergencyBtn.classList.remove('holding');
            if (!isHeld) {
                // Quick tap - show info
                showEmergencyInfo();
            }
        }

        function triggerEmergency() {
            // Get location and send emergency alert
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    sendEmergencyAlert(location);
                }, function() {
                    // Fallback if location not available
                    sendEmergencyAlert(null);
                });
            } else {
                sendEmergencyAlert(null);
            }
        }

        function sendEmergencyAlert(location) {
            // Show loading state
            emergencyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            emergencyBtn.disabled = true;

            // Simulate API call (replace with actual implementation)
            setTimeout(() => {
                emergencyBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> EMERGENCY';
                emergencyBtn.disabled = false;

                // Show success notification
                showNotification('Emergency alert sent! Help is on the way.', 'success');
            }, 2000);
        }

        function showEmergencyInfo() {
            showNotification('Hold the button for 2 seconds to trigger emergency alert.', 'info');
        }
    }
});
