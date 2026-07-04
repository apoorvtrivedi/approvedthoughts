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
    siteDescription: '',
    siteUrl: 'https://www.approvedthoughts.com',
    author: 'Apoorv Trivedi'
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
function parseDate(date) {
    // If it's a string like "2025-01-15", treat it as local noon to avoid timezone shifts
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Date(date + 'T12:00:00');
    }
    return new Date(date);
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return parseDate(date).toLocaleDateString('en-US', options);
}

function formatDateISO(date) {
    return parseDate(date).toISOString().split('T')[0];
}

function formatDateArchive(date) {
    const options = { month: 'short', day: 'numeric' };
    return parseDate(date).toLocaleDateString('en-US', options);
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

// Prevent quotes/ampersands from breaking attributes
function escapeAttr(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function processInlineImages(content) {
  // 1) Linked images: [![alt](src "caption")](link)
  const linkedImageRegex = /\[!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)\]\(([^)]+)\)/g;

  content = content.replace(linkedImageRegex, (match, alt, src, title, linkUrl) => {
    const id = 'img-' + Math.random().toString(36).slice(2, 11);
    const caption = title || '';
    const captionAttrs = caption ? ` data-caption="${escapeAttr(caption)}" title="${escapeAttr(caption)}"` : '';
    return `
<div class="image-container">
  <a href="${linkUrl}" class="image-link">
    <img src="${src}" alt="${escapeAttr(alt)}"${captionAttrs} loading="lazy" class="inline-image linked-image" id="${id}" />
  </a>
  ${caption ? `<div class="image-caption">${escapeAttr(caption)}</div>` : ''}
</div>`;
  });

  // 2) Regular images: ![alt](src "caption")
  const imageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g;

  content = content.replace(imageRegex, (match, alt, src, title) => {
    const id = 'img-' + Math.random().toString(36).slice(2, 11);
    const caption = title || '';
    const captionAttrs = caption ? ` data-caption="${escapeAttr(caption)}" title="${escapeAttr(caption)}"` : '';
    return `
<div class="image-container">
  <img src="${src}" alt="${escapeAttr(alt)}"${captionAttrs} loading="lazy" class="inline-image clickable-image" onclick="openImageModal('${id}')" id="${id}" style="cursor: pointer;" />
  ${caption ? `<div class="image-caption">${escapeAttr(caption)}</div>` : ''}
</div>`;
  });

  return content;
}

