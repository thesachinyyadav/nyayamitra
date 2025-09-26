// Enhanced Navigation JavaScript
class EnhancedNavigation {
    constructor() {
        this.init();
        this.bindEvents();
        this.setupTheme();
        this.setupSearch();
        this.setupNotifications();
    }

    init() {
        this.header = document.getElementById('mainHeader');
        this.navMenu = document.getElementById('navMenu');
        this.mobileToggle = document.getElementById('mobileToggle');
        this.themeToggle = document.getElementById('themeToggle');
        this.navSearch = document.getElementById('navSearch');
        this.backToTop = document.getElementById('backToTop');
        this.loadingScreen = document.getElementById('loadingScreen');
        
        // Hide loading screen after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (this.loadingScreen) {
                    this.loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        this.loadingScreen.style.display = 'none';
                    }, 300);
                }
            }, 500);
        });
    }

    bindEvents() {
        // Mobile menu toggle
        if (this.mobileToggle && this.navMenu) {
            this.mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Header scroll effect
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Search functionality
        if (this.navSearch) {
            this.navSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Back to top button
        if (this.backToTop) {
            this.backToTop.addEventListener('click', () => {
                this.scrollToTop();
            });
        }

        // Dropdown menu handling for mobile
        this.setupDropdownHandling();

        // Keyboard navigation
        this.setupKeyboardNavigation();

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navMenu.contains(e.target) && !this.mobileToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.mobileToggle.classList.toggle('active');
        this.navMenu.classList.toggle('active');
        document.body.classList.toggle('nav-open');
        
        // Update aria attributes for accessibility
        const isExpanded = this.navMenu.classList.contains('active');
        this.mobileToggle.setAttribute('aria-expanded', isExpanded);
    }

    closeMobileMenu() {
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
        this.mobileToggle.setAttribute('aria-expanded', 'false');
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        // Header scroll effect
        if (this.header) {
            if (scrollY > 50) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        }

        // Back to top button
        if (this.backToTop) {
            if (scrollY > 300) {
                this.backToTop.classList.add('visible');
            } else {
                this.backToTop.classList.remove('visible');
            }
        }

        // Parallax effect for hero section
        const heroSection = document.getElementById('heroSection');
        if (heroSection && scrollY < window.innerHeight) {
            const parallaxSpeed = 0.5;
            heroSection.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
        }
    }

    setupDropdownHandling() {
        const dropdownItems = document.querySelectorAll('.nav-item-enhanced');
        
        dropdownItems.forEach(item => {
            const dropdownToggle = item.querySelector('.dropdown-toggle');
            const dropdownMenu = item.querySelector('.dropdown-menu-enhanced');
            
            if (dropdownToggle && dropdownMenu) {
                dropdownToggle.addEventListener('click', (e) => {
                    // On mobile, toggle dropdown
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        item.classList.toggle('active');
                    }
                });

                // Handle keyboard navigation
                dropdownToggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (window.innerWidth <= 768) {
                            item.classList.toggle('active');
                        }
                    }
                });
            }
        });
    }

    setupKeyboardNavigation() {
        const navItems = document.querySelectorAll('.nav-item-enhanced a, .dropdown-item-enhanced');
        
        navItems.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowDown' ? 1 : -1;
                    const nextIndex = (index + direction + navItems.length) % navItems.length;
                    navItems[nextIndex].focus();
                }
            });
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('nyaya-mitra-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.applyTheme(theme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('nyaya-mitra-theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.applyTheme(newTheme);
        localStorage.setItem('nyaya-mitra-theme', newTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (this.themeToggle) {
            this.themeToggle.classList.toggle('active', theme === 'light');
        }

        // Update theme color meta tag
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.content = theme === 'dark' ? '#121212' : '#ffffff';
        }
    }

    setupSearch() {
        let searchTimeout;
        
        if (this.navSearch) {
            this.navSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            // Show search suggestions
            this.navSearch.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });

            // Hide search suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-search')) {
                    this.hideSearchSuggestions();
                }
            });
        }
    }

    performSearch(query) {
        if (query.length < 2) {
            this.hideSearchSuggestions();
            return;
        }

        // Mock search results - in production, this would call an API
        const searchResults = this.getSearchResults(query);
        this.displaySearchResults(searchResults);
    }

    getSearchResults(query) {
        const mockResults = [
            { title: 'Document Analysis', url: 'document-analyzer.html', type: 'service' },
            { title: 'SOS Emergency Alerts', url: 'sos-alerts.html', type: 'emergency' },
            { title: 'Legal Consultation', url: 'legal-consultation.html', type: 'service' },
            { title: 'Civic Feedback', url: 'civic-feedback.html', type: 'community' },
            { title: 'Case Tracking', url: 'case-tracker.html', type: 'service' },
            { title: 'Legal Library', url: 'legal-library.html', type: 'resource' },
            { title: 'FAQ Section', url: 'faq.html', type: 'resource' },
            { title: 'Whistleblower Protection', url: 'whistleblower.html', type: 'community' }
        ];

        return mockResults.filter(result => 
            result.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }

    displaySearchResults(results) {
        let searchDropdown = document.querySelector('.search-dropdown');
        
        if (!searchDropdown) {
            searchDropdown = document.createElement('div');
            searchDropdown.className = 'search-dropdown';
            this.navSearch.parentElement.appendChild(searchDropdown);
        }

        if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="search-no-results">No results found</div>';
        } else {
            searchDropdown.innerHTML = results.map(result => `
                <a href="${result.url}" class="search-result-item">
                    <i class="fas fa-${this.getIconForType(result.type)}"></i>
                    <span>${result.title}</span>
                    <span class="result-type">${result.type}</span>
                </a>
            `).join('');
        }

        searchDropdown.style.display = 'block';
    }

    getIconForType(type) {
        const icons = {
            service: 'cog',
            emergency: 'exclamation-triangle',
            community: 'users',
            resource: 'book'
        };
        return icons[type] || 'circle';
    }

    showSearchSuggestions() {
        // Show popular searches or recent searches
        const suggestions = [
            'Document analysis',
            'Emergency contacts',
            'Legal consultation',
            'Case status',
            'Legal forms'
        ];

        this.displaySearchResults(suggestions.map(suggestion => ({
            title: suggestion,
            url: '#',
            type: 'suggestion'
        })));
    }

    hideSearchSuggestions() {
        const searchDropdown = document.querySelector('.search-dropdown');
        if (searchDropdown) {
            searchDropdown.style.display = 'none';
        }
    }

    setupNotifications() {
        // Mock notification system
        this.notifications = [
            { id: 1, title: 'Case Update', message: 'Your case #NYM-2025-001 has been updated', type: 'info', unread: true },
            { id: 2, title: 'Document Analyzed', message: 'Document analysis completed', type: 'success', unread: true },
            { id: 3, title: 'Hearing Scheduled', message: 'Court hearing scheduled for next week', type: 'warning', unread: true }
        ];

        this.updateNotificationBadges();
    }

    updateNotificationBadges() {
        const unreadCount = this.notifications.filter(n => n.unread).length;
        const badges = document.querySelectorAll('.notification-badge');
        
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Utility method to handle responsive behavior
    handleResize() {
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
            
            // Reset mobile dropdown states
            const activeDropdowns = document.querySelectorAll('.nav-item-enhanced.active');
            activeDropdowns.forEach(item => {
                item.classList.remove('active');
            });
        }
    }
}

// Initialize enhanced navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const nav = new EnhancedNavigation();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        nav.handleResize();
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerHeight = nav.header ? nav.header.offsetHeight : 70;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedNavigation;
}