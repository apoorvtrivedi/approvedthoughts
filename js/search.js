// ====================================
// INLINE SEARCH FUNCTIONALITY
// ====================================

class BlogSearch {
    constructor() {
        this.searchIndex = null;
        this.searchInputs = [];
        this.currentQuery = '';
        this.isLoading = false;
        this.activeSearchContainer = null;
        
        this.init();
    }
    
    async init() {
        // Find all search inputs
        this.searchInputs = document.querySelectorAll('.search-input');
        if (this.searchInputs.length === 0) return;
        
        // Load search index
        await this.loadSearchIndex();
        
        // Set up search containers and event listeners
        this.setupSearchContainers();
        this.setupEventListeners();
        
        console.log('Inline search functionality initialized');
    }
    
    setupSearchContainers() {
        this.searchInputs.forEach(input => {
            const container = input.closest('.search-container') || input.closest('.search-form');
            if (!container) return;
            
            // Make sure container is positioned relative
            container.style.position = 'relative';
            
            // Create results container for this search input
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results-container';
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <span class="search-results-count"></span>
                    <button class="search-clear" aria-label="Clear search">Clear</button>
                </div>
                <div class="search-results"></div>
                <div class="search-keyboard-hint">Press Escape to close</div>
            `;
            
            container.appendChild(resultsContainer);
            
            // Store reference
            input.searchContainer = container;
            input.resultsContainer = resultsContainer;
            input.resultsElement = resultsContainer.querySelector('.search-results');
            input.resultsCount = resultsContainer.querySelector('.search-results-count');
            
            // Clear button event
            resultsContainer.querySelector('.search-clear').addEventListener('click', () => {
                this.clearSearch(input);
            });
        });
    }
    
    async loadSearchIndex() {
        try {
            this.isLoading = true;
            console.log('Attempting to load search index from: data/search-index.json');
            
            const response = await fetch('data/search-index.json');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to load search index: ${response.status}`);
            }
            
            this.searchIndex = await response.json();
            console.log(`Successfully loaded search index with ${this.searchIndex.length} posts`);
        } catch (error) {
            console.error('Error loading search index via fetch:', error);
            
            // Fallback: Use the JavaScript version if available
            if (window.SEARCH_INDEX) {
                console.log('Using fallback JavaScript search index');
                this.searchIndex = window.SEARCH_INDEX;
                console.log(`Loaded search index via fallback with ${this.searchIndex.length} posts`);
            } else {
                console.error('No search index available (neither JSON nor JavaScript fallback)');
                this.searchIndex = [];
            }
        } finally {
            this.isLoading = false;
        }
    }
    
    setupEventListeners() {
        this.searchInputs.forEach(input => {
            // Search input events
            input.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                this.handleSearch(query, input);
            });
            
            // Focus event
            input.addEventListener('focus', () => {
                if (this.currentQuery && input.resultsContainer) {
                    this.showResults(input);
                }
            });
            
            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!input.searchContainer.contains(e.target)) {
                    this.hideResults(input);
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close search
            if (e.key === 'Escape') {
                this.hideAllResults();
                document.activeElement.blur();
            }
            
            // Cmd/Ctrl + K to focus first search input
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (this.searchInputs.length > 0) {
                    this.searchInputs[0].focus();
                }
            }
        });
    }
    
    handleSearch(query, input) {
        this.currentQuery = query;
        this.activeSearchContainer = input.searchContainer;
        
        if (query.length < 2) {
            this.hideResults(input);
            return;
        }
        
        if (this.isLoading) {
            this.showLoading(input);
            return;
        }
        
        if (!this.searchIndex) {
            this.showError(input, 'Search index not loaded');
            return;
        }
        
        const results = this.performSearch(query);
        this.displayResults(results, query, input);
        this.showResults(input);
    }
    
    performSearch(query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        
        return this.searchIndex.map(post => {
            let score = 0;
            const titleLower = post.title.toLowerCase();
            const contentLower = post.searchableText;
            
            searchTerms.forEach(term => {
                // Exact title match (highest score)
                if (titleLower.includes(term)) {
                    score += titleLower === term ? 100 : titleLower.startsWith(term) ? 50 : 20;
                }
                
                // Keyword match (high score)
                if (post.keywords && post.keywords.some(keyword => keyword.includes(term))) {
                    score += 15;
                }
                
                // Tag match (medium score)
                if (post.tags.some(tag => tag.toLowerCase().includes(term))) {
                    score += 10;
                }
                
                // Content match (lower score)
                if (contentLower.includes(term)) {
                    score += 5;
                }
                
                // Excerpt match (medium score)
                if (post.excerpt.toLowerCase().includes(term)) {
                    score += 8;
                }
            });
            
            return { ...post, score };
        })
        .filter(post => post.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Limit to top 8 results for better UX
    }
    
    displayResults(results, query, input) {
        if (!input.resultsElement || !input.resultsCount) return;
        
        // Update results count
        input.resultsCount.textContent = results.length === 0 ? 
            'No results found' : 
            `${results.length} result${results.length !== 1 ? 's' : ''}`;
        
        if (results.length === 0) {
            input.resultsElement.innerHTML = `
                <div class="search-no-results">
                    <p>No results found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                    <p class="search-suggestion">Try different keywords or check your spelling.</p>
                </div>
            `;
            return;
        }
        
        const resultsHtml = results.map(post => {
            const highlightedTitle = this.highlightTerms(post.title, query);
            
            return `
                <article class="search-result-item" onclick="window.location.href='${post.url}'">
                    <h4 class="search-result-title">
                        <a href="${post.url}">${highlightedTitle}</a>
                    </h4>
                    <div class="search-result-meta">
                        <time>${post.dateFormatted}</time>
                        <span class="search-result-type">${this.formatPostType(post.type)}</span>
                    </div>
                </article>
            `;
        }).join('');
        
        input.resultsElement.innerHTML = resultsHtml;
    }
    
    highlightTerms(text, query) {
        const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        let highlightedText = this.escapeHtml(text);
        
        terms.forEach(term => {
            const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
    
    formatPostType(type) {
        const typeMap = {
            'post': 'Post',
            'linkList': 'Links',
            'thoughtPiece': 'Thought Piece',
            'notes': 'Notes'
        };
        return typeMap[type] || type;
    }
    
    showResults(input) {
        if (input.resultsContainer) {
            input.resultsContainer.classList.add('active');
            input.searchContainer.classList.add('has-results');
        }
    }
    
    hideResults(input) {
        if (input.resultsContainer) {
            input.resultsContainer.classList.remove('active');
            input.searchContainer.classList.remove('has-results');
        }
    }
    
    hideAllResults() {
        this.searchInputs.forEach(input => {
            this.hideResults(input);
        });
    }
    
    clearSearch(input) {
        input.value = '';
        this.currentQuery = '';
        this.hideResults(input);
        input.focus();
    }
    
    showLoading(input) {
        if (input.resultsElement) {
            input.resultsElement.innerHTML = `
                <div class="search-loading">
                    <p>Loading search results...</p>
                </div>
            `;
            this.showResults(input);
        }
    }
    
    showError(input, message) {
        if (input.resultsElement) {
            input.resultsElement.innerHTML = `
                <div class="search-error">
                    <p>Error: ${this.escapeHtml(message)}</p>
                </div>
            `;
            this.showResults(input);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogSearch();
});