function decorateImagesInHtml(html) {
  const genId = () => 'img-' + Math.random().toString(36).slice(2, 11);

  // Handle linked images: <p><a ...><img ... title="caption"? /></a></p>
  html = html.replace(
    /<p>\s*<a([^>]+)>\s*<img([^>]*?)\/?>\s*<\/a>\s*<\/p>/gi,
    (m, aAttrs, imgAttrs) => {
      const id = genId();
      const titleMatch = imgAttrs.match(/title="([^"]*)"/i);
      const caption = titleMatch ? titleMatch[1] : '';
      // ensure lazy loading
      const hasLoading = /\bloading=/.test(imgAttrs);
      let img = `<img ${imgAttrs.trim()}${hasLoading ? '' : ' loading="lazy"'} class="inline-image linked-image" id="${id}"${caption ? ` data-caption="${caption}"` : ''} />`;
      // keep the original anchor attrs; external-link step will add target/rel once
      const cap = caption ? `<div class="image-caption">${caption}</div>` : '';
      return `<div class="image-container"><a${aAttrs}>${img}</a>${cap}</div>`;
    }
  );

  // Handle plain images: <p><img ... title="caption"? /></p>
  html = html.replace(
    /<p>\s*<img([^>]*?)\/?>\s*<\/p>/gi,
    (m, imgAttrs) => {
      const id = genId();
      const titleMatch = imgAttrs.match(/title="([^"]*)"/i);
      const caption = titleMatch ? titleMatch[1] : '';
      const hasLoading = /\bloading=/.test(imgAttrs);
      let img = `<img ${imgAttrs.trim()}${hasLoading ? '' : ' loading="lazy"'} class="inline-image clickable-image" onclick="openImageModal('${id}')" id="${id}" style="cursor: pointer;"${caption ? ` data-caption="${caption}"` : ''} />`;
      const cap = caption ? `<div class="image-caption">${caption}</div>` : '';
      return `<div class="image-container">${img}${cap}</div>`;
    }
  );

  return html;
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

    const totalPosts = posts.length;
    const totalTags = sortedTags.length;
    const totalYears = sortedYears.length;
    const totalCategories = new Set(posts.map(p => p.type)).size;

    // Generate collapsible <details> year sections
    const yearSections = sortedYears.map((year, i) => {
        const yearPosts = Object.values(archive[year]).flat();
        const yearPostCount = yearPosts.length;

        const months = Object.keys(archive[year]);
        const sortedMonths = months.sort((a, b) =>
            new Date(`${b} 1, ${year}`) - new Date(`${a} 1, ${year}`)
        );

        const monthBlocks = sortedMonths.map(month => {
            const monthPosts = archive[year][month]
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const items = monthPosts.map(post => {
                const slug = `${post.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`;
                return `
                <li data-title="${escapeAttr(post.title.toLowerCase())}">
                    <span class="date">${formatDateArchive(post.date)}</span>
                    <a href="${rootPath}${post.url}"><span class="ttl">${post.title}</span></a>
                    <span class="type">${typeLabel(post.type)}</span>
                </li>`;
            }).join('');

            return `
            <div class="ar-month">${month}</div>
            <ul class="ar-list">${items}
            </ul>`;
        }).join('');

        // First year open by default
        const openAttr = i === 0 ? ' open' : '';

        return `
        <details class="ar-year-block"${openAttr}>
            <summary>${year}<span class="ar-year-count">${yearPostCount} post${yearPostCount !== 1 ? 's' : ''}</span></summary>
            <div class="ar-year-body">${monthBlocks}
            </div>
        </details>`;
    }).join('');

    // Tag cloud — size by frequency
    const maxCount = sortedTags.length ? sortedTags[0].count : 1;
    const tagCloud = sortedTags.map(({ tag, count }) => {
        const sizeClass = count >= maxCount * 0.6 ? 'bigger' : count >= maxCount * 0.35 ? 'big' : '';
        const tagSlug = tag.toLowerCase().replace(/\s+/g, '-');
        return `<a href="${rootPath}tags/${tagSlug}.html" class="${sizeClass}">${tag} <span class="n">${count}</span></a>`;
    }).join('\n            ');

    // Inline search script (< 30 lines, no library)
    const searchScript = `
<script>
(function(){
  var inp = document.getElementById('ar-search');
  if (!inp) return;
  function apply(q){
    q = (q || '').toLowerCase().trim();
    document.querySelectorAll('.ar-list li').forEach(function(li){
      li.hidden = q && !li.dataset.title.includes(q);
    });
    document.querySelectorAll('.ar-year-block').forEach(function(det){
      var visible = det.querySelectorAll('.ar-list li:not([hidden])').length;
      det.toggleAttribute('data-empty', q && !visible);
      if (q && visible && !det.open) det.open = true;
    });
  }
  var params = new URLSearchParams(window.location.search);
  var initial = params.get('q');
  if (initial) { inp.value = initial; apply(initial); }
  inp.addEventListener('input', function(){ apply(inp.value); });
})();
</script>`;

    const archiveContent = `
        <div class="at-body archive">
            <div>
                <h1 class="ar-h1">Archives</h1>
                <div class="ar-search">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>
                    <input id="ar-search" type="search" placeholder="Search posts, links and notes…" aria-label="Search archive">
                </div>
                <div class="ar-stats">
                    <div class="stat"><span class="n">${totalYears}</span><span class="l">Years</span></div>
                    <div class="stat"><span class="n">${totalPosts}</span><span class="l">Posts</span></div>
                    <div class="stat"><span class="n">${totalCategories}</span><span class="l">Categories</span></div>
                    <div class="stat"><span class="n">${totalTags}</span><span class="l">Tags</span></div>
                </div>
                <div class="ar-section-label">Common tags</div>
                <div class="ar-tagcloud">
                    ${tagCloud}
                </div>
                <div class="ar-section-label">By year</div>
                ${yearSections}
            </div>
        </div>
        ${searchScript}`;
    
    const html = template
        .replace(/{{title}}/g, `Archives - ${config.siteTitle}`)
        .replace(/{{description}}/g, `Complete archive of all posts from ${config.siteTitle}`)
        .replace(/{{rootPath}}/g, rootPath)
        .replace('{{content}}', archiveContent)
        .replace('{{ogType}}', 'website')
        .replace('{{url}}', `${config.siteUrl}/archives.html`)
        .replace('{{homeActive}}', '')
        .replace('{{aboutActive}}', '')
        .replace('{{archivesActive}}', 'class="active"');
    
    const relHtml = relativizeAbsolutePaths(html, rootPath);
    await fs.writeFile('archives.html', relHtml);
    console.log('  ✓ Generated: archives.html');
}


// ====================================
// 5. TEMPLATE FUNCTIONS
// ====================================

