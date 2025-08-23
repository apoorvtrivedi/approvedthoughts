#!/usr/bin/env node

// ====================================
// APPROVED THOUGHTS - BUILD SCRIPT
// ====================================

const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const markedFootnote = require('marked-footnote');
const matter = require('gray-matter');
const glob = require('glob');

// Configuration
const config = {
    postsDirectory: 'posts',
    outputDirectory: '.',
    templatesDirectory: 'templates',
    postsPerPage: 10,
    siteTitle: 'Approved Thoughts',
    siteDescription: 'A blog about technology, ideas, and observations',
    siteUrl: 'https://www.approvedthoughts.com',
    author: 'Your Name'
};

// Store for all posts data
let allPosts = [];
let allTags = new Set();

// ====================================
// 1. MARKDOWN CONFIGURATION
// ====================================

// ─── BEGIN Custom Link Renderer ─────────────────────────────────────────

// 1. Create a new renderer based on marked's default
const renderer = new marked.Renderer();
const originalLink = renderer.link;

// 2. Override how links are built:
renderer.link = function(href, title, text) {
  // call the original to get the basic <a>…</a> HTML
  let html = originalLink.call(this, href, title, text);
  // if it's an external link…
  if (/^https?:\/\//.test(href) && !href.includes('approvedthoughts.com')) {
    // inject the safety attributes
    html = html.replace(
      '<a', 
      '<a target="_blank" rel="noopener noreferrer"'
    );
  }
  return html;
};

// 3. Configure marked with footnotes support
marked.use(markedFootnote());
marked.setOptions({
  renderer,
  headerIds:   true,
  breaks:      false,  // Changed to false for better paragraph handling
  gfm:         true,
  tables:      true,
  smartLists:  true,
  smartypants: true,
  pedantic:    false   // This helps with paragraph processing
});

// ─── END Custom Link Renderer ───────────────────────────────────────────

// ====================================
// 2. UTILITY FUNCTIONS
// ====================================

// Calculate reading time
function calculateReadingTime(content) {
    const words = content.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Format date for datetime attribute
function formatDateISO(date) {
    return new Date(date).toISOString().split('T')[0];
}

// Format date for archive (shorter format)
function formatDateArchive(date) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Create slug from filename
function createSlug(filename) {
    return path.basename(filename, '.md')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Get post type color class
function getPostTypeClass(type) {
    const typeMap = {
        'post': 'post-type-post',
        'linkList': 'post-type-linkList',
        'thoughtPiece': 'post-type-thoughtPiece',
        'notes': 'post-type-notes'
    };
    return typeMap[type] || 'post-type-post';
}

// Capitalize first letter of a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function processInlineImages(content) {
    // First, handle linked images: [![alt text](image-url)](link-url)
    const linkedImageRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;
    
    content = content.replace(linkedImageRegex, (match, alt, src, linkUrl) => {
        // Create a unique ID for each image
        const imageId = 'img-' + Math.random().toString(36).substr(2, 9);
        
        // Create enhanced image with link wrapper
        return `
<div class="image-container">
    <a href="${linkUrl}" target="_blank" rel="noopener" class="image-link">
        <img 
            src="${src}" 
            alt="${alt}" 
            loading="lazy" 
            class="inline-image linked-image" 
            id="${imageId}"
        />
    </a>
    ${alt ? `<div class="image-caption">${alt}</div>` : ''}
</div>`;
    });
    
    // Then handle regular images: ![alt text](image-url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    content = content.replace(imageRegex, (match, alt, src) => {
        // Create a unique ID for each image
        const imageId = 'img-' + Math.random().toString(36).substr(2, 9);
        
        // Create enhanced image with click-to-enlarge (no external link)
        return `
<div class="image-container">
    <img 
        src="${src}" 
        alt="${alt}" 
        loading="lazy" 
        class="inline-image clickable-image" 
        onclick="openImageModal('${imageId}')"
        id="${imageId}"
        style="cursor: pointer;"
    />
    ${alt ? `<div class="image-caption">${alt}</div>` : ''}
</div>`;
    });
    
    return content;
}

// ====================================
// 3. SEARCH INDEX FUNCTIONS
// ====================================

// Create searchable text from content
function createSearchableText(content) {
    // Remove HTML tags
    let text = content.replace(/<[^>]*>/g, ' ');
    
    // Remove special characters but keep basic punctuation
    text = text.replace(/[^\w\s\-.,!?]/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text.toLowerCase();
}

// Create search keywords from text
function extractKeywords(text, title) {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
        'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
        'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
        'its', 'our', 'their', 'from', 'into', 'about', 'through', 'during',
        'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
        'under', 'again', 'further', 'then', 'once'
    ]);
    
    // Extract words from title and content
    const allText = `${title} ${text}`.toLowerCase();
    const words = allText.match(/\b\w{2,}\b/g) || [];
    
    // Filter out stop words and short words
    const keywords = words.filter(word => 
        word.length >= 3 && !stopWords.has(word)
    );
    
    // Count frequency and return unique words
    const wordCount = {};
    keywords.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return words sorted by frequency (most common first)
    return Object.keys(wordCount)
        .sort((a, b) => wordCount[b] - wordCount[a])
        .slice(0, 50); // Limit to top 50 keywords
}

