// Enhanced Navigation and Theme Management
class NavbarManager {
    constructor() {
        this.currentTheme = localStorage.getItem('nyaya-theme') || 'light';
        this.init();
    }

    init() {
        this.initializeTheme();
        this.enhanceNavbar();
        this.setupScrollEffects();
        this.setupMobileMenu();
    }

    initializeTheme() {
        // Set initial theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Update theme toggle if it exists
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.classList.toggle('dark-mode', this.currentTheme === 'dark');
        }
    }

    enhanceNavbar() {
        // Add theme toggle to existing navbars if not present
        const navActions = document.querySelector('.nav-actions');
        const navContainer = document.querySelector('.nav-container');
        
        if (navContainer && !document.querySelector('.theme-toggle')) {
            // Create theme toggle
            const themeToggle = this.createThemeToggle();
            
            if (navActions) {
                navActions.appendChild(themeToggle);
            } else {
                // Create nav-actions container
                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'nav-actions';
                actionsContainer.appendChild(themeToggle);
                navContainer.appendChild(actionsContainer);
            }
        }

        // Update navbar structure for better spacing
        this.updateNavbarStructure();
    }

    createThemeToggle() {
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <i class="fas fa-sun"></i>
            <i class="fas fa-moon"></i>
        `;
        
        themeToggle.addEventListener('click', () => this.toggleTheme());
        themeToggle.classList.toggle('dark-mode', this.currentTheme === 'dark');
        
        return themeToggle;
    }

    updateNavbarStructure() {
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;

        // Wrap nav-menu in nav-center if not already wrapped
        const navMenu = document.querySelector('.nav-menu');
        const navCenter = document.querySelector('.nav-center');
        
        if (navMenu && !navCenter) {
            const centerContainer = document.createElement('div');
            centerContainer.className = 'nav-center';
            
            // Move nav-menu into center container
            navMenu.parentNode.insertBefore(centerContainer, navMenu);
            centerContainer.appendChild(navMenu);
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('nyaya-theme', this.currentTheme);
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.classList.toggle('dark-mode', this.currentTheme === 'dark');
        }

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.currentTheme } 
        }));
    }

    setupScrollEffects() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let lastScrollY = window.scrollY;
        let scrollTimeout;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Add scrolled class for styling
            navbar.classList.toggle('scrolled', currentScrollY > 50);
            
            // Hide/show navbar on scroll (optional)
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
            
            // Clear timeout and set new one
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                navbar.style.transform = 'translateY(0)';
            }, 150);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    setupMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Animate hamburger bars
            const bars = navToggle.querySelectorAll('.bar');
            bars.forEach((bar, index) => {
                if (navToggle.classList.contains('active')) {
                    if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                    if (index === 1) bar.style.opacity = '0';
                    if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
                } else {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                }
            });
        });

        // Close mobile menu when clicking on links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                
                const bars = navToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                
                const bars = navToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            }
        });
    }
}

// Enhanced notification system that respects theme
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Initialize enhanced navbar on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new NavbarManager();
});

// Add enhanced notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-primary);
        color: var(--text-primary);
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px var(--shadow-color);
        border-left: 4px solid #17a2b8;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1001;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-color);
    }
    
    .notification-success {
        border-left-color: #28a745;
    }
    
    .notification-error {
        border-left-color: #dc3545;
    }
    
    .notification-warning {
        border-left-color: #ffc107;
    }
    
    .notification i:first-child {
        font-size: 1.2rem;
    }
    
    .notification-success i:first-child {
        color: #28a745;
    }
    
    .notification-error i:first-child {
        color: #dc3545;
    }
    
    .notification-warning i:first-child {
        color: #ffc107;
    }
    
    .notification span {
        flex: 1;
        font-weight: 500;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .notification-close:hover {
        background: var(--border-color);
        color: var(--text-primary);
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            min-width: auto;
            max-width: none;
        }
    }
`;
document.head.appendChild(notificationStyles);
