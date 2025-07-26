// ====================================
// MAIN JAVASCRIPT FILE
// ====================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================
    // 1. MOBILE NAVIGATION
    // ====================================
    const mobileNavigation = {
        init() {
            this.menuToggle = document.querySelector('.menu-toggle');
            this.navMenu = document.querySelector('.nav-menu');
            this.navLinks = document.querySelectorAll('.nav-link');
            
            if (!this.menuToggle || !this.navMenu) return;
            
            // Toggle menu on button click
            this.menuToggle.addEventListener('click', () => this.toggleMenu());
            
            // Close menu when clicking on a link
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.menuToggle.contains(e.target) && !this.navMenu.contains(e.target)) {
                    this.closeMenu();
                }
            });
            
            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeMenu();
            });
        },
        
        toggleMenu() {
            const isOpen = this.navMenu.classList.contains('active');
            if (isOpen) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        },
        
        openMenu() {
            this.navMenu.classList.add('active');
            this.menuToggle.setAttribute('aria-expanded', 'true');
            
            // Animate hamburger to X
            const hamburger = this.menuToggle.querySelector('.hamburger');
            if (hamburger) {
                hamburger.style.transform = 'rotate(45deg)';
                hamburger.style.background = 'transparent';
            }
        },
        
        closeMenu() {
            this.navMenu.classList.remove('active');
            this.menuToggle.setAttribute('aria-expanded', 'false');
            
            // Animate X back to hamburger
            const hamburger = this.menuToggle.querySelector('.hamburger');
            if (hamburger) {
                hamburger.style.transform = 'rotate(0)';
                hamburger.style.background = 'var(--color-text)';
            }
        }
    };
    
    // ====================================
    // 2. SEARCH FUNCTIONALITY (Basic)
    // ====================================
    const searchFunctionality = {
        init() {
            // The new search functionality is now handled by search.js
            // Keep this for any legacy search forms that don't use the new system
            const legacySearchForms = document.querySelectorAll('.search-form:not(.enhanced)');
            
            legacySearchForms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const input = form.querySelector('.search-input');
                    if (input && input.value.trim()) {
                        // If search.js is available, trigger it
                        if (window.BlogSearch) {
                            const searchInput = document.querySelector('.search-input');
                            if (searchInput) {
                                searchInput.value = input.value;
                                searchInput.dispatchEvent(new Event('input'));
                                searchInput.focus();
                            }
                        }
                    }
                });
            });
        }
    };
    
    // ====================================
    // 3. HEADER SCROLL EFFECT
    // ====================================
    const headerScroll = {
        init() {
            this.header = document.querySelector('.site-header');
            if (!this.header) return;
            
            let lastScroll = 0;
            
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                
                // Add shadow when scrolled
                if (currentScroll > 10) {
                    this.header.style.boxShadow = 'var(--shadow-md)';
                } else {
                    this.header.style.boxShadow = 'var(--shadow-sm)';
                }
                
                // Optional: Hide header on scroll down, show on scroll up
                // Uncomment the following if you want this behavior:
                /*
                if (currentScroll > lastScroll && currentScroll > 100) {
                    this.header.style.transform = 'translateY(-100%)';
                } else {
                    this.header.style.transform = 'translateY(0)';
                }
                lastScroll = currentScroll;
                */
            });
        }
    };
    
    // ====================================
    // 4. SMOOTH SCROLL FOR ANCHOR LINKS
    // ====================================
    const smoothScroll = {
        init() {
            // Only for same-page anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        
                        // Calculate offset for sticky header
                        const headerHeight = document.querySelector('.site-header').offsetHeight;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    };
    
    // ====================================
    // 5. LAZY LOADING IMAGES (Native)
    // ====================================
    const lazyLoading = {
        init() {
            // Check if native lazy loading is supported
            if ('loading' in HTMLImageElement.prototype) {
                // Browser supports native lazy loading
                const images = document.querySelectorAll('img[loading="lazy"]');
                images.forEach(img => {
                    // Make sure src is set
                    if (img.dataset.src && !img.src) {
                        img.src = img.dataset.src;
                    }
                });
            } else {
                // Fallback for older browsers
                this.loadLazyImages();
            }
        },
        
        loadLazyImages() {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    };
    
    // ====================================
    // 6. READING TIME CALCULATOR
    // ====================================
    const readingTime = {
        init() {
            // This will be used by the build script
            // For now, it's just a utility function
        },
        
        calculate(text) {
            const wordsPerMinute = 200;
            const words = text.trim().split(/\s+/).length;
            const minutes = Math.ceil(words / wordsPerMinute);
            return `${minutes} min read`;
        }
    };
    
    // ====================================
    // 7. THEME UTILITIES (for future dark mode)
    // ====================================
    const theme = {
        init() {
            // Check for saved theme preference or system preference
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // For future implementation
            // this.setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
        },
        
        setTheme(themeName) {
            document.documentElement.setAttribute('data-theme', themeName);
            localStorage.setItem('theme', themeName);
        },
        
        toggle() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        }
    };
    
    // ====================================
    // 8. IMAGE MODAL FUNCTIONALITY
    // ====================================
    const imageModal = {
        init() {
            this.modal = document.getElementById('imageModal');
            this.modalImg = document.getElementById('modalImage');
            this.modalCaption = document.getElementById('modalCaption');
            
            if (!this.modal) return;
            
            // Close modal when clicking outside the image
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
            
            // Close modal on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                    this.close();
                }
            });
            
            // Set up global functions for onclick handlers
            window.openImageModal = (imageId) => this.open(imageId);
            window.closeImageModal = () => this.close();
        },
        
        open(imageId) {
            const img = document.getElementById(imageId);
            if (!img || !this.modal) return;
            
            // Set modal image source and alt text
            this.modalImg.src = img.src;
            this.modalImg.alt = img.alt;
            
            // Set caption if available
            const caption = img.alt || '';
            if (this.modalCaption) {
                this.modalCaption.textContent = caption;
                this.modalCaption.style.display = caption ? 'block' : 'none';
            }
            
            // Show modal
            this.modal.classList.add('show');
            this.modal.style.display = 'flex';
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        },
        
        close() {
            if (!this.modal) return;
            
            this.modal.classList.remove('show');
            this.modal.style.display = 'none';
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    };

    // ====================================
    // 9. ARCHIVE PAGE FUNCTIONALITY
    // ====================================
    const archivePage = {
        init() {
            console.log('Archive init called');
            if (!document.querySelector('.archive-page')) {
                console.log('No archive page found');
                return;
            }
            
            console.log('Archive page found, setting up features...');
            this.setupToggleHandlers();
            this.setupTagFiltering();
            this.setupSearch();
        },
        
        setupToggleHandlers() {
            const toggleButtons = document.querySelectorAll('[data-target]');
            console.log('Found toggle buttons:', toggleButtons.length);
            
            toggleButtons.forEach((button, index) => {
                console.log('Setting up button', index);
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Button clicked');
                    
                    const targetId = button.getAttribute('data-target');
                    console.log('Target ID:', targetId);
                    const content = document.getElementById(targetId);
                    console.log('Target element found:', !!content);
                    
                    if (content) {
                        const isExpanded = button.getAttribute('aria-expanded') === 'true';
                        button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                        content.style.display = isExpanded ? 'none' : 'block';
                    }
                });
                
                // Set initial state
                button.setAttribute('aria-expanded', 'false');
            });
        },
        
        setupTagFiltering() {
            // Handle both new tag-pill and legacy archive-tag-filter classes
            const tagButtons = document.querySelectorAll('.tag-pill, .archive-tag-filter');
            const yearSections = document.querySelectorAll('.archive-year-section');
            const monthSections = document.querySelectorAll('.archive-month-section');

            tagButtons.forEach(btn => btn.addEventListener('click', () => {
                const selectedTag = btn.getAttribute('data-tag');

                // Remove active from all buttons
                tagButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show everything if no tag selected
                if (selectedTag === '' || selectedTag === null) {
                    yearSections.forEach(year => {
                        year.style.display = '';
                        year.querySelectorAll('.archive-month-section')
                            .forEach(month => month.style.display = '');
                    });
                    return;
                }

                // Filter months based on their data-tags
                monthSections.forEach(month => {
                    const contentEl = month.querySelector('.archive-section-content');
                    if (contentEl) {
                        const tags = JSON.parse(contentEl.getAttribute('data-tags') || '[]');
                        month.style.display = tags.includes(selectedTag) ? '' : 'none';
                    }
                });

                // Hide years that have no visible months
                yearSections.forEach(year => {
                    const visibleMonths = Array.from(
                        year.querySelectorAll('.archive-month-section')
                    ).filter(m => getComputedStyle(m).display !== 'none');
                    year.style.display = visibleMonths.length > 0 ? '' : 'none';
                });
            }));
        },
        
        setupSearch() {
            const searchInput = document.querySelector('.search-input');
            if (!searchInput) return;
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                this.filterPostsBySearch(query);
            });
            
            // Add keyboard shortcut (Cmd/Ctrl + K)
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    searchInput.focus();
                }
            });
        },
        
        filterPostsBySearch(query) {
            const postItems = document.querySelectorAll('.archive-post-item');
            const monthSections = document.querySelectorAll('.archive-month-section');
            const yearSections = document.querySelectorAll('.archive-year-section');
            
            if (query === '') {
                // Show all posts if search is empty
                postItems.forEach(item => item.style.display = '');
                monthSections.forEach(month => month.style.display = '');
                yearSections.forEach(year => year.style.display = '');
                return;
            }
            
            // Filter posts
            postItems.forEach(item => {
                const title = item.querySelector('.archive-post-title').textContent.toLowerCase();
                const isMatch = title.includes(query);
                item.style.display = isMatch ? '' : 'none';
            });
            
            // Hide months with no visible posts
            monthSections.forEach(month => {
                const visiblePosts = Array.from(
                    month.querySelectorAll('.archive-post-item')
                ).filter(item => getComputedStyle(item).display !== 'none');
                month.style.display = visiblePosts.length > 0 ? '' : 'none';
            });
            
            // Hide years with no visible months
            yearSections.forEach(year => {
                const visibleMonths = Array.from(
                    year.querySelectorAll('.archive-month-section')
                ).filter(month => getComputedStyle(month).display !== 'none');
                year.style.display = visibleMonths.length > 0 ? '' : 'none';
            });
        }
    };

    // ====================================
    // 10. INITIALIZE ALL MODULES
    // ====================================
    function init() {
        mobileNavigation.init();
        searchFunctionality.init();
        headerScroll.init();
        smoothScroll.init();
        lazyLoading.init();
        readingTime.init();
        theme.init();
        imageModal.init();
        archivePage.init(); 
        
        // Add fade-in animation to post cards
        const postCards = document.querySelectorAll('.post-card');
        postCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
        
        // Log successful initialization
        console.log('Approved Thoughts: All modules initialized successfully');
    }
    
    // Initialize everything
    init();
    
    // Export utilities for use in other scripts
    window.ApprovedThoughts = {
        readingTime,
        theme,
        search: searchFunctionality
    };
});