// Generate enhanced search index
async function generateSearchIndex(posts) {
    const searchIndex = posts.map(post => {
        const searchableContent = createSearchableText(post.content);
        const keywords = extractKeywords(searchableContent, post.title);
        
        return {
            id: post.slug,
            title: post.title,
            url: post.url,
            date: post.date,
            dateFormatted: post.dateFormatted,
            excerpt: post.excerpt,
            type: post.type,
            tags: post.tags || [],
            keywords: keywords,
            searchableText: searchableContent,
            // Include first 200 characters for preview
            preview: searchableContent.substring(0, 200) + '...'
        };
    });
    
    await fs.ensureDir('data');
    await fs.writeFile('data/search-index.json', JSON.stringify(searchIndex, null, 2));
    console.log('  ✓ Generated: data/search-index.json');
}

// ====================================
// 4. ARCHIVE FUNCTIONS
// ====================================

// Organize posts by year and month for archive
function organizePostsForArchive(posts) {
    const archive = {};
    const tagCounts = {};
    
    posts.forEach(post => {
        const date = new Date(post.date);
        const year = date.getFullYear();
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        
        // Organize by year/month
        if (!archive[year]) {
            archive[year] = {};
        }
        if (!archive[year][month]) {
            archive[year][month] = [];
        }
        archive[year][month].push(post);
        
        // Count tags
        if (post.tags) {
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    return { archive, tagCounts };
}

async function generateArchivePage(posts) {
    const template = getBaseTemplate();
    const rootPath = '';
    const { archive, tagCounts } = organizePostsForArchive(posts);
    
    // Sort years (newest first)
    const sortedYears = Object.keys(archive).sort((a, b) => b - a);
    
    // Sort tags by count (most used first)
    const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([tag, count]) => ({ tag, count }));
    
    // Calculate stats
    const totalPosts = posts.length;
    const totalTags = sortedTags.length;
    const totalYears = sortedYears.length;
    
    // Generate year sections
    const yearSections = sortedYears.map(year => {
        const yearPosts = Object.values(archive[year]).flat();
        const yearPostCount = yearPosts.length;
        
        // Sort months within year (newest first)
        const months = Object.keys(archive[year]);
        const sortedMonths = months.sort((a, b) => {
            return new Date(`${b} 1, ${year}`) - new Date(`${a} 1, ${year}`);
        });
        
        const monthSections = sortedMonths.map(month => {
            const monthPosts = archive[year][month];
            const monthPostCount = monthPosts.length;
            const monthId = `month-${year}-${month.replace(/\s+/g, '-').toLowerCase()}`;
            
            // Sort posts within month (newest first)
            const sortedPosts = monthPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const postList = sortedPosts.map(post => `
                <li class="archive-post-item">
                    <a href="${rootPath}${post.url}" class="archive-post-link">
                        <span class="archive-post-date">${formatDateArchive(post.date)}</span>
                        <span class="archive-post-title">${post.title}</span>
                    </a>
                </li>`).join('');
            
            return `
                <div class="archive-month-section">
                    <button class="archive-month-toggle" data-target="${monthId}" aria-expanded="false">
                        <span class="toggle-icon">▶</span>
                        <span class="month-title">${month} ${year}</span>
                        <span class="post-count-badge">${monthPostCount} post${monthPostCount !== 1 ? 's' : ''}</span>
                    </button>
                    <div class="archive-section-content" id="${monthId}" data-tags='${JSON.stringify(sortedPosts.flatMap(p => p.tags || []))}'>
                        <ul class="archive-post-list">
                            ${postList}
                        </ul>
                    </div>
                </div>`;
        }).join('');
        
        return `
            <div class="archive-year-section">
                <button class="archive-year-toggle" data-target="year-${year}" aria-expanded="false">
                    <span class="year-indicator">${year}</span>
                    <span class="post-count-badge">${yearPostCount} post${yearPostCount !== 1 ? 's' : ''}</span>
                    <span class="toggle-icon">▶</span>
                </button>
                <div class="archive-section-content" id="year-${year}">
                    ${monthSections}
                </div>
            </div>`;
    }).join('');
    
    // Generate tag pills
    const tagPills = sortedTags.map(({ tag, count }) => `
        <button class="tag-pill" data-tag="${tag}">
            <span>${tag}</span>
            <span class="tag-count">${count}</span>
        </button>`).join('');
    
    const archiveContent = `
                <!-- Main Content Area -->
                <main id="main" class="main-content">
                    <div class="archive-page">
                        <header class="archive-header">
                            <h1 class="archive-title">Archives</h1>
                            <p class="archive-description">Browse all posts by year, month, or filter by topic</p>
                        </header>
                        
                        <!-- Enhanced Search -->
                        <div class="search-container">
                            <input type="search" class="search-input" placeholder="Search posts by title or content..." aria-label="Search posts">
                            <div class="search-icon">🔍</div>
                        </div>
                        
                        <!-- Stats Overview -->
                        <div class="archive-stats">
                            <div class="stat-item">
                                <span class="stat-number">${totalPosts}</span>
                                <span class="stat-label">Total Posts</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${totalTags}</span>
                                <span class="stat-label">Categories</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${totalYears}</span>
                                <span class="stat-label">Year${totalYears !== 1 ? 's' : ''} Active</span>
                            </div>
                        </div>
                        
                        <!-- Tag Filter Bar -->
                        <div class="tag-filter-bar">
                            <div class="filter-label">
                                Filter by Topic
                            </div>
                            <div class="tag-pills">
                                <button class="tag-pill active" data-tag="">
                                    <span>All Posts</span>
                                </button>
                                ${tagPills}
                            </div>
                        </div>
                        
                        <!-- Archive Timeline -->
                        <div class="archive-timeline">
                            ${yearSections}
                        </div>
                    </div>
                </main>
                
                ${generateSidebar(posts, rootPath)}`;
    
    const html = template
        .replace(/{{title}}/g, `Archives - ${config.siteTitle}`)
        .replace(/{{description}}/g, `Complete archive of all posts from ${config.siteTitle}`)
        .replace(/{{rootPath}}/g, rootPath)
        .replace('{{content}}', archiveContent)
        .replace('{{ogType}}', 'website')
        .replace('{{url}}', `${config.siteUrl}/archives.html`)
        .replace('{{homeActive}}', '')
        .replace('{{aboutActive}}', '')
        .replace('{{archivesActive}}', 'active');
    
    await fs.writeFile('archives.html', html);
    console.log('  ✓ Generated: archives.html');
}


// ====================================
// 5. TEMPLATE FUNCTIONS
// ====================================

// Get base template
function getBaseTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{description}}">
    
    <title>{{title}}</title>
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="{{rootPath}}css/style.css?v=1.1">
    <link rel="stylesheet" href="{{rootPath}}css/responsive.css?v=1.1">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{rootPath}}assets/icons/favicon.ico">
    
    <!-- RSS Feed -->
    <link rel="alternate" type="application/rss+xml" title="${config.siteTitle} RSS Feed" href="{{rootPath}}feed.xml">
    <link rel="alternate" type="application/feed+json" title="${config.siteTitle} JSON Feed" href="{{rootPath}}feed.json">

    <!-- Sitemap -->
    <link rel="sitemap" type="application/xml" title="Sitemap" href="{{rootPath}}sitemap.xml">

    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="{{title}}">
    <meta property="og:description" content="{{description}}">
    <meta property="og:type" content="{{ogType}}">
    <meta property="og:url" content="{{url}}">