// Rewrite site-internal absolute paths (src="/foo", href="/foo") so the
// generated HTML works when opened directly via file:// or served from a
// subdirectory. Protocol-relative ("//cdn.example.com") and fragment ("#x")
// hrefs are untouched.
function relativizeAbsolutePaths(html, rootPath) {
  return html.replace(/(\s(?:src|href|data-url)=["'])\/(?!\/)/g, '$1' + rootPath);
}

// SVG icon for RSS feed (reused across header, footer, subscribe sidebar)
const RSS_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3a16 16 0 0 1 16 16h-3A13 13 0 0 0 5 6V3zm0 7a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6v-3zm1.5 7.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>`;

// Get base template
function getBaseTemplate() {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{description}}">
    <title>{{title}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{rootPath}}css/style.css?v=2.0">
    <link rel="icon" type="image/x-icon" href="{{rootPath}}assets/icons/favicon.ico">
    <link rel="alternate" type="application/rss+xml" title="${config.siteTitle} RSS Feed" href="{{rootPath}}feed.xml">
    <link rel="alternate" type="application/feed+json" title="${config.siteTitle} JSON Feed" href="{{rootPath}}feed.json">
    <link rel="sitemap" type="application/xml" title="Sitemap" href="{{rootPath}}sitemap.xml">
    <meta property="og:title" content="{{title}}">
    <meta property="og:description" content="{{description}}">
    <meta property="og:type" content="{{ogType}}">
    <meta property="og:url" content="{{url}}">
</head>
<body>
    <a href="#main" class="skip-link">Skip to main content</a>

    <header class="at-header">
        <div class="at-header-inner">
            <div class="at-header-col">
                <a href="{{rootPath}}index.html" class="at-name-link">
                    <div class="at-name">Approved <em>Thoughts</em></div>
                </a>
                <nav class="at-nav">
                    <a href="{{rootPath}}index.html" {{homeActive}}>Home</a>
                    <a href="{{rootPath}}about.html" {{aboutActive}}>About</a>
                    <a href="{{rootPath}}archives.html" {{archivesActive}}>Archives</a>
                    <a href="{{rootPath}}feed.xml" class="rss-nav" title="RSS feed">${RSS_SVG}RSS</a>
                </nav>
            </div>
            <div></div>
        </div>
    </header>

    <main id="main">
        {{content}}
    </main>

    <footer class="at-footer">
        <span class="seal">Approved Thoughts · MMXXVI</span>
        <div class="links">
            <a href="{{rootPath}}feed.xml" class="at-rss">${RSS_SVG}RSS</a>
            <a href="{{rootPath}}feed.json">JSON</a>
            <a href="{{rootPath}}sitemap.xml">Sitemap</a>
        </div>
    </footer>

    <div id="imageModal" class="image-modal" onclick="closeImageModal()">
        <span class="modal-close">&times;</span>
        <img class="modal-image" id="modalImage" alt="">
        <div class="modal-caption" id="modalCaption"></div>
    </div>

    <script src="{{rootPath}}js/main.js" defer></script>
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</body>
</html>`;
}

// Human-readable type label
function typeLabel(type) {
    const map = {
        'linkList':    'Links',
        'thoughtPiece': 'Thought Piece',
        'notes':       'Notes',
        'post':        'Post',
    };
    return map[type] || capitalize(type);
}

// Tag chips HTML for homepage entries and post pages
function entryTagsHtml(tags, rootPath) {
    if (!tags || !tags.length) return '';
    return tags.map(tag =>
        `<a href="${rootPath}tags/${tag.toLowerCase().replace(/\s+/g, '-')}.html">#${tag}</a>`
    ).join('');
}

// Generate post card HTML (homepage / tag-page stream)
function generatePostCard(post, rootPath = '') {
    const tagsHtml = entryTagsHtml(post.tags, rootPath);
    const tagsBlock = tagsHtml
        ? `<div class="hy-tags">${tagsHtml}</div>`
        : '';

    // Left rail
    const readRow = (post.type !== 'notes' && post.readingTime)
        ? `<span class="read">${post.readingTime}</span>`
        : '';
    const rail = `
        <div class="hy-rail">
            <span class="date">${post.dateFormatted}</span>
            ${readRow}
        </div>`;

    // Right content column — varies by post type
    let bodyHtml;
    if (post.type === 'notes') {
        // Notes: show full inline body
        bodyHtml = `<div class="hy-prose">${post.content}</div>`;
    } else if (post.type === 'linkList') {
        // Links: show full rendered content (list of curated links)
        bodyHtml = `
        <h2 class="hy-title"><a href="${rootPath}${post.url}">${post.title}</a></h2>
        <div class="hy-content">${post.content}</div>`;
    } else {
        // Post / Thought Piece: full title + full content
        bodyHtml = `
        <h2 class="hy-title"><a href="${rootPath}${post.url}">${post.title}</a></h2>
        <div class="hy-content">${post.content}</div>`;
    }

    const linkIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>';

    return `
    <article class="hy-entry">
        ${rail}
        <div>
            ${bodyHtml}
            <div class="hy-footer">
                ${tagsBlock}
                <button type="button" class="hy-copy" data-url="${post.url}" aria-label="Copy link to ${post.title.replace(/"/g, '&quot;')}">${linkIcon}<span>Copy Link</span></button>
            </div>
        </div>
    </article>`;
}

// Generate sidebar HTML
function generateSidebar(recentPosts, rootPath = '') {
    const recentItems = recentPosts.slice(0, 5).map(post => `
                <li>
                    <a href="${rootPath}${post.url}">
                        <span class="at-recent-title">${post.title}</span>
                        <span class="at-recent-date">${post.dateFormatted}</span>
                    </a>
                </li>`).join('');

    return `
            <aside class="at-side">
                <section>
                    <h3>Recent</h3>
                    <ul>${recentItems}
                    </ul>
                </section>
                <section>
                    <h3>Elsewhere</h3>
                    <div class="at-elsewhere">
                        <a href="https://marginalrevolution.com" target="_blank" rel="noopener">Marginal Revolution</a>
                        <a href="https://thezvi.substack.com" target="_blank" rel="noopener">Zvi Mowshowitz</a>
                        <a href="https://simonwillison.net" target="_blank" rel="noopener">Simon Willison</a>
                        <a href="https://www.s-anand.net/blog/" target="_blank" rel="noopener">S Anand</a>
                        <a href="https://www.oneusefulthing.org" target="_blank" rel="noopener">Ethan Mollick</a>
                        <a href="https://karpathy.bearblog.dev/blog/" target="_blank" rel="noopener">Andrej Karpathy</a>
                        <a href="https://astralcodexten.substack.com" target="_blank" rel="noopener">Astral Codex Ten</a>
                        <a href="https://stratechery.com" target="_blank" rel="noopener">Stratechery</a>
                    </div>
                </section>
                <section>
                    <h3>Subscribe</h3>
                    <ul class="at-subscribe-list">
                        <li>
                            <a href="${rootPath}feed.xml" class="at-subscribe-link">
                                ${RSS_SVG}
                                <span>RSS feed</span>
                            </a>
                        </li>
                        <li>
                            <a href="${rootPath}feed.json" class="at-subscribe-link">
                                <span></span>
                                <span>JSON feed</span>
                            </a>
                        </li>
                    </ul>
                </section>
                <section>
                    <h3>Search</h3>
                    <form class="at-search-box" action="${rootPath}archives.html" method="get" role="search">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>
                        <input type="search" name="q" placeholder="Search posts…" aria-label="Search posts">
                    </form>
                </section>
            </aside>`;
}

//  ——————————————
// 6. PER-LINK EMBED HELPERS
//  ——————————————

// ─── Tweet metadata blocks (::: tweet ... :::) ──────────────────────────
//
// The fetch-tweet-metadata script inlines tweet metadata into markdown as a
// fenced ":::tweet" block. We parse those out BEFORE marked() runs and emit
// an inline placeholder (TWEET_CARD::...) so markdown's list parser stays
// intact. expandEmbedPlaceholders() swaps the placeholder for the final
// .hy-tweet HTML.

function parseTweetMetadata(body, indent = '') {
  const meta = {};
  const stripped = body.split('\n').map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l));
  let i = 0;
  while (i < stripped.length) {
    const line = stripped[i];
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const [, key, val] = m;
    if (val === '|') {
      const blockLines = [];
      i++;
      while (i < stripped.length) {
        const next = stripped[i];
        if (next === '') { blockLines.push(''); i++; continue; }
        if (/^  /.test(next)) { blockLines.push(next.slice(2)); i++; continue; }
        break;
      }
      // Trim trailing blank lines that come from formatting only.
      while (blockLines.length && blockLines[blockLines.length - 1] === '') blockLines.pop();
      meta[key] = blockLines.join('\n');
    } else {
      meta[key] = val;
      i++;
    }
  }
  return meta;
}

