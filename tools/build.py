"""Build vndb-guide-button.user.js from data/matched.json + manual overrides.

Usage (from repo root):  python tools/build.py
"""
import json, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
matched = json.load(open(os.path.join(ROOT, 'data', 'matched.json'), encoding='utf-8'))

# Guide URL tail -> VNDB ids. Fixes for bundles, multi-VN releases and fuzzy misses.
# [] means "no VNDB entry, leave out".
OVERRIDES = {
    'blog-entry-1064.html': [],                                  # I DOLL U - not found on VNDB
    'blog-entry-2980.html': ['v8591', 'v11186'],                 # AMNESIA LATER x CROWD
    'blog-entry-2306.html': ['v5471', 'v5472'],                  # UtaPri Amazing Aria & Sweet Serenade
    'blog-entry-816.html': ['v15231'],                           # 男遊郭 (alias of 逆転 吉原)
    'kamiaso-guide': ['v10273'], 'blog-entry-1512.html': ['v10273'],
    'kenka-otome-guide': ['v17750', 'v20226'],
    'otomefd-guide': ['v12438', 'v21792'],
    'virche-guide': ['v29661'],
    'starrysky-spring-guide': ['v2021', 'v5258'], 'blog-entry-2695.html': ['v2022', 'v5854'],
    'starrysky-autumn-guide': ['v2023', 'v7540'], 'blog-entry-2882.html': ['v2024', 'v7553'],
    'blog-entry-984.html': ['v13905'], 'blog-entry-3059.html': ['v13905'],
    'blog-entry-2865.html': ['v16032', 'v20277'],
    'blog-entry-2083.html': ['v7203', 'v7204', 'v7675'],        # Yamanote BOYS for V MAIN DISC
    'blog-entry-2203.html': ['v11312', 'v11313', 'v11314'],     # Yamanote BOYS for V FAN DISC
    'dousei-lip-guide': ['v11483'], 'dousei-gloss-guide': ['v20134'],
    'himehibi-guide': ['v1640'],
    'blog-entry-2961.html': ['v21788'],
    'geten-guide': ['v12865', 'v11639'],
    'nin-koi-setsu-guide': ['v12751'],
    'tlicolity-guide': ['v22597'], 'blog-entry-2571.html': ['v22597'],
    'blog-entry-2602.html': ['v22597'], 'tlicolity3-guide': ['v22597'],
    'hakuoki_yugiroku-guide': ['v17291', 'v19756'],
    'hiiro-guide': ['v1629'],
    'blog-entry-701.html': ['v14908'],                           # Code:Realize 彩虹の花束 (page title is generic)
}
LABELS = {'e/izakoi-kai-guide': 'いざ、出陣！恋戦 第二幕 ～甲斐編～'}

M = {}
for e in matched:
    tail = e['url'].rsplit('/', 1)[-1]
    vids = OVERRIDES.get(tail)
    if vids is None:
        vids = [e['match'][0][1]] if e['match'] else []
    path = e['url'].replace('https://choro-game.com/', '')
    label = LABELS.get(path) or re.sub(r'\s*for Nintendo Switch$', '',
                                       e.get('page_title') or min(e['titles'], key=len))
    for v in vids:
        lst = M.setdefault(v, [])
        if path not in [p for _, p in lst]:
            lst.append([label, path])

for lst in M.values():  # number duplicate labels
    seen = {}
    for it in lst:
        seen[it[0]] = seen.get(it[0], 0) + 1
        if seen[it[0]] > 1:
            it[0] += f' ({seen[it[0]]})'

js = json.dumps(dict(sorted(M.items(), key=lambda x: int(x[0][1:]))),
                ensure_ascii=False, separators=(',', ':')).replace('],"v', '],\n    "v')
tpl = open(os.path.join(ROOT, 'tools', 'template.user.js'), encoding='utf-8').read()
out = (tpl.replace('__MAP__', js).replace('__COUNT__', str(len(matched)))
          .replace('__DATE__', datetime.date.today().isoformat()))
open(os.path.join(ROOT, 'vndb-guide-button.user.js'), 'w', encoding='utf-8', newline='\n').write(out)
json.dump(M, open(os.path.join(ROOT, 'data', 'choro_map.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{len(M)} VNs, {sum(map(len, M.values()))} links')