</head>
<body>
    <!-- Skip to main content for accessibility -->
    <a href="#main" class="skip-link">Skip to main content</a>
    
    <!-- Header Banner -->
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <!-- Logo/Site Name -->
                <div class="site-branding">
                    <a href="{{rootPath}}index.html" class="site-logo">
                        <h1 class="site-title">${config.siteTitle}</h1>
                    </a>
                </div>
                
                <!-- Navigation -->
                <nav class="main-navigation" aria-label="Main navigation">
                    <button class="menu-toggle" aria-label="Toggle navigation menu">
                        <span class="hamburger"></span>
                    </button>
                    <ul class="nav-menu">
                        <li><a href="{{rootPath}}index.html" class="nav-link {{homeActive}}">Home</a></li>
                        <li><a href="{{rootPath}}about.html" class="nav-link {{aboutActive}}">About</a></li>
                        <li><a href="{{rootPath}}archives.html" class="nav-link {{archivesActive}}">Archives</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>
    
    <!-- Main Layout Container -->
    <div class="site-container">
        <div class="container">
            <div class="content-wrapper">
                {{content}}
            </div>
        </div>
    </div>
    
    <!-- Image Modal for Click-to-Enlarge -->
    <div id="imageModal" class="image-modal" onclick="closeImageModal()">
        <span class="modal-close">&times;</span>
        <img class="modal-image" id="modalImage">
        <div class="modal-caption" id="modalCaption"></div>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
        <div class="container">
            <div class="footer-content">
                <p class="copyright">© ${new Date().getFullYear()} ${config.siteTitle}. All rights reserved.</p>
                <p class="footer-links">
                    <a href="{{rootPath}}feed.xml">RSS Feed</a>
                    <span class="separator">•</span>
                    <a href="{{rootPath}}sitemap.xml">Sitemap</a>
                </p>
            </div>
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script src="{{rootPath}}js/main.js" defer></script>
    <script src="{{rootPath}}js/search.js" defer></script>
    <!-- Twitter embed library -->
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</body>
</html>`;
}

// Generate post card HTML
function generatePostCard(post, rootPath = '') {
    const readingTime = post.type === 'notes' ? '' : `<span class="read-time">${post.readingTime}</span>`;
    const postClass = post.type === 'notes' ? 'post-card post-card-notes' : 'post-card';
    const contentSection = `<div class="post-content">
        ${post.content}
    </div>`;

    return `
      <article class="${postClass}">
        <header class="post-header">
          <h3 class="post-title">
            <a href="${rootPath}${post.url}">${post.title}</a>
          </h3>
          <div class="post-meta">
            <time datetime="${post.dateISO}">${post.dateFormatted}</time>
            <span class="post-meta-separator">•</span>
            <span class="post-type ${getPostTypeClass(post.type)}">
              ${post.type === 'linkList' ? 'Links' : 
                post.type === 'thoughtPiece' ? 'Thought Piece' : 
                post.type === 'notes' ? 'Notes' : 
                capitalize(post.type)}
            </span>
            ${readingTime ? `<span class="post-meta-separator">•</span>${readingTime}` : ''}
          </div>
        </header>
        ${contentSection}
        
        <footer class="post-footer">
          <div class="post-tags">
            ${post.tags.map(tag => `<a href="${rootPath}tags/${tag.toLowerCase().replace(/\s+/g, '-')}.html" class="tag">#${tag}</a>`).join('')}
          </div>
          <div class="post-actions">
            <button class="copy-link-btn" onclick="copyPostLink('${config.siteUrl}/${post.url}')" title="Copy link to this post">
              <span class="copy-icon">🔗</span>
              <span class="copy-text">Copy Link</span>
            </button>
          </div>
        </footer>
      </article>`;
}

// Generate sidebar HTML
function generateSidebar(recentPosts, rootPath = '') {
    return `
                <!-- Sidebar -->
                <aside class="sidebar" aria-label="Sidebar">
                    <!-- Recent Posts Section -->
                    <section class="sidebar-section">
                        <h3 class="sidebar-title">Recent Posts</h3>
                        <ul class="recent-posts-list">
                            ${recentPosts.slice(0, 5).map(post => `
                            <li class="recent-post-item">
                                <a href="${rootPath}${post.url}" class="recent-post-link">
                                    <span class="recent-post-title">${post.title}</span>
                                    <span class="recent-post-date">${new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </a>
                            </li>`).join('')}
                        </ul>
                    </section>
                    
                    <!-- External Links Section -->
                    <section class="sidebar-section">
                        <h3 class="sidebar-title">Elsewhere</h3>
                        <ul class="external-links-list">
                            <li class="external-link-item">
                                <a href="https://marginalrevolution.com" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Marginal Revolution</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://thezvi.substack.com" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Zvi Mowshowitz</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://simonwillison.net" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Simon Willison</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://www.s-anand.net/blog/" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">S Anand</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://www.oneusefulthing.org" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Ethan Mollick</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://karpathy.bearblog.dev/blog/" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Andrej Karpathy</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://astralcodexten.substack.com" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Astral Codex Ten</span>
                                </a>
                            </li>
                            <li class="external-link-item">
                                <a href="https://stratechery.com" class="external-link" target="_blank" rel="noopener">
                                    <span class="link-text">Stratechery</span>
                                </a>
                            </li>
                        </ul>
                    </section>
                    
                    <!-- Search Box -->
                    <section class="sidebar-section">
                        <h3 class="sidebar-title">Search</h3>
                        <form class="search-form" action="#" method="get">
                            <label for="search-input" class="visually-hidden">Search posts</label>
                            <input type="search" id="search-input" class="search-input" placeholder="Search posts..." aria-label="Search posts">
                            <div class="search-icon">🔍</div>
                        </form>
                    </section>
                </aside>`;
}

//  ——————————————
// 6. PER-LINK EMBED HELPERS
//  ——————————————

/**
 * Convert ![embed](https://x.com/.../status/ID)
 * or     ![embed](https://twitter.com/.../status/ID)
 * into a live Tweet embed.
 */
function processTwitterLinks(md) {
  return md.replace(
    /!\[embed\]\((https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^\/]+\/status\/\d+[^\)]*)\)/g,
    (_, url) => {
      // If it’s an x.com link, rewrite to twitter.com
      const canonical = url.replace(
        /^https?:\/\/(?:www\.)?x\.com/,
        'https://twitter.com'
      );
      return `
