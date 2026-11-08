// ==UserScript==
// @name         VNDB Guide Button
// @namespace    vndb-guide-button
// @version      0.2
// @description  Adds a Guide row with direct choro-game.com walkthrough links to VNDB visual novel pages
// @match        https://vndb.org/v*
// @grant        none
// @noframes
// @homepageURL  https://github.com/BeannieMoon/vndb-guide-button
// @updateURL    https://raw.githubusercontent.com/BeannieMoon/vndb-guide-button/main/vndb-guide-button.user.js
// @downloadURL  https://raw.githubusercontent.com/BeannieMoon/vndb-guide-button/main/vndb-guide-button.user.js
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  // VNDB id -> [[label, choro guide url], ...]
  // Generated once from https://choro-game.com/e/guide-o (__COUNT__ guides, __DATE__).
  // Paths are relative to https://choro-game.com/ to keep the file small.
  const CHORO = __MAP__;

  // Only on the VN's main page (/v123), not /v123/edit, /v123/hist etc.
  const m = location.pathname.match(/^\/(v\d+)\/?$/);
  if (!m) return;
  const vid = m[1];

  // Plays nice with Jiten Everywhere / other VNDB scripts: own id, no globals,
  // no fetch/XHR patching, no requests at all — only adds one row.
  const ROW_ID = 'vgb-guide-row';
  if (document.getElementById(ROW_ID)) return;

  const h1 = document.querySelector('article h1') || document.querySelector('h1');
  if (!h1) return;
  const altEl = document.querySelector('article h2.alttitle');
  const orig = ((altEl && altEl.textContent) || h1.textContent).trim();

  const link = (text, href, faint) => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    a.style.cssText = faint
      ? 'font-size:11px;opacity:.6'
      : 'padding:2px 9px;border:1px solid currentColor;border-radius:4px;font-size:12px;text-decoration:none';
    return a;
  };

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center';

  const guides = CHORO[vid];
  if (guides) {
    for (const [label, path] of guides) {
      bar.appendChild(link('📖 ' + (guides.length > 1 ? label : 'choro guide'), 'https://choro-game.com/' + path));
    }
  } else {
    bar.appendChild(link('search choro for this title',
      'https://www.google.com/search?q=' + encodeURIComponent('site:choro-game.com ' + orig + ' 攻略'), true));
  }

  const table = document.querySelector('.vndetails > table > tbody') ||
                document.querySelector('.vndetails table tbody');
  if (table) {
    const tr = document.createElement('tr');
    tr.id = ROW_ID;
    const k = document.createElement('td');
    k.textContent = 'Guide';
    const v = document.createElement('td');
    v.appendChild(bar);
    tr.append(k, v);
    const titles = table.querySelector(':scope > tr > td.titles');
    if (titles) titles.parentElement.after(tr); else table.prepend(tr);
  } else {
    bar.id = ROW_ID;
    bar.style.margin = '6px 0 10px';
    (altEl || h1).after(bar);
  }
})();
