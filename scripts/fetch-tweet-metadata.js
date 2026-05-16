#!/usr/bin/env node

// scripts/fetch-tweet-metadata.js
//
// Scans posts/ for ![embed](https://x.com/.../status/ID) and replaces each
// with an inline metadata block of the form:
//
//     ::: tweet
//     url: https://x.com/user/status/ID
//     author: Display Name
//     handle: username
//     date: 2026-04-14T12:04:00Z
//     image: https://pbs.twimg.com/...   (optional, first attached photo)
//     body: |
//       Tweet body text, supports
//       multiple lines.
//     :::
//
// Metadata is fetched from FxTwitter's public JSON API
// (https://github.com/FixTweet/FxTwitter). Results are cached in
// data/tweet-cache.json so re-runs are fast and offline-safe.
//
// Usage:
//   node scripts/fetch-tweet-metadata.js          # convert unconverted embeds
//   node scripts/fetch-tweet-metadata.js --dry    # print what would change
//   node scripts/fetch-tweet-metadata.js --refresh  # refetch cached entries too

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry');
const REFRESH = args.includes('--refresh');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const CACHE_FILE = path.join(ROOT, 'data', 'tweet-cache.json');

// Match ![embed](https://[x|twitter].com/<user>/status/<id>...). The line
// prefix can be: just whitespace, a numbered list marker like "4. ", or
// arbitrary content followed by the embed at end-of-line (e.g. a "link:"
// glue line that puts the inline link and embed on the same row). We
// capture all three cases so we can re-indent the replacement block to
// stay inside the surrounding list-item or paragraph.
const EMBED_RE = /^([ \t]*)([^\n]*?)!\[embed\]\((https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)[^)]*)\)([ \t]*)$/gm;

let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
} catch {
  /* no cache yet */
}

function escapeBlockScalarLine(line) {
  // Block scalars preserve newlines, so we just need to avoid the trailing
  // ":::" delimiter ever appearing alone on a line in the body. Indent every
  // body line by 2 spaces. Tabs become spaces to keep things predictable.
  return '  ' + line.replace(/\t/g, '  ');
}

function renderMetadataBlock(meta, indent = '') {
  const lines = [
    '::: tweet',
    `url: ${meta.url}`,
    `author: ${meta.author || ''}`,
    `handle: ${meta.handle || ''}`,
    `date: ${meta.created_at || ''}`,
  ];
  if (meta.image) lines.push(`image: ${meta.image}`);
  lines.push('body: |');
  const body = (meta.text || '').split('\n').map(escapeBlockScalarLine);
  lines.push(...body);
  lines.push(':::');
  // Prefix every line with the indent so the block sits inside whatever
  // markdown container (list item, blockquote) it replaces.
  return lines.map((l) => (l === '' ? '' : indent + l)).join('\n');
}

// We use vxtwitter (instead of fxtwitter) as the primary source because it
// returns the FULL text of long-form tweets — fxtwitter caps at the classic
// 280-char display range and loses the rest of "Notes" / Premium long tweets.
//
// vxtwitter response shape (all flat, no .tweet wrapper):
//   { text, user_name, user_screen_name, date, mediaURLs, media_extended, ... }
async function fetchTweet(url, id, user) {
  if (!REFRESH && cache[id]) return cache[id];

  const apiUrl = `https://api.vxtwitter.com/${encodeURIComponent(user)}/status/${id}`;
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      res = await fetch(apiUrl, { headers: { 'User-Agent': 'approvedthoughts-build/1.0' } });
    } catch (err) {
      console.warn(`    ✗ ${id}: ${err.message} (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (res.status === 429 || res.status === 503) {
      const wait = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s, 16s
      console.warn(`    … ${id}: HTTP ${res.status}, retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    break;
  }
  try {
    if (!res || !res.ok) {
      console.warn(`    ✗ ${id}: HTTP ${res ? res.status : '?'}`);
      return null;
    }
    const t = await res.json();
    if (!t || !t.tweetID) {
      console.warn(`    ✗ ${id}: no tweet payload`);
      return null;
    }
    // Pick a representative image: prefer the first photo; otherwise the
    // thumbnail of the first video/gif. media_extended is per-item with type.
    let image = '';
    if (Array.isArray(t.media_extended) && t.media_extended.length) {
      const photo = t.media_extended.find((m) => m.type === 'image');
      if (photo) image = photo.url;
      else image = t.media_extended[0].thumbnail_url || '';
    } else if (Array.isArray(t.mediaURLs) && t.mediaURLs.length) {
      image = t.mediaURLs[0];
    }
    const result = {
      url: t.tweetURL || url,
      id: String(t.tweetID || id),
      author: t.user_name || '',
      handle: t.user_screen_name || user,
      text: t.text || '',
      created_at: t.date || '',
      timestamp: t.date_epoch || 0,
      image,
      likes: t.likes,
      retweets: t.retweets,
      replies: t.replies,
      _fetched_at: new Date().toISOString(),
    };
    cache[id] = result;
    return result;
  } catch (err) {
    console.warn(`    ✗ ${id}: ${err.message}`);
    return null;
  }
}