<div class="tweet-container" style="margin:0 auto 1rem;">
  <blockquote class="twitter-tweet" data-width="350">
    <a href="${canonical}"></a>
  </blockquote>
</div>`;
    }
  );
}


/**
 * Turn ![embed](youtu.be/ID) or ![embed](youtube.com/watch?v=ID) into a responsive iframe
 */
function processYouTubeLinks(md) {
  return md.replace(
    /!\[embed\]\((?:https?:\/\/youtu\.be\/|https?:\/\/www\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]+)[^\)]*\)/g,
    (_, videoId) => `
<div class="video-container">
  <iframe
    src="https://www.youtube.com/embed/${videoId}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
</div>`
  );
}



// ====================================
// 7. BUILD FUNCTIONS
// ====================================

// Process markdown file
async function processMarkdownFile(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    // Set default values for required fields
    if (!data.type) {
        data.type = 'post'; // Default to 'post' type if not specified
    }
    if (!data.tags) {
        data.tags = []; // Default to empty array if no tags
    }
    if (!data.date) {
        data.date = new Date(); // Default to today if no date
    }

    // 1. Convert only our “![embed](…)” links into blockquotes/iframes
    let processedContent = processTwitterLinks(content);
    processedContent       = processYouTubeLinks(processedContent);

    // 2. Now handle any remaining markdown images
    processedContent       = processInlineImages(processedContent);

    // 3. Finally convert to HTML
    const htmlContent = marked(processedContent);

    // 4. Merge consecutive blockquotes
    const mergedBlockquotes = mergeConsecutiveBlockquotesAdvanced(htmlContent);

    // Process external links
    const processedHtml = mergedBlockquotes.replace(
        /<a href="(https?:\/\/(?![^"]*approvedthoughts\.com)[^"]+)"/g,
        '<a href="$1" target="_blank" rel="noopener"'
    );

    // Calculate reading time
    const readingTime = calculateReadingTime(content);
    
    // Create URL path
    const year = new Date(data.date).getFullYear();
    const slug = createSlug(filePath);
    const url = `posts/${year}/${slug}.html`;
    
    // Extract excerpt
    let excerpt = data.excerpt || '';
    if (!excerpt) {
        // Extract first paragraph if no excerpt provided
        const firstParagraph = content.split('\n\n')[0];
        excerpt = firstParagraph.replace(/[#*`]/g, '').trim().substring(0, 150) + '...';
    }
    
    // Collect tags
    if (data.tags) {
        data.tags.forEach(tag => allTags.add(tag));
    }
    
    return {
        ...data,
        content: processedHtml,
        excerpt,
        readingTime,
        url,
        slug,
        year,
        dateFormatted: formatDate(data.date),
        dateISO: formatDateISO(data.date),
        filePath
    };
}

