// ==UserScript==
// @name         VNDB Guide Button
// @namespace    vndb-guide-button
// @version      0.3
// @description  Adds a Guide row to VNDB pages: direct choro-game.com walkthrough links plus search links for other otome/BL guide sites
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

  // English title from the Titles list (for English-language guide sites).
  const enRow = [...document.querySelectorAll('.vndetails tr.title')]
    .find((r) => r.querySelector('abbr.icon-lang-en'));
  const en = ((enRow && enRow.querySelector('td:last-child span')) || h1).textContent.trim();

  // Fallback guide sites. `site` = Google site-search (JP sites get the original
  // title + 攻略, EN sites the English title); `url` = direct link (archived sites).
  // lang uses VNDB's own flag icons (icon-lang-xx).
  const SOURCES = [
    ['Otome & BL', [
      { name: 'Half Adder', lang: 'ja', site: 'half-a.net' },
      { name: 'Otome no Moto', lang: 'ja', site: 'otomenotomo.tyonmage.com' },
      { name: '空と風のうた', lang: 'ja', site: 'red.ribbon.to/~mayuki' },
    ]],
    ['Otome', [
      { name: 'choro', lang: 'ja', site: 'choro-game.com' },
      { name: 'Soregashi', lang: 'ja', site: 'soregashi.work' },
      { name: 'OtomeGame-Capture', lang: 'ja', site: 'otomegame-capture.com' },
      { name: 'maistar', lang: 'ja', site: 'maistar.blog.fc2.com' },
      { name: 'LadyGamer wiki', lang: 'ja', site: 'ladygamer.jp/wiki' },
      { name: 'pecheotome', lang: 'ja', site: 'pecheotome.web.fc2.com' },
      { name: 'miyutan (doujin)', lang: 'ja', site: 'miyutan0509.blog.fc2.com' },
      { name: 'Neoromance info', lang: 'ja', site: 'neoromance.info' },
      { name: '2DFan', lang: 'zh-Hans', site: '2dfan.com' },
      { name: 'Otome Kitten', lang: 'en', site: 'otomekitten.com' },
      { name: 'Peche', lang: 'ja', url: 'https://web.archive.org/web/20140717012233/http://peche.parallel.jp/index.htm' },
      { name: 'Momokan', lang: 'ja', url: 'https://web.archive.org/web/20251008120316/http://momokan.chu.jp/momokan/a1top.html' },
      { name: 'La Primavera', lang: 'ja', url: 'https://web.archive.org/web/20200223033612/otome.girly.jp/' },
    ]],
    ['BL', [
      { name: 'BL English', lang: 'en', site: 'blenglish.blog.fc2.com' },
      { name: 'Chem blog', lang: 'en', site: 'chem-is-amani.blogspot.com' },
      { name: 'mizukinoko', lang: 'ja', site: 'plaza.rakuten.co.jp/mizukinoko' },
      { name: 'BL game hatena', lang: 'ja', site: 'blgame.hatenablog.com' },
      { name: 'Boys Game 攻略の館', lang: 'ja', site: 'kouryakukan.fuma-kotaro.com' },
      { name: 'Garden House', lang: 'ja', url: 'https://web.archive.org/web/20190303093657/http://www.geocities.jp/aya_promenade/gamekouryaku.htm' },
    ]],
  ];
  const LANG_NAME = { ja: 'Japanese', en: 'English', 'zh-Hans': 'Chinese (simplified)' };

  const google = (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q);
  const srcHref = (s) => s.url ||
    google('site:' + s.site + ' "' + (s.lang === 'en' ? en : orig) + '"' + (s.lang === 'en' ? ' walkthrough' : ' 攻略'));

  const link = (text, href, style) => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    if (style) a.style.cssText = style;
    return a;
  };
  const BTN = 'padding:2px 9px;border:1px solid currentColor;border-radius:4px;font-size:12px;text-decoration:none';
  const flag = (lang) => {
    const ab = document.createElement('abbr');
    ab.className = 'icon-lang-' + lang;
    ab.title = LANG_NAME[lang] || lang;
    return ab;
  };

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center';

  const guides = CHORO[vid];
  if (guides) {
    for (const [label, path] of guides) {
      const a = link('📖 ' + (guides.length > 1 ? label : 'choro guide'), 'https://choro-game.com/' + path, BTN);
      a.prepend(flag('ja'));
      bar.appendChild(a);
    }
  }

  // Collapsible list of other sites (same look as VNDB's own Titles <details>).
  const more = document.createElement('details');
  const sum = document.createElement('summary');
  sum.textContent = guides ? 'more guide sites' : 'search guide sites';
  sum.style.cssText = 'cursor:pointer;font-size:12px;opacity:.75';
  more.appendChild(sum);
  const box = document.createElement('div');
  box.style.cssText = 'font-size:12px;line-height:1.7;margin-top:3px';
  for (const [group, list] of SOURCES) {
    const line = document.createElement('div');
    const g = document.createElement('span');
    g.textContent = group + ': ';
    g.style.cssText = 'color:inherit;opacity:.7;font-weight:bold';
    line.appendChild(g);
    list.forEach((s, i) => {
      if (i) line.append(' · ');
      line.append(flag(s.lang));
      line.appendChild(link(s.name + (s.url ? ' (archive)' : ''), srcHref(s)));
    });
    box.appendChild(line);
  }
  const gl = document.createElement('div');
  gl.append(flag('ja'));
  gl.appendChild(link('Google: "' + orig + '" 攻略', google('"' + orig + '" 攻略')));
  box.appendChild(gl);
  more.appendChild(box);

  const wrap = document.createElement('div');
  wrap.append(bar, more);
  if (!guides) bar.remove();

  const table = document.querySelector('.vndetails > table > tbody') ||
                document.querySelector('.vndetails table tbody');
  if (table) {
    const tr = document.createElement('tr');
    tr.id = ROW_ID;
    const k = document.createElement('td');
    k.textContent = 'Guide';
    const v = document.createElement('td');
    v.appendChild(wrap);
    tr.append(k, v);
    // Place under "Relations"; else before "Links"; else after the title rows.
    const rows = [...table.children];
    const label = (r) => (r.firstElementChild && r.firstElementChild.textContent.trim()) || '';
    const rel = rows.find((r) => label(r) === 'Relations');
    const links = rows.find((r) => label(r) === 'Links' || label(r) === 'Shops');
    const titles = table.querySelector(':scope > tr > td.titles');
    if (rel) rel.after(tr);
    else if (links) links.before(tr);
    else if (titles) titles.parentElement.after(tr);
    else table.append(tr);
  } else {
    wrap.id = ROW_ID;
    wrap.style.margin = '6px 0 10px';
    (altEl || h1).after(wrap);
  }
})();
