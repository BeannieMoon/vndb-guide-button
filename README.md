# VNDB Guide Button

A small userscript that adds a **Guide** row to [VNDB](https://vndb.org) visual novel pages,
linking straight to the matching walkthrough on [choro](https://choro-game.com/e/guide-o)
(an otome game 攻略 site).

- 278 VNDB entries mapped to 301 choro guides. Games with several guides
  (volumes, fandiscs, bundles) get one button per guide.
- Games without a mapped guide get a faint "search choro for this title" link instead.
- **Makes no network requests.** The mapping is baked into the script, and it only reads the
  page that's already loaded, so it adds no load on VNDB.
- Safe to run alongside Jiten Everywhere and other VNDB scripts. It adds a single row with
  its own id, doesn't touch `fetch`/XHR and leaves no globals.

## Install

With Tampermonkey or Violentmonkey installed, open:

**https://raw.githubusercontent.com/BeannieMoon/vndb-guide-button/main/vndb-guide-button.user.js**

## Updating the map

The map is a snapshot of choro's guide list from 2026-11-08.

1. `data/entries.json`: guide URL to title(s), scraped from choro's index pages
   (`/e/guide-o` and the per-row `/e/guide-a`, `-ka`, `-sa`, `-ta`, `-na`, `-ha`, `-ma` pages).
2. `python tools/match_vndb.py data` matches titles through the VNDB Kana API and writes
   `data/matched.json`. It is rate-limited to about 1 request every 1.6 s and caches results in
   `data/vndb_cache.json`.
3. `python tools/build.py` applies the manual `OVERRIDES` (bundles, fandiscs, fuzzy misses) and
   regenerates `vndb-guide-button.user.js` and `data/choro_map.json`.
