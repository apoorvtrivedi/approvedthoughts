# GAPS — what's missing in the current implementation

The site has been substantially ported. These 8 specific gaps remain. Apply each patch, rebuild, and the site will match the locked prototypes.

Read each gap's "Why" before applying so you understand the design intent.

---

## Gap 1 — Remove the post-type label from the homepage rail

**File:** `build.js`, function `generatePostCard()`
**Why:** The post-type label ("Links", "Post", "Notes", "Thought Piece") was iterated out of the design. The left rail should show only **date** + **read time**. Users identify post type from the title and context. Keeping the label clutters the rail.

**Find:**
```js
    const rail = `
        <div class="hy-rail">
            <span class="date">${post.dateFormatted}</span>
            ${readRow}
            <span class="type">${label}</span>
        </div>`;
```

**Replace with:**
```js
    const rail = `
        <div class="hy-rail">
            <span class="date">${post.dateFormatted}</span>
            ${readRow}
        </div>`;
```

You can also delete the now-unused `const label = typeLabel(post.type);` line at the top of `generatePostCard()`.

**Visual confirmation:** `reference/Hybrid Prototype.html` — open in a browser and inspect any `.hy-rail`. It contains exactly `<span class="date">` and `<span class="read">`, nothing else.

---

## Gap 2 — Remove the `.hy-rail .type` CSS rule

**File:** `css/style.css`
**Why:** Cleanup. Once Gap 1 is applied the selector matches nothing, but leaving stale rules confuses future readers.

**Find:**
```css
.hy-rail .type { display: block; margin-top: 4px; color: var(--ink-2); font-size: 10px; }
```

**Delete it.**

---

## Gap 3 — Replace sidebar Search with Subscribe section