// Generate post HTML page
async function generatePostPage(post) {
    const template = getBaseTemplate();
    const rootPath = '../../'; // Posts are two levels deep
    
    const postContent = `
                <!-- Main Content Area -->
                <main id="main" class="main-content">
                    <article class="post-full">
                        <header class="post-header">
                            <h1 class="post-title">${post.title}</h1>
                            <div class="post-meta">
                                <time class="post-date" datetime="${post.dateISO}">${post.dateFormatted}</time>
                                <span class="post-meta-separator">•</span>
                                <span class="post-type ${getPostTypeClass(post.type)}">${post.type === 'linkList' ? 'Links' : post.type === 'thoughtPiece' ? 'Thought Piece' : post.type === 'notes' ? 'Notes' : post.type.charAt(0).toUpperCase() + post.type.slice(1)}</span>
                                ${post.type !== 'notes' ? `<span class="post-meta-separator">•</span><span class="read-time">${post.readingTime}</span>` : ''}
                            </div>
                        </header>
                        
                        <div class="post-content">
                            ${post.content}
                        </div>
                        
                        <footer class="post-footer">
                            <div class="post-tags">
                                ${post.tags ? post.tags.map(tag => `<a href="${rootPath}tags/${tag.toLowerCase().replace(/\s+/g, '-')}.html" class="tag">#${tag}</a>`).join('\n                                ') : ''}
                            </div>
                            <div class="post-actions">
                                <button class="copy-link-btn" onclick="copyPostLink('${config.siteUrl}/${post.url}')" title="Copy link to this post">
                                    <span class="copy-icon">🔗</span>
                                    <span class="copy-text">Copy Link</span>
                                </button>
                            </div>
                        </footer>
                    </article>
                </main>
                
                ${generateSidebar(allPosts, rootPath)}`;
    
    const html = template
        .replace(/{{title}}/g, `${post.title} - ${config.siteTitle}`)
        .replace(/{{description}}/g, post.excerpt)
        .replace(/{{rootPath}}/g, rootPath)
        .replace('{{content}}', postContent)
        .replace('{{ogType}}', 'article')
        .replace('{{url}}', `${config.siteUrl}/${post.url}`)
        .replace('{{homeActive}}', '')
        .replace('{{aboutActive}}', '')
        .replace('{{archivesActive}}', '');
    
    // Ensure directory exists
    const postDir = path.dirname(post.url);
    await fs.ensureDir(postDir);
    
    // Write file
    await fs.writeFile(post.url, html);
    console.log(`  ✓ Generated: ${post.url}`);
}

// Generate index page
async function generateIndexPage(posts, pageNum = 1) {
    const template = getBaseTemplate();
    const postsPerPage = config.postsPerPage;
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const startIndex = (pageNum - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const pagePosts = posts.slice(startIndex, endIndex);
    
    const rootPath = pageNum === 1 ? '' : '../';
    const fileName = pageNum === 1 ? 'index.html' : `page/${pageNum}.html`;
    
    const indexContent = `
                <!-- Main Content Area -->
                <main id="main" class="main-content">
                    <!-- Recent Posts -->
                    <section class="posts-section">
                        <h2 class="section-title">Recent Posts</h2>
                        
                        ${pagePosts.map(post => generatePostCard(post, rootPath)).join('\n')}
                    </section>
                    
                    <!-- Pagination -->
                    <nav class="pagination" aria-label="Posts pagination">
                        ${pageNum > 1 
                            ? `<a href="${pageNum === 2 ? rootPath + 'index.html' : rootPath + 'page/' + (pageNum - 1) + '.html'}" class="pagination-prev">← Newer Posts</a>`
                            : '<span class="pagination-prev disabled" aria-disabled="true">← Newer Posts</span>'}
                        <span class="pagination-current">Page ${pageNum} of ${totalPages}</span>
                        ${pageNum < totalPages
                            ? `<a href="${rootPath}page/${pageNum + 1}.html" class="pagination-next">Older Posts →</a>`
                            : '<span class="pagination-next disabled" aria-disabled="true">Older Posts →</span>'}
                    </nav>
                </main>
                
                ${generateSidebar(posts, rootPath)}`;
    
    const html = template
        .replace(/{{title}}/g, pageNum === 1 ? config.siteTitle : `Page ${pageNum} - ${config.siteTitle}`)
        .replace(/{{description}}/g, config.siteDescription)
        .replace(/{{rootPath}}/g, rootPath)
        .replace('{{content}}', indexContent)
        .replace('{{ogType}}', 'website')
        .replace('{{url}}', config.siteUrl)
        .replace('{{homeActive}}', 'active')
        .replace('{{aboutActive}}', '')
        .replace('{{archivesActive}}', '');
    
    // Ensure directory exists for pagination pages
    if (pageNum > 1) {
        await fs.ensureDir('page');
    }
    
    await fs.writeFile(fileName, html);
    console.log(`  ✓ Generated: ${fileName}`);
}

// Generate RSS feed and JSON feed
async function generateRSSFeed(posts) {
    // RSS Feed Generation
    const feedItems = posts.slice(0, 20).map(post => {
        // Clean up content for RSS - more thorough cleaning
        let cleanContent = post.content
            .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
            .replace(/onclick="[^"]*"/g, '') // Remove onclick handlers
            .replace(/id="[^"]*"/g, '') // Remove IDs that might conflict
            .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframes
            .replace(/style="[^"]*"/g, '') // Remove style attributes
            .replace(/&(?![a-zA-Z0-9#]{1,6};)/g, '&amp;') // Fix unescaped & characters
            .trim();
        
        // Convert relative URLs to absolute URLs
        cleanContent = cleanContent
            .replace(/href="([^"]*\.html)"/g, `href="${config.siteUrl}/$1"`)
            .replace(/href="#([^"]*)"/g, `href="${config.siteUrl}/${post.url}#$1"`) // Fix relative anchors
            .replace(/src="([^"]*\.(jpg|jpeg|png|gif|webp))"/g, `src="${config.siteUrl}/$1"`);
        
        // Create a simpler description without HTML for better compatibility
        const plainDescription = post.excerpt
            .replace(/<[^>]*>/g, '') // Strip all HTML
            .replace(/&[^;]+;/g, ' ') // Remove HTML entities
            .trim()
            .substring(0, 200) + (post.excerpt.length > 200 ? '...' : '');
        
        // Format publication date properly for RSS
        const pubDate = new Date(post.date).toUTCString();
        
        return `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <link>${config.siteUrl}/${post.url}</link>
            <guid isPermaLink="true">${config.siteUrl}/${post.url}</guid>
            <pubDate>${pubDate}</pubDate>
            <description><![CDATA[${plainDescription}]]></description>
            <content:encoded><![CDATA[${cleanContent}]]></content:encoded>
            <author>noreply@approvedthoughts.com (${config.author})</author>
            ${post.tags ? post.tags.map(tag => `<category><![CDATA[${tag}]]></category>`).join('\n            ') : ''}
        </item>`;
    }).join('\n');
    
    // Get the latest post date for lastBuildDate
    const latestDate = posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();
    
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:dc="http://purl.org/dc/elements/1.1/">
    <channel>
        <title><![CDATA[${config.siteTitle}]]></title>
        <link>${config.siteUrl}</link>
        <description><![CDATA[${config.siteDescription}]]></description>
        <language>en-us</language>
        <managingEditor>noreply@approvedthoughts.com (${config.author})</managingEditor>
        <webMaster>noreply@approvedthoughts.com (${config.author})</webMaster>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <pubDate>${latestDate}</pubDate>
        <generator>Approved Thoughts Static Site Generator</generator>
        <docs>https://www.rssboard.org/rss-specification</docs>
        <ttl>1440</ttl>
        <atom:link href="${config.siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
        ${feedItems}
    </channel>
</rss>`;
    
    await fs.writeFile('feed.xml', rssFeed);
    console.log('  ✓ Generated: feed.xml (with full content)');

    // JSON Feed Generation (rest remains the same)
    const jsonItems = posts.slice(0, 20).map(post => {
        // Clean up content similar to RSS but less strict for JSON
        let cleanContent = post.content
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/onclick="[^"]*"/g, '')
            .trim();
        
        // Ensure all URLs are absolute
        cleanContent = cleanContent
            .replace(/href="([^"]*\.html)"/g, `href="${config.siteUrl}/$1"`)
            .replace(/href="#([^"]*)"/g, `href="${config.siteUrl}/${post.url}#$1"`)
            .replace(/src="([^"]*\.(jpg|jpeg|png|gif|webp))"/g, `src="${config.siteUrl}/$1"`);
        
        return {
            id: `${config.siteUrl}/${post.url}`,
            url: `${config.siteUrl}/${post.url}`,
            title: post.title,
            content_html: cleanContent,
            summary: post.excerpt.replace(/<[^>]*>/g, '').trim(),
            date_published: new Date(post.date).toISOString(),
            tags: post.tags || [],
            authors: [{
                name: config.author,
                url: config.siteUrl
            }]
        };
    });
    
    const jsonFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: config.siteTitle,
        home_page_url: config.siteUrl,
        feed_url: `${config.siteUrl}/feed.json`,
        description: config.siteDescription,
        author: {
            name: config.author,
            url: config.siteUrl
        },
        language: "en",
        items: jsonItems
    };
    
    await fs.writeFile('feed.json', JSON.stringify(jsonFeed, null, 2));
    console.log('  ✓ Generated: feed.json');
}