// Match an existing ":::tweet … :::" block so we can refresh its body
// against newly-fetched metadata. The url inside the block tells us which
// tweet it represents.
const BLOCK_RE = /^([ \t]*):::[ \t]*tweet[ \t]*\n([\s\S]*?)\n\1:::[ \t]*$/gm;

function extractBlockUrl(body) {
  const m = body.match(/^[ \t]*url:[ \t]*(\S+)/m);
  return m ? m[1] : null;
}

function extractIdFromUrl(url) {
  const m = url.match(/status\/(\d+)/);
  return m ? m[1] : null;
}

function extractUserFromUrl(url) {
  const m = url.match(/(?:x|twitter)\.com\/([^/]+)\/status/);
  return m ? m[1] : 'i';
}

async function processFile(filePath) {
  const md = fs.readFileSync(filePath, 'utf-8');
  let modified = md;
  let touched = false;

  // ── Pass 1: convert any remaining ![embed](url) ─────────────────────────
  const embedMatches = [...md.matchAll(EMBED_RE)];
  if (embedMatches.length) {
    console.log(`\n${path.relative(ROOT, filePath)}  (${embedMatches.length} embed${embedMatches.length > 1 ? 's' : ''})`);
    for (const m of embedMatches) {
      const [full, indent, prefix, url, user, id] = m;
      console.log(`  · ${id}`);
      const meta = await fetchTweet(url, id, user);
      if (!meta) continue;

      const trimmedPrefix = prefix.replace(/[ \t]+$/, '');
      const listMarkerOnly = /^\d+\.[ \t]+$/.test(prefix);
      let replacement;
      if (!trimmedPrefix) {
        replacement = renderMetadataBlock(meta, indent);
      } else if (listMarkerOnly) {
        const block = renderMetadataBlock(meta, indent + '   ');
        replacement = `${indent}${trimmedPrefix}\n${block}`;
      } else {
        const startsWithMarker = /^\d+\.[ \t]+/.test(prefix);
        const blockIndent = startsWithMarker ? indent + '   ' : indent;
        const block = renderMetadataBlock(meta, blockIndent);
        replacement = `${indent}${trimmedPrefix}\n${block}`;
      }
      modified = modified.replace(full, replacement);
      touched = true;
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  // ── Pass 2 (refresh mode only): rewrite existing ":::tweet" blocks from
  // freshly-fetched metadata. Useful after switching API or to pick up
  // edited/extended tweets. Walks the ALREADY-MUTATED text from pass 1 so
  // it sees any blocks just added.
  if (REFRESH) {
    const blocks = [...modified.matchAll(BLOCK_RE)];
    if (blocks.length) {
      console.log(`${path.relative(ROOT, filePath)}  (refresh: ${blocks.length} existing block${blocks.length > 1 ? 's' : ''})`);
      // Rewrite from bottom-up so the indices don't shift on us mid-loop.
      for (const m of blocks.slice().reverse()) {
        const [full, indent, body] = m;
        const url = extractBlockUrl(body);
        if (!url) continue;
        const id = extractIdFromUrl(url);
        const user = extractUserFromUrl(url);
        if (!id) continue;
        console.log(`  ↻ ${id}`);
        const meta = await fetchTweet(url, id, user);
        if (!meta) continue;
        const block = renderMetadataBlock(meta, indent);
        modified = modified.slice(0, m.index) + block + modified.slice(m.index + full.length);
        touched = true;
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  if (!touched) return false;
  if (DRY_RUN) {
    console.log('  [dry-run] would write changes');
    return false;
  }
  fs.writeFileSync(filePath, modified);
  console.log(`  ✓ wrote ${path.relative(ROOT, filePath)}`);
  return true;
}

(async () => {
  if (typeof fetch !== 'function') {
    console.error('This script requires Node.js 18+ (global fetch).');
    process.exit(1);
  }

  const files = glob.sync(`${POSTS_DIR}/**/*.md`);
  console.log(`Scanning ${files.length} markdown files...`);

  let changed = 0;
  for (const f of files) {
    if (await processFile(f)) changed++;
  }

  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  }

  console.log(`\nDone. ${changed} file${changed === 1 ? '' : 's'} ${DRY_RUN ? 'would be' : 'were'} modified.`);
  console.log(`Cache: ${Object.keys(cache).length} tweet${Object.keys(cache).length === 1 ? '' : 's'} stored in data/tweet-cache.json.`);
})();