function processTweetMetadataBlocks(md) {
  // Allow optional leading indent (so blocks inside list items work). The
  // closing ":::" must match the same indent.
  return md.replace(
    /^([ \t]*):::[ \t]*tweet[ \t]*\n([\s\S]*?)\n\1:::[ \t]*$/gm,
    (_, indent, body) => {
      const meta = parseTweetMetadata(body, indent);
      // base64url avoids any character marked might transform (apostrophes,
      // smart quotes, URL escapes). Pure A–Z a–z 0–9 - _ — markdown passthrough.
      const encoded = Buffer.from(JSON.stringify(meta), 'utf-8').toString('base64url');
      return `${indent}{{TWEET_CARD::${encoded}}}`;
    }
  );
}

function tweetInitials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatTweetDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkifyTweetBody(text) {
  // text is already HTML-escaped; turn bare URLs into <a>, and @handles into
  // x.com profile links. target/rel attrs are added later by the external-
  // link rewriter step in processMarkdownFile, so omit them here.
  let out = text;
  out = out.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_, sp, url) => {
    const u = url.replace(/[.,;:!?)]+$/, '');
    const trail = url.slice(u.length);
    return `${sp}<a href="${u}">${u}</a>${trail}`;
  });
  out = out.replace(/(^|\s)@([A-Za-z0-9_]{1,15})/g, (_, sp, h) =>
    `${sp}<a href="https://x.com/${h}">@${h}</a>`
  );
  return out;
}