// ====================================
// 11. SERVICE WORKER REGISTRATION (Optional)
// ====================================
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}

// Debug: Force initialize archive page if it exists
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.archive-page')) {
        console.log('Archive page detected, forcing initialization...');
        
        // Simple toggle functionality
        const toggleButtons = document.querySelectorAll('.archive-section-toggle');
        console.log('Found toggle buttons:', toggleButtons.length);
        
        toggleButtons.forEach((button, index) => {
            console.log('Setting up button', index, button);
            button.addEventListener('click', function() {
                console.log('Button clicked:', this);
                const targetId = this.getAttribute('data-target');
                console.log('Target ID:', targetId);
                const content = document.getElementById(targetId);
                console.log('Target element:', content);
                
                if (content) {
                    const isExpanded = content.classList.contains('expanded');
                    console.log('Is expanded:', isExpanded);
                    
                    if (isExpanded) {
                        content.classList.remove('expanded');
                        this.setAttribute('aria-expanded', 'false');
                        console.log('Collapsed');
                    } else {
                        content.classList.add('expanded');
                        this.setAttribute('aria-expanded', 'true');
                        console.log('Expanded');
                    }
                } else {
                    console.error('Target element not found for ID:', targetId);
                }
            });
        });
    } else {
        console.log('No archive page found');
    }

    // ====================================
    // 12. COPY LINK FUNCTIONALITY
    // ====================================
    
    // Global function for copy link button
    window.copyPostLink = async function(url) {
        try {
            await navigator.clipboard.writeText(url);
            
            // Find the button that was clicked
            const button = event.target.closest('.copy-link-btn');
            if (button) {
                // Show success state
                const originalText = button.querySelector('.copy-text').textContent;
                button.classList.add('copied');
                button.querySelector('.copy-text').textContent = 'Copied!';
                button.querySelector('.copy-icon').textContent = '✓';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.querySelector('.copy-text').textContent = originalText;
                    button.querySelector('.copy-icon').textContent = '🔗';
                }, 2000);
            }
        } catch (err) {
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const button = event.target.closest('.copy-link-btn');
                if (button) {
                    const originalText = button.querySelector('.copy-text').textContent;
                    button.querySelector('.copy-text').textContent = 'Copied!';
                    setTimeout(() => {
                        button.querySelector('.copy-text').textContent = originalText;
                    }, 2000);
                }
            } catch (fallbackErr) {
                console.error('Failed to copy link:', fallbackErr);
                alert('Copy failed. Please copy manually: ' + url);
            }
        }
    };
});