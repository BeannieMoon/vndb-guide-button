"""Match choro guide titles to VNDB ids via the Kana API (rate-limited, cached)."""
import json, re, sys, time, unicodedata, urllib.request, os
from difflib import SequenceMatcher

sys.stdout.reconfigure(encoding='utf-8')
D = sys.argv[1]
entries = json.load(open(os.path.join(D, 'entries.json'), encoding='utf-8'))
cache_path = os.path.join(D, 'vndb_cache.json')
cache = json.load(open(cache_path, encoding='utf-8')) if os.path.exists(cache_path) else {}

SUFFIX = re.compile(r'(\s*(for\s*nintendo\s*switch|for\s*switch|for\s*v|ポータブル|portable|愛蔵版|ps\s*vita版?|\(.*?\)|（.*?）))+$', re.I)

def norm(s):
    s = unicodedata.normalize('NFKC', s).lower()
    return re.sub(r'[\s\W_～〜ー\-・:：!！?？♪☆★]+', '', s)

def search(q):
    if q in cache:
        return cache[q]
    body = json.dumps({"filters": ["search", "=", q],
                       "fields": "title,alttitle,titles.title,olang",
                       "results": 10}).encode()
    req = urllib.request.Request('https://api.vndb.org/kana/vn', body,
                                 {'Content-Type': 'application/json', 'User-Agent': 'vndb-guide-button/0.1'})
    for attempt in range(3):
        try:
            res = json.load(urllib.request.urlopen(req, timeout=30))['results']
            break
        except Exception as e:
            print('retry', q, e); time.sleep(10)
    else:
        res = []
    cache[q] = res
    json.dump(cache, open(cache_path, 'w', encoding='utf-8'), ensure_ascii=False)
    time.sleep(1.6)
    return res

def best(title):
    queries = [title]
    stripped = SUFFIX.sub('', title).strip()
    if stripped and stripped != title:
        queries.append(stripped)
    # also try the part before a subtitle separator
    head = re.split(r'\s*[～〜\-―]\s*', stripped)[0].strip()
    if head and head not in queries and len(head) >= 3:
        queries.append(head)
    cands = {}
    for q in queries:
        for v in search(q):
            cands[v['id']] = v
        if cands and any(norm(q) == norm(t['title']) for v in cands.values() for t in v['titles']):
            break
    scored = []
    for v in cands.values():
        names = [v['title'], v.get('alttitle') or ''] + [t['title'] for t in v['titles']]
        s = max(max(SequenceMatcher(None, norm(t), norm(n)).ratio() for n in names if n)
                for t in {title, stripped})
        scored.append((s, v['id'], v.get('alttitle') or v['title']))
    scored.sort(reverse=True)
    return scored[:3]

pt_path = os.path.join(D, 'page_titles.json')
page_titles = json.load(open(pt_path, encoding='utf-8')) if os.path.exists(pt_path) else {}

def page_name(t):
    # "9 R.I.P. sequel 攻略 ナインリップ シークエル | choro" -> "9 R.I.P. sequel"
    t = re.sub(r'\s*\|\s*choro\s*$', '', t)
    return re.split(r'\s*(?:全ルート)?\s*攻略', t)[0].strip()

out = []
for i, e in enumerate(entries):
    top = None
    pn = page_name(page_titles.get(e['url'], ''))
    if pn:
        e = {**e, 'page_title': pn}
    # the page's own title wins; index link texts are only a fallback
    for t in ([pn] if pn else []) or e['titles']:
        r = best(t)
        if r and (top is None or r[0][0] > top[0][0]):
            top = r
    if (not top or top[0][0] < 0.6) and pn:
        for t in e['titles']:
            r = best(t)
            if r and (top is None or r[0][0] > top[0][0]):
                top = r
    out.append({**e, 'match': top or []})
    m = top[0] if top else None
    print(f"{i+1}/{len(entries)} {e['titles'][0]} -> {m}")

json.dump(out, open(os.path.join(D, 'matched.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('DONE')