// Generate XML sitemap
async function generateSitemap(posts) {
    // Get current date in ISO format for lastmod
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Generate URLs for all posts
    const postUrls = posts.map(post => {
        const postDate = new Date(post.date).toISOString().split('T')[0];
        return `
    <url>
        <loc>${config.siteUrl}/${post.url}</loc>
        <lastmod>${postDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    }).join('');
    
    // Generate URLs for tag pages
    const tagUrls = Array.from(allTags).map(tag => {
        const tagSlug = tag.toLowerCase().replace(/\s+/g, '-');
        return `
    <url>
        <loc>${config.siteUrl}/tags/${tagSlug}.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`;
    }).join('');
    
    // Generate pagination URLs
    const totalPages = Math.ceil(posts.length / config.postsPerPage);
    const paginationUrls = Array.from({length: totalPages}, (_, i) => {
        const pageNum = i + 1;
        const url = pageNum === 1 ? config.siteUrl : `${config.siteUrl}/page/${pageNum}.html`;
        const priority = pageNum === 1 ? '1.0' : '0.7';
        
        return `
    <url>
        <loc>${url}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>${priority}</priority>
    </url>`;
    }).join('');
    
    // Complete sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${config.siteUrl}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${config.siteUrl}/about.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>${config.siteUrl}/archives.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>${postUrls}${tagUrls}${paginationUrls}
</urlset>`;

    await fs.writeFile('sitemap.xml', sitemap);
    console.log('  ✓ Generated: sitemap.xml');
    
    // Also generate robots.txt
    const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${config.siteUrl}/sitemap.xml

# Disallow search results and admin areas (if any)
Disallow: /data/
Disallow: /*.json$
`;

    await fs.writeFile('robots.txt', robotsTxt);
    console.log('  ✓ Generated: robots.txt');
}

// Generate tag pages
async function generateTagPages(posts) {
    for (const tag of allTags) {
        const tagSlug = tag.toLowerCase().replace(/\s+/g, '-');
        const tagPosts = posts.filter(post => post.tags && post.tags.includes(tag));
        
        const template = getBaseTemplate();
        const rootPath = '../';
        
        const tagContent = `
                <!-- Main Content Area -->
                <main id="main" class="main-content">
                    <!-- Tag Posts -->
                    <section class="posts-section">
                        <h2 class="section-title">Posts tagged "${tag}"</h2>
                        <p class="tag-count">${tagPosts.length} post${tagPosts.length !== 1 ? 's' : ''}</p>
                        
                        ${tagPosts.map(post => generatePostCard(post, rootPath)).join('\n')}
                    </section>
                </main>
                
                ${generateSidebar(posts, rootPath)}`;
        
        const html = template
            .replace(/{{title}}/g, `Posts tagged "${tag}" - ${config.siteTitle}`)
            .replace(/{{description}}/g, `All posts tagged with ${tag}`)
            .replace(/{{rootPath}}/g, rootPath)
            .replace('{{content}}', tagContent)
            .replace('{{ogType}}', 'website')
            .replace('{{url}}', `${config.siteUrl}/tags/${tagSlug}.html`)
            .replace('{{homeActive}}', '')
            .replace('{{aboutActive}}', '')
            .replace('{{archivesActive}}', '');
        
        await fs.ensureDir('tags');
        await fs.writeFile(`tags/${tagSlug}.html`, html);
        console.log(`  ✓ Generated: tags/${tagSlug}.html`);
    }
}

// Create searchable text from content
function createSearchableText(content) {
    // Remove HTML tags
    let text = content.replace(/<[^>]*>/g, ' ');
    
    // Remove special characters but keep basic punctuation
    text = text.replace(/[^\w\s\-.,!?]/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text.toLowerCase();
}

// Create search keywords from text
function extractKeywords(text, title) {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
        'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
        'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
        'its', 'our', 'their', 'from', 'into', 'about', 'through', 'during',
        'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
        'under', 'again', 'further', 'then', 'once'
    ]);
    
    // Extract words from title and content
    const allText = `${title} ${text}`.toLowerCase();
    const words = allText.match(/\b\w{2,}\b/g) || [];
    
    // Filter out stop words and short words
    const keywords = words.filter(word => 
        word.length >= 3 && !stopWords.has(word)
    );
    
    // Count frequency and return unique words
    const wordCount = {};
    keywords.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return words sorted by frequency (most common first)
    return Object.keys(wordCount)
        .sort((a, b) => wordCount[b] - wordCount[a])
        .slice(0, 50); // Limit to top 50 keywords
}

// Generate posts.json for search
async function generateSearchIndex(posts) {
    const searchData = posts.map(post => {
        const searchableContent = createSearchableText(post.content);
        const keywords = extractKeywords(searchableContent, post.title);
        
        return {
            id: post.slug,
            title: post.title,
            url: post.url,
            date: post.date,
            dateFormatted: post.dateFormatted,
            excerpt: post.excerpt,
            type: post.type,
            tags: post.tags || [],
            keywords: keywords,
            searchableText: searchableContent,
            // Include first 200 characters for preview
            preview: searchableContent.substring(0, 200) + '...',
            // Keep legacy fields for backward compatibility
            content: post.content.replace(/<[^>]*>/g, '').substring(0, 500)
        };
    });
    
    await fs.ensureDir('data');
    // Create both the new search index and keep the old posts.json for compatibility
    await fs.writeFile('data/search-index.json', JSON.stringify(searchData, null, 2));
    await fs.writeFile('data/posts.json', JSON.stringify(searchData, null, 2));
    console.log('  ✓ Generated: data/search-index.json');
    console.log('  ✓ Generated: data/posts.json');
}

// Generate about page
async function generateAboutPage(posts) {
    try {
        // Check if about.md exists
        const aboutPath = 'about.md';
        if (!await fs.pathExists(aboutPath)) {
            console.log('  ⚠️  about.md not found, skipping about page generation');
            return;
        }

        // Read and process the about.md file
        const aboutContent = await fs.readFile(aboutPath, 'utf-8');
        const { data, content } = matter(aboutContent);
        
        // Generate HTML from markdown
        const htmlContent = marked(content);
        
        const template = getBaseTemplate();
        const rootPath = '';
        
        const aboutPageContent = `
                <!-- Main Content Area -->
                <main id="main" class="main-content">
                    <article class="post-full">
                        <header class="post-header">
                            <h1 class="post-title">${data.title || 'About'}</h1>
                        </header>
                        
                        <div class="post-content">
                            ${htmlContent}
                        </div>
                    </article>
                </main>
                
                ${generateSidebar(posts, rootPath)}`;
        
        const html = template
            .replace(/{{title}}/g, `${data.title || 'About'} - ${config.siteTitle}`)
            .replace(/{{description}}/g, data.description || 'About page')
            .replace(/{{rootPath}}/g, rootPath)
            .replace('{{content}}', aboutPageContent)
            .replace('{{ogType}}', 'website')
            .replace('{{url}}', `${config.siteUrl}/about.html`)
            .replace('{{homeActive}}', '')
            .replace('{{aboutActive}}', 'active')
            .replace('{{archivesActive}}', '');
        
        await fs.writeFile('about.html', html);
        console.log('  ✓ Generated: about.html');
        
    } catch (error) {
        console.error('  ❌ Error generating about page:', error.message);
    }
}

// ====================================
// BLOCKQUOTE MERGING IN BUILD SCRIPT
// ====================================

/**
 * Merge consecutive blockquotes in HTML content
 * This processes the HTML after markdown conversion to merge adjacent blockquotes
 */
function mergeConsecutiveBlockquotes(htmlContent) {
    // Use a simple approach to merge consecutive blockquotes
    // This regex finds patterns like: </blockquote>\s*<blockquote>
    
    // First, let's handle the case where blockquotes are separated only by whitespace
    let processedContent = htmlContent.replace(
        /<\/blockquote>\s*<blockquote>/g, 
        '\n\n' // Replace the blockquote boundaries with paragraph breaks
    );
    
    return processedContent;
}

/**
 * Better approach: Parse HTML and merge blockquotes properly
 */
function mergeConsecutiveBlockquotesAdvanced(htmlContent) {
    // Split content into lines for easier processing
    const lines = htmlContent.split('\n');
    const result = [];
    let inBlockquote = false;
    let blockquoteBuffer = [];
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i].trim();
        
        if (line === '<blockquote>') {
            if (inBlockquote) {
                // We're already in a blockquote and found another one
                // Add a paragraph break to separate the content
                blockquoteBuffer.push('');
                blockquoteBuffer.push('');
            } else {
                // Starting a new blockquote
                inBlockquote = true;
                blockquoteBuffer = ['<blockquote>'];
            }
        } else if (line === '</blockquote>') {
            // Check if the next non-empty line is another blockquote
            let nextLineIndex = i + 1;
            let nextSignificantLine = '';
            
            // Skip empty lines to find the next significant content
            while (nextLineIndex < lines.length) {
                const nextLine = lines[nextLineIndex].trim();
                if (nextLine !== '') {
                    nextSignificantLine = nextLine;
                    break;
                }
                nextLineIndex++;
            }
            
            if (nextSignificantLine === '<blockquote>') {
                // Next significant line is another blockquote, so don't close this one yet
                // Skip to that blockquote
                i = nextLineIndex;
                continue;
            } else {
                // Close the blockquote
                blockquoteBuffer.push('</blockquote>');
                result.push(...blockquoteBuffer);
                inBlockquote = false;
                blockquoteBuffer = [];
            }
        } else {
            if (inBlockquote) {
                blockquoteBuffer.push(lines[i]);
            } else {
                result.push(lines[i]);
            }
        }
        i++;
    }
    
    // Handle case where content ends while in a blockquote
    if (inBlockquote && blockquoteBuffer.length > 0) {
        if (!blockquoteBuffer.includes('</blockquote>')) {
            blockquoteBuffer.push('</blockquote>');
        }
        result.push(...blockquoteBuffer);
    }
    
    return result.join('\n');
}

// ====================================
// 9. MAIN BUILD PROCESS
// ====================================

async function build() {
    console.log('🚀 Starting build process...\n');
    
    try {
        // 1. Find all markdown files
        console.log('📝 Processing markdown files...');
        const markdownFiles = glob.sync(`${config.postsDirectory}/**/*.md`);
        console.log(`  Found ${markdownFiles.length} posts`);
        
        // 2. Process each markdown file
        for (const file of markdownFiles) {
            const post = await processMarkdownFile(file);
            allPosts.push(post);
        }
        
        // 3. Sort posts by date (newest first)
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 4. Generate individual post pages
        console.log('\n📄 Generating post pages...');
        for (const post of allPosts) {
            await generatePostPage(post);
        }
        
        // 5. Generate index pages
        console.log('\n🏠 Generating index pages...');
        const totalPages = Math.ceil(allPosts.length / config.postsPerPage);
        for (let i = 1; i <= totalPages; i++) {
            await generateIndexPage(allPosts, i);
        }
        
        // 6. Generate tag pages
        console.log('\n🏷️  Generating tag pages...');
        await generateTagPages(allPosts);
        
        // 7. Generate RSS and JSON feeds
        console.log('\n📡 Generating feeds...');
        await generateRSSFeed(allPosts);
        
        // 8. Generate search index
        console.log('\n🔍 Generating search index...');
        await generateSearchIndex(allPosts);
        
        // 9. Generate about page
        console.log('\n📄 Generating about page...');
        await generateAboutPage(allPosts);

        // 10. Generate archive page
        console.log('\n📂 Generating archive page...');
        await generateArchivePage(allPosts);

        // 11. Generate sitemap
        console.log('\n🗺️  Generating sitemap...');
        await generateSitemap(allPosts);
        
        console.log('\n✨ Build complete! Your site is ready.\n');
        console.log(`📊 Summary:`);
        console.log(`  - ${allPosts.length} posts`);
        console.log(`  - ${allTags.size} tags`);
        console.log(`  - ${totalPages} index pages`);
        console.log(`  - About page`);
        console.log(`  - Search index`);
        console.log(`  - RSS and JSON feeds`);
        console.log(`  - Sitemap and robots.txt`);
        console.log('\n🌐 Open index.html in your browser to view your site!');
        
    } catch (error) {
        console.error('\n❌ Build failed:', error);
        process.exit(1);
    }
}

// Run the build
build();