function renderTweetCard(meta) {
  const initials = tweetInitials(meta.author);
  const dateStr = formatTweetDate(meta.date);
  const bodyEscaped = escapeHtml(meta.body || '').replace(/\n/g, '<br>');
  const bodyLinked = linkifyTweetBody(bodyEscaped);
  const imgHtml = meta.image
    ? `<div class="hy-tweet-img"><img src="${escapeHtml(meta.image)}" alt="" loading="lazy"></div>`
    : '';
  const handleSep = dateStr ? ' · ' : '';
  return [
    `<div class="hy-tweet" data-href="${escapeHtml(meta.url || '')}" role="link" tabindex="0">`,
    `<div class="hy-tweet-avatar">${escapeHtml(initials)}</div>`,
    '<div class="hy-tweet-body-col">',
    '<div class="hy-tweet-meta">',
    `<span class="name">${escapeHtml(meta.author || '')}</span>`,
    `<span class="handle">@${escapeHtml(meta.handle || '')}${handleSep}${escapeHtml(dateStr)}</span>`,
    '</div>',
    `<p class="hy-tweet-body">${bodyLinked}</p>`,
    imgHtml,
    `<div class="hy-tweet-foot"><a href="${escapeHtml(meta.url || '')}">View on X</a></div>`,
    '</div>',
    '</div>',
  ].join('');
}

/**
 * Convert ![embed](https://x.com/.../status/ID)
 * or     ![embed](https://twitter.com/.../status/ID)
 * into a live Tweet embed.
 */
function processTwitterLinks(md) {
  // Step 1: when a list item line is empty (e.g. "7." with no content) and the
  // next non-blank line is an indented ![embed](...) OR a TWEET_CARD
  // placeholder (output of processTweetMetadataBlocks), lift it up onto the
  // list-item line so markdown can form a proper <li>. Otherwise marked
  // treats "N." as plain paragraph text and the item falls out of the list.
  md = md.replace(
    /^([ \t]*)(\d+\.)[ \t]*\n(?:[ \t]*\n)*([ \t]+)(!\[embed\]\([^)]+\)|\{\{TWEET_CARD::[^}]+\}\})/gm,
    (_, lineIndent, marker, _embedIndent, embed) => `${lineIndent}${marker} ${embed}`
  );

  // Step 2: replace ![embed](url) with an inline placeholder so marked's list
  // parser doesn't see block-level HTML (which would split the surrounding
  // <ol>). The real tweet container is swapped in after marked() runs via
  // expandEmbedPlaceholders().
  return md.replace(
    /!\[embed\]\((https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^\/]+\/status\/\d+[^\)]*)\)/g,
    (_, url) => `{{TWEET_EMBED::${encodeURIComponent(url)}}}`
  );
}


/**
 * Turn ![embed](youtu.be/ID) or ![embed](youtube.com/watch?v=ID) into a responsive iframe
 */
function processYouTubeLinks(md) {
  // Note: the empty-list-item lift step is performed in processTwitterLinks
  // (which runs first); both embed types share the ![embed](...) syntax so we
  // only need to do it once.
  return md.replace(
    /!\[embed\]\((?:https?:\/\/youtu\.be\/|https?:\/\/www\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]+)[^\)]*\)/g,
    (_, videoId) => `{{YOUTUBE_EMBED::${videoId}}}`
  );
}