**File:** `build.js`, function `generateSidebar()`
**Why:** The final sidebar has three sections — **Recent**, **Elsewhere**, **Subscribe**. The Search box was cut because the Archives page already has a prominent in-page search, and a third search input on every other page was clutter. The Subscribe section surfaces RSS + JSON feeds with one icon (terracotta, next to RSS only) and both labels in **black ink** (consistent with the rest of the sidebar's link colors). JSON feed text indents to align with "RSS feed" text, not the icon column.

**Find** (the `<section>` block starting with `<h3>Search</h3>`):
```js
                <section>
                    <h3>Search</h3>
                    <form class="at-search-box" action="${rootPath}archives.html" method="get" role="search">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>
                        <input type="search" name="q" placeholder="Search posts…" aria-label="Search posts">
                    </form>
                </section>
```

**Replace with:**
```js
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
```

The empty `<span></span>` on the JSON feed row is intentional — it occupies the 14px icon column so the JSON text aligns horizontally with "RSS feed" text above it. The CSS class `.at-subscribe-link` already exists in `css/style.css` (it uses `display: grid; grid-template-columns: 14px 1fr`).

**Note:** `RSS_SVG` is already defined at the top of `build.js`. Do not redefine it.

**Visual confirmation:** `reference/Phase 3 - Templates.html` — the post page sidebar shows Recent → Elsewhere → Subscribe with this exact layout.

---

## Gap 4 — Wordmark font weight: 500 → 700

**File:** `css/style.css`
**Why:** Atkinson Hyperlegible at weight 700 is what was selected and approved. At 500 it loses presence; the "Approved Thoughts" wordmark needs to read confidently from across the page. The italic emphasis (`em` for "Thoughts") should also be 700 — it's the same weight, just colored terracotta — not bumped up further.

**Find:**
```css
.at-name {
  font-family: var(--f-mark);
  font-size: 44px; font-weight: 500;
  letter-spacing: -0.015em; line-height: 1;
  color: var(--ink);
}
.at-name em {
  color: var(--accent);
  font-style: normal; font-weight: 600;
}
```

**Replace with:**
```css
.at-name {
  font-family: var(--f-mark);
  font-size: 44px; font-weight: 700;
  letter-spacing: -0.005em; line-height: 1;
  color: var(--ink);
}
.at-name em {
  color: var(--accent);
  font-style: normal; font-weight: 700;
}
```

Note also the letter-spacing change: -0.015em → -0.005em. Atkinson Hyperlegible at 700 has tighter native spacing and -0.015em over-tightens it; -0.005em is the corrected value.

---

## Gap 5 — Homepage title weight: 500 → 700

**File:** `css/style.css`
**Why:** Post titles need to anchor each entry visually. At 500 they're too close in weight to the body text (300) and the eye doesn't scan them as titles. At 700 there's a clear hierarchy: title (700) → body (300).

**Find:**
```css
.hy-title {
  font-family: var(--f-body);
  font-size: 30px; font-weight: 500;
  letter-spacing: -0.015em; line-height: 1.2;
  margin: 0 0 12px;
  color: var(--ink);
}
```

**Replace with:**
```css
.hy-title {
  font-family: var(--f-body);
  font-size: 30px; font-weight: 700;
  letter-spacing: -0.015em; line-height: 1.2;
  margin: 0 0 12px;
  color: var(--ink);
}
```

(only font-weight changes)

---

## Gap 6 — Post page title: bigger and narrower

**File:** `css/style.css`
**Why:** A single-post page title is the primary thing on the page — bigger is right. The narrower `max-width: 22ch` forces titles to wrap into 1–2 lines instead of stretching to fill the column, which preserves visual weight regardless of title length. Compare these two on the prototype:
- Phase 3 reference: `.pp-title { font-size: 36px; max-width: 22ch; }` — feels declarative, anchored.
- Current implementation: 30px / 32ch — looks like a regular heading lost in the page.

**Find:**
```css
.pp-title {
  font-family: var(--f-body); font-weight: 700;
  font-size: 30px; line-height: 1.15; letter-spacing: -0.015em;
  margin: 0 0 32px; max-width: 32ch; color: var(--ink);
}
```

**Replace with:**
```css
.pp-title {
  font-family: var(--f-body); font-weight: 700;
  font-size: 36px; line-height: 1.15; letter-spacing: -0.015em;
  margin: 0 0 32px; max-width: 22ch; color: var(--ink);
}
```

---

## Gap 7 — Center the archive stat numbers above their labels

**File:** `css/style.css`
**Why:** The four stats (Years · Posts · Categories · Tags) sit in a `justify-content: space-between` row. Each stat is supposed to be a centered block: a large terracotta number stacked above a small uppercase label, both center-aligned. Currently the number and label are left-aligned within their cell, so the number sits at the left edge of each cell — `4` floats over the leftmost letter of "Categories" instead of its center.

**Find:**
```css
.ar-stats {
  display: flex; gap: 28px; padding: 14px 0;
  justify-content: space-between;
  border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  margin-bottom: 36px;
}
.ar-stats .stat .n {
  font-family: var(--f-body); font-weight: 700; font-size: 20px;
  color: var(--accent); display: block; line-height: 1;
}
.ar-stats .stat .l {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3); margin-top: 4px; display: block;
}
```

**Replace with:**
```css
.ar-stats {
  display: flex; gap: 28px; padding: 14px 0;
  justify-content: space-between;
  border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  margin-bottom: 36px;
}
.ar-stats .stat {
  text-align: center;
  flex: 1;
}
.ar-stats .stat .n {
  font-family: var(--f-body); font-weight: 700; font-size: 20px;
  color: var(--accent); display: block; line-height: 1;
  text-align: center;
}
.ar-stats .stat .l {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3); margin-top: 6px; display: block;
  text-align: center;
}
```

(adds `.ar-stats .stat` rule + adds `text-align: center;` to both `.n` and `.l`, bumps `.l` margin from 4 to 6px)

---

## Gap 8 — Hover behavior: terracotta tags should not also turn ink on hover

**File:** `css/style.css`
**Why:** Cleanup. `.hy-tags a:hover { color: var(--accent); text-decoration: underline; }` is currently in the file. Tags are already terracotta. The hover should add an **underline** to signal interactivity without changing color (changing color when the link is already accent-colored is a no-op visually except in dark mode, which we don't ship).

**Find:**
```css
.hy-tags a {
  color: var(--accent);
  font-weight: 400;
}
.hy-tags a:hover { color: var(--accent); text-decoration: underline; }
```

**Replace with:**
```css
.hy-tags a {
  color: var(--accent);
  font-weight: 500;
}
.hy-tags a:hover {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--accent) 50%, transparent);
  text-underline-offset: 3px;
}
```

(weight 400 → 500 for slightly more presence, and the hover uses a soft underline color + offset rather than a hard black underline)

The same treatment should be applied to `.pp-tags a:hover` and `.hy-permalink:hover` for consistency:

**Find:**
```css
.pp-tags a { color: var(--accent); font-weight: 600; }
.pp-tags a:hover { text-decoration: underline; }
```

**Replace with:**
```css
.pp-tags a { color: var(--accent); font-weight: 600; }
.pp-tags a:hover {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--accent) 50%, transparent);
  text-underline-offset: 3px;
}
```

---

## After applying all gaps

Run `node build.js` and:

1. Open `index.html` in a browser. The homepage rail should show only **date** and **read time** — no type label. The wordmark "Approved Thoughts" should feel substantial (700 weight). Post titles should feel anchored (700 weight).

2. Open any post page (e.g. `posts/2026/feeling-the-agi.html`). The H1 should be noticeably larger and narrower than before. Sidebar should show **Recent**, **Elsewhere**, **Subscribe** (no Search box). The Subscribe section should have RSS (with terracotta icon) and JSON (indented, same alignment) both in black text.

3. Open `archives.html`. The four stats (**Years · Posts · Categories · Tags**) should be horizontally distributed across the page width, each with its terracotta number centered directly above its label. Search bar is a rounded pill with a properly-sized magnifying glass icon.

4. Open `about.html`. Single column, no sidebar, no subtitle. Just the H1 and prose.

5. Open `404.html`. Quiet, witty, centered.

6. Hover any tag chip. It should get a soft underlined treatment with no color flicker.

Any other tweaks beyond these are out of scope for this handoff — bring them up in a follow-up.

## Reference files

When in doubt about visual intent, open the two reference files in a browser and compare to the rendered site:

- `reference/Phase 3 - Templates.html` — post page, archives, about, 404
- `reference/Hybrid Prototype.html` — homepage (ignore the floating Tweaks panel — that's a design tool, not part of the site)
