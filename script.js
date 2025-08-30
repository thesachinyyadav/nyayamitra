// Navigation Toggle (removed - new navbar doesn't use toggle)
// const navToggle = document.getElementById('nav-toggle');
// const navMenu = document.getElementById('nav-menu');

// if (navToggle) {
//     navToggle.addEventListener('click', () => {
//         navMenu.classList.toggle('active');
//     });
// }

// Close menu when clicking on a link (removed - new navbar doesn't use dropdown)
// document.querySelectorAll('.nav-link').forEach(link => {
//     link.addEventListener('click', () => {
//         navMenu.classList.remove('active');
//     });
// });

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