// After marked() runs, swap placeholders for real embed HTML. This keeps
// markdown list parsing intact (block-level HTML in the source would otherwise
// terminate the surrounding <ol>/<li>).
function expandEmbedPlaceholders(html) {
  return html
    .replace(/\{\{TWEET_CARD::([A-Za-z0-9_-]+)\}\}/g, (_, encoded) => {
      try {
        const json = Buffer.from(encoded, 'base64url').toString('utf-8');
        return renderTweetCard(JSON.parse(json));
      } catch (err) {
        return '';
      }
    })
    .replace(/\{\{TWEET_EMBED::([^}]+)\}\}/g, (_, encoded) => {
      const url = decodeURIComponent(encoded);
      const canonical = url.replace(
        /^https?:\/\/(?:www\.)?x\.com/,
        'https://twitter.com'
      );
      return `<div class="tweet-container" style="margin:0 auto 1rem;"><blockquote class="twitter-tweet" data-width="350"><a href="${canonical}"></a></blockquote></div>`;
    })
    .replace(/\{\{YOUTUBE_EMBED::([A-Za-z0-9_-]+)\}\}/g, (_, videoId) =>
      // youtube-nocookie.com is the privacy-enhanced domain; it's also more
      // permissive about embedding contexts (some videos that error 153 on
      // youtube.com play here). referrerpolicy + title are recommended by
      // YouTube's own embed snippet.
      `<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
    )
    // Tidy up: if a placeholder was wrapped in a <p> by markdown, lift it out
    // so the embed is a block-level sibling not nested inside paragraph.
    .replace(/<p>(\s*<div class="(?:tweet|video)-container"[\s\S]*?<\/div>\s*)<\/p>/g, '$1')
    .replace(/<p>(\s*<div class="hy-tweet"[^>]*>[\s\S]*?<\/div><\/div>\s*)<\/p>/g, '$1');
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

    // 0. Normalize 4-space-indented blockquotes to 3-space (tab-indented quotes)
    let normalizedContent = content.replace(
        /(^```[\s\S]*?^```)|^ {1,4}(>)/gm,
        (match, codeBlock, quote) => codeBlock ? codeBlock : '   ' + quote
    );

    // 1. Convert only our “![embed](…)” links into blockquotes/iframes
    // Tweet metadata blocks (::: tweet ... :::) → inline placeholder.
    let processedContent = processTweetMetadataBlocks(normalizedContent);
    processedContent = processTwitterLinks(processedContent);
    processedContent = processYouTubeLinks(processedContent);

    // 2. Convert to HTML first
    let htmlContent = marked(processedContent);

    // 2a. Expand embed placeholders → real tweet/YouTube containers
    htmlContent = expandEmbedPlaceholders(htmlContent);

    // 2b. Mark <li><p>…</p> where the <p> immediately starts with <a>. CSS
    // styles only those first anchors as link-list "headlines" (bolder, a
    // touch larger). Items whose first paragraph starts with text (and have
    // inline <a>s later in the sentence) stay as ordinary inline links.
    htmlContent = htmlContent.replace(
      /<li>(\s*)<p>(\s*)<a\b/g,
      '<li>$1<p class="hy-link-headline">$2<a'
    );

    // 2.5 Now wrap images inside the HTML so lists/quotes stay intact
    const htmlWithImages = decorateImagesInHtml(htmlContent);

    // 3. Merge consecutive blockquotes
    const mergedBlockquotes = mergeConsecutiveBlockquotes(htmlWithImages);

    // 4. External links (opens off-site in new tab, added once)
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

    // Find prev/next posts for pagination
    const idx = allPosts.findIndex(p => p.url === post.url);
    const olderPost = allPosts[idx + 1] || null;
    const newerPost = allPosts[idx - 1] || null;

    const paginationHtml = (olderPost || newerPost) ? `
        <div class="pp-pagination">
            ${olderPost ? `
            <a href="${rootPath}${olderPost.url}" class="prev">
                <span class="label">← Older</span>
                <span class="ttl">${olderPost.title}</span>
            </a>` : '<div></div>'}
            ${newerPost ? `
            <a href="${rootPath}${newerPost.url}" class="next">
                <span class="label">Newer →</span>
                <span class="ttl">${newerPost.title}</span>
            </a>` : '<div></div>'}
        </div>` : '';

    const tagsHtml = post.tags && post.tags.length
        ? `<div class="pp-tags">
            <span class="label">Tagged</span>
            ${post.tags.map(tag => `<a href="${rootPath}tags/${tag.toLowerCase().replace(/\s+/g, '-')}.html">#${tag}</a>`).join('')}
           </div>`
        : '';

    const readRow = (post.type !== 'notes' && post.readingTime)
        ? `<span class="read">${post.readingTime}</span>` : '';

    const postContent = `
        <div class="at-body">
            <article>
                <div class="pp-meta">
                    <span class="date">${post.dateFormatted}</span>
                    ${readRow}
                    <span class="type">${typeLabel(post.type)}</span>
                </div>
                <h1 class="pp-title">${post.title}</h1>
                <div class="pp-prose">
                    ${post.content}
                </div>
                ${tagsHtml}
                ${paginationHtml}
            </article>
            ${generateSidebar(allPosts, rootPath)}
        </div>`;
    
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
    const relHtml = relativizeAbsolutePaths(html, rootPath);
    await fs.writeFile(post.url, relHtml);
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
    
    const prevLink = pageNum > 1
        ? `<a href="${pageNum === 2 ? rootPath + 'index.html' : rootPath + 'page/' + (pageNum - 1) + '.html'}">← Newer</a>`
        : `<span class="disabled">← Newer</span>`;
    const nextLink = pageNum < totalPages
        ? `<a href="${rootPath}page/${pageNum + 1}.html">Older →</a>`
        : `<span class="disabled">Older →</span>`;

    const indexContent = `
        <div class="at-body">
            <section>
                ${pagePosts.map(post => generatePostCard(post, rootPath)).join('\n')}
                ${totalPages > 1 ? `
                <nav class="hy-pagination" aria-label="Posts pagination">
                    ${prevLink}
                    <span class="current">Page ${pageNum} of ${totalPages}</span>
                    ${nextLink}
                </nav>` : ''}
            </section>
            ${generateSidebar(posts, rootPath)}
        </div>`;
    
    const html = template
        .replace(/{{title}}/g, pageNum === 1 ? config.siteTitle : `Page ${pageNum} - ${config.siteTitle}`)
        .replace(/{{description}}/g, config.siteDescription)
        .replace(/{{rootPath}}/g, rootPath)
        .replace('{{content}}', indexContent)
        .replace('{{ogType}}', 'website')
        .replace('{{url}}', config.siteUrl)
        .replace('{{homeActive}}', 'class="active"')
        .replace('{{aboutActive}}', '')
        .replace('{{archivesActive}}', '');
    
    // Ensure directory exists for pagination pages
    if (pageNum > 1) {
        await fs.ensureDir('page');
    }
    
    const relHtml = relativizeAbsolutePaths(html, rootPath);
    await fs.writeFile(fileName, relHtml);
    console.log(`  ✓ Generated: ${fileName}`);
}

// Prepare a post's HTML for inclusion in RSS/JSON feeds. Feed readers can't
// use our CSS or JS, so we:
//   1. Reduce .hy-tweet cards to a minimal blockquote: @handle (linked to X)
//      + body text + attached image, dropping avatar/name/date/"View on X".
//   2. Keep YouTube iframes AND append a text-link fallback (many readers
//      strip iframes for security).
//   3. Strip DOM handlers (onclick, id, style, data-*, role, tabindex).
//   4. Fix stray unescaped '&' entities.
//   5. Rewrite site-relative href/src to absolute URLs (without breaking
//      URLs that are already absolute — the bug the previous regex had for
//      pbs.twimg.com image sources).
function prepareContentForFeed(post) {
    let content = post.content;

    // 1. Tweet cards → simple blockquote.
    content = content.replace(
        /<div class="hy-tweet" data-href="([^"]+)"[^>]*>[\s\S]*?<span class="handle">@([A-Za-z0-9_]+)[^<]*<\/span>[\s\S]*?<p class="hy-tweet-body">([\s\S]*?)<\/p>([\s\S]*?)<\/div><\/div><\/div>/g,
        (_, url, handle, body, tail) => {
            const imgMatch = tail.match(/<img[^>]+src="([^"]+)"[^>]*>/);
            const imgHtml = imgMatch ? `<p><img src="${imgMatch[1]}" alt="" /></p>` : '';
            return `<blockquote><p><a href="${url}">@${handle}</a></p><p>${body}</p>${imgHtml}</blockquote>`;
        }
    );

    // 2. YouTube: keep the iframe but add a plain-link fallback beneath it.
    content = content.replace(
        /<div class="video-container"><iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]+)[^"]*"[^>]*><\/iframe><\/div>/g,
        (match, videoId) =>
            `${match}<p><a href="https://www.youtube.com/watch?v=${videoId}">Watch on YouTube</a></p>`
    );

    // 3. Strip stuff that has no place in a feed. NOTE: we no longer strip
    //    iframes here — YouTube embeds need to survive.
    content = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/onclick="[^"]*"/g, '')
        .replace(/id="[^"]*"/g, '')
        .replace(/style="[^"]*"/g, '')
        .replace(/data-[\w-]+="[^"]*"/g, '')
        .replace(/role="[^"]*"/g, '')
        .replace(/tabindex="[^"]*"/g, '')
        .replace(/&(?![a-zA-Z0-9#]{1,6};)/g, '&amp;')
        .trim();

    // 4. Rewrite site-relative URLs to absolute. Skip URLs that already
    //    start with http://, https:// or // (protocol-relative), so we
    //    don't double-prefix pbs.twimg.com or other external hosts.
    const abs = (path) => {
        const clean = path.replace(/^\//, '');
        return `${config.siteUrl}/${clean}`;
    };
    content = content
        .replace(/href="(?!https?:\/\/|\/\/|mailto:|#)([^"]+)"/g, (_, path) => `href="${abs(path)}"`)
        .replace(/href="#([^"]*)"/g, `href="${config.siteUrl}/${post.url}#$1"`)
        .replace(/src="(?!https?:\/\/|\/\/|data:)([^"]+)"/g, (_, path) => `src="${abs(path)}"`);

    return content;
}

// Generate RSS feed and JSON feed
async function generateRSSFeed(posts) {
    // RSS Feed Generation
    const feedItems = posts.slice(0, 20).map(post => {
        const cleanContent = prepareContentForFeed(post);
        
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
        const cleanContent = prepareContentForFeed(post);
        
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
        <div class="at-body">
            <section>
                <div class="pp-meta">
                    <span class="type">Tagged: ${tag}</span>
                    <span class="read">${tagPosts.length} post${tagPosts.length !== 1 ? 's' : ''}</span>
                </div>
                ${tagPosts.map(post => generatePostCard(post, rootPath)).join('\n')}
            </section>
            ${generateSidebar(posts, rootPath)}
        </div>`;
        
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
        const relHtml = relativizeAbsolutePaths(html, rootPath);
        await fs.writeFile(`tags/${tagSlug}.html`, relHtml);
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
        <div class="at-body single">
            <article>
                <h1 class="ab-h1">${data.title || 'About'}</h1>
                <div class="ab-prose">
                    ${htmlContent}
                </div>
            </article>
        </div>`;
        
        const html = template
            .replace(/{{title}}/g, `${data.title || 'About'} - ${config.siteTitle}`)
            .replace(/{{description}}/g, data.description || 'About page')
            .replace(/{{rootPath}}/g, rootPath)
            .replace('{{content}}', aboutPageContent)
            .replace('{{ogType}}', 'website')
            .replace('{{url}}', `${config.siteUrl}/about.html`)
            .replace('{{homeActive}}', '')
            .replace('{{aboutActive}}', 'class="active"')
            .replace('{{archivesActive}}', '');
        
        const relHtml = relativizeAbsolutePaths(html, rootPath);
        await fs.writeFile('about.html', relHtml);
        console.log('  ✓ Generated: about.html');
        
    } catch (error) {
        console.error('  ❌ Error generating about page:', error.message);
    }
}

// Generate 404 page
async function generate404Page() {
    const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Page not found">
    <title>404 — ${config.siteTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css?v=2.0">
    <link rel="icon" type="image/x-icon" href="assets/icons/favicon.ico">
</head>
<body>
    <div class="nf-wrap">
        <span class="nf-mark">Approved Thoughts</span>
        <div class="nf-num">404</div>
        <div class="nf-line">Approved thoughts, <em>unapproved</em> URL.</div>
        <p class="nf-sub">The page you are looking for does not exist, or has been moved, or perhaps was never written. Feel free to have unapproved thoughts at this time.</p>
        <div class="nf-actions">
            <a href="index.html">← Back home</a>
            <a href="archives.html" class="muted">Browse archives</a>
        </div>
    </div>
</body>
</html>`;

    const relHtml = relativizeAbsolutePaths(html, '');
    await fs.writeFile('404.html', relHtml);
    console.log('  ✓ Generated: 404.html');
}

// ====================================
// BLOCKQUOTE MERGING IN BUILD SCRIPT
// ====================================

/**
 * Merge consecutive blockquotes in HTML content
 * This processes the HTML after markdown conversion to merge adjacent blockquotes
 */
function mergeConsecutiveBlockquotes(htmlContent) {
    // Merge adjacent <blockquote> elements into one by removing the boundary tags
    let result = htmlContent;
    let previous;
    do {
        previous = result;
        result = result.replace(/<\/blockquote>(\s*)<blockquote>/g, '<p>&nbsp;</p>');
    } while (result !== previous);
    return result;
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

        // 12. Generate 404 page
        console.log('\n🔍 Generating 404 page...');
        await generate404Page();
        
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