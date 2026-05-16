# Handoff v2 — Approved Thoughts Visual Refresh

## What this is

A targeted handoff package to **finish porting** the visual refresh of [approvedthoughts.com](https://approvedthoughts.com).

The previous handoff was used to make a first pass through `build.js` and `css/style.css`. That pass succeeded broadly — the page structure, font loading, design tokens, and most class definitions are already in place. However, **specific decisions from later iterations were missed**, which is why the rendered site doesn't match the final prototype.

This handoff lists those gaps explicitly, with exact patches.

## Read this first

Open these two files in a browser side-by-side as you work:

- **`reference/Phase 3 - Templates.html`** — final reference for the **post page, archives page, about page, and 404 page**. Plain HTML/CSS, inspect-able. This is authoritative for those four templates.
- **`reference/Hybrid Prototype.html`** — final reference for the **homepage**. Note: this file uses React/JSX for fast iteration; **ignore the Tweaks panel** (the green floating control) and **ignore everything inside `<script>` tags**. The visual output is what matters. Right-click → Inspect to see the rendered DOM.

The defaults baked into both files are the locked design decisions. **Do not introduce any "what if" variants** — the user already chose.

## Files in this handoff

| File | Purpose |
|---|---|
| `README.md` | This document. Read top to bottom. |
| `GAPS.md` | The 8 specific things still wrong in the current implementation, with patches. |
| `css/style.css` | A clean drop-in stylesheet. Use it as the source of truth when reconciling. |
| `reference/Phase 3 - Templates.html` | Visual reference for post / archives / about / 404 pages. |
| `reference/Hybrid Prototype.html` | Visual reference for the homepage (ignore the React/JSX). |

## Locked design decisions (summary)

These are settled. Do not revisit them in the port.

### Palette
- **Paper** (page bg): `#f4efe6` warm cream
- **Paper-2** (sunken surfaces, search boxes, footer): `color-mix(in srgb, #f4efe6 88%, #000 4%)`
- **Ink** (primary text): `#2a241d`
- **Ink-2** (secondary text): `#685c4d`
- **Ink-3** (tertiary, metadata): `#9b9082`
- **Rule** (borders): `#d8cfbe`
- **Rule-soft** (softer borders): `#e3dccd`
- **Accent** (single accent color): `#b04a2f` terracotta
- **Accent-soft**: `color-mix(in srgb, #b04a2f 70%, #fff 30%)`

### Typography
- **Wordmark only**: Atkinson Hyperlegible, **weight 700**, ~44px
- **Everything else**: Nunito Sans, body weight **300** (light)
- Titles use Nunito Sans **weight 700** (not 500 or 600)
- Section heads, sidebar labels, UI text: Nunito Sans **600**, uppercase, tracked 0.18–0.22em

Google Fonts URL:
```
https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap
```

### Accent intensity: **High**
Terracotta appears on: post dates (left rail and meta row), sidebar section headings, list numerals (Links posts), the `Thoughts` em in the wordmark, tags, permalinks, recent-post dates, archive year section labels, archive collapse `+`/`–` indicators, post-page links.

### Layout
- Page max-width with sidebar: **1120px**, gutter **64px**, sidebar **240px**, horizontal padding **56px**
- Single-column page max-width (About): **760px**
- Archive page max-width: **880px** (single column)
- Reading column for prose: **64ch** on post page, **60ch** on homepage cards
- Wordmark is **centered over the reading column** (not the full page width). Header uses the same grid as body so the right 240px column is empty.

### Structure
- **Header** (every page): centered wordmark, terracotta 56×3 underline accent, nav (Home / About / Archives / RSS — RSS has small icon, lives in accent color)
- **Footer** (every page): warm-cream-2 background, double-rule top border, "Approved Thoughts · MMXXVI" seal on left, RSS / JSON / Sitemap links on right
- **Sidebar** (homepage + post page): three sections — **Recent**, **Elsewhere**, **Subscribe**. The Subscribe section has RSS feed and JSON feed both in black ink, with the RSS icon (terracotta) only next to the RSS link; JSON feed text aligns with the RSS feed text, not the icon column. **No "no newsletter" tagline.**
- About page: single column, no sidebar, no meta rail, **no subtitle**, no contact grid.
- 404 page: centered single column.

### Homepage post stream (`/index.html` and `/page/N.html`)
Each entry has:
- **Left rail (110px)**: date (terracotta, uppercase, tracked) + read time (muted). **NO post type label / chip / type column.** That was removed in iteration.
- **Main column**: title (Nunito Sans 700, ~30px), then either:
  - **Links posts**: rendered list with custom numbered styling (terracotta numerals in `01`, `02` decimal-leading-zero format)
  - **Other posts**: full content inline (since the homepage is a long scroll, all posts show in full — there's no "Continue reading" truncation by default; the design specifies full inline rendering)
- **Embeds inside posts**: tweets render via the official Twitter widget, YouTube via iframe (both already handled by `build.js`)
- **Entry footer**: tags chips (terracotta, hash-prefixed) on left + Copy Link button on right

### Post page (`/posts/.../<slug>.html`)
- Meta row at top: date (terracotta) · read time (muted) · type (ink-2) — uppercase tracked
- H1 title: Nunito Sans **700**, **36px**, **max-width 22ch**, line-height 1.15
- Prose: 64ch wide, line-height 1.65, body weight 300
- **Footnotes**: inline-numbered references with bottom-of-post numbered block (the `marked-footnote` plugin already produces this — no markup changes needed, only CSS styling, already in `pp-prose .footnotes`)
- Tags row at bottom
- Older / Newer pagination

### Archives page (`/archives.html`)
- H1
- Search bar — **rounded pill** (`border-radius: 999px`), magnifying-glass SVG icon (18×18, 2.25 stroke, terracotta) inside
- Stats bar — `display: flex; justify-content: space-between`, four stats: **Years · Posts · Categories · Tags** in that order. Each stat is a centered block: large terracotta number (20px, weight 700) above a small uppercase tracked label.
- "Common tags" section: pill-shaped tag chips with terracotta text, white-cream background, frequency expressed via size (`big`, `bigger`)
- "By year" section: collapsible `<details>` blocks, **most recent year `open` by default**. Each `<summary>` shows the year (Nunito Sans 700, 22px) and post count on the right. The `+` / `–` toggle indicator on the far right is terracotta. Inside each year: month subheadings (uppercase tracked, ink-2) followed by post lists (3-column grid: date · title · type).
- **Inline 30-line search script** filters list against `data-title` attribute. No external library.

### About page (`/about.html`)
- Just the wordmark header
- `<h1>About</h1>` (Nunito Sans 700, 36px)
- **No subtitle**, **no contact grid**
- Prose only, 64ch wide

### 404 page (`/404.html`)
- Centered single column
- Small "Approved Thoughts" mark in Atkinson Hyperlegible 700, terracotta, uppercase, tracked
- Large "404" in Atkinson Hyperlegible 700, 120px, ink, with 56×3 terracotta divider below
- Headline: "Approved thoughts, <em>unapproved</em> URL." — Nunito Sans 700, 28px, with "unapproved" in terracotta
- Sub: "The page you are looking for does not exist, or has been moved, or perhaps was never written. **Feel free to have unapproved thoughts at this time.**"
- Two action links: "← Back home" (accent) and "Browse archives" (muted)

### Embed handling (already implemented in build.js, do not change)
- Tweets: use Twitter's official widget via the existing `processTwitterLinks` helper (`<blockquote class="twitter-tweet">` + the platform script). Tweets are quoted by author with `![embed](https://x.com/.../status/ID)` syntax in Markdown.
- YouTube: 16:9 iframe via existing `processYouTubeLinks` helper.
- Inline images: existing `decorateImagesInHtml` adds modal lightbox via `js/main.js`.

### Tags
- Tag chips on posts link to `/tags/<tag>.html` archive pages (already implemented).
- No JS-driven filtering.

### What was explicitly cut
- "A weekly notebook by Apoorv Trivedi" header subtitle
- "No. 47 · Apoorv Trivedi, Editor" issue strap line
- Post-type chip/label in the homepage rail
- "In this post" sidebar section on post pages
- Sidenote (Tufte-style) footnote variant
- Contact grid on the About page
- "No newsletter, no algorithms. Just the feed." line under the sidebar Subscribe section

## Now read `GAPS.md`

That file lists the specific things still wrong in the current implementation, with exact patches. Apply those, rebuild, and the site will match the prototype.
