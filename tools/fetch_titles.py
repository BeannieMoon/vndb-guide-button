"""Fetch each choro guide page's <title> (1 request / 1.2 s, cached) into data/page_titles.json.

Index link text is sometimes ambiguous (e.g. both 9 R.I.P. and its sequel are listed as
"9 R.I.P."), so the page's own title is used as the primary name for matching.
Usage: python tools/fetch_titles.py
"""
import json, os, re, time, html, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
entries = json.load(open(os.path.join(ROOT, 'data', 'entries.json'), encoding='utf-8'))
out_path = os.path.join(ROOT, 'data', 'page_titles.json')
titles = json.load(open(out_path, encoding='utf-8')) if os.path.exists(out_path) else {}

for i, e in enumerate(entries):
    u = e['url']
    if u in titles:
        continue
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (vndb-guide-button)'})
        s = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')
        m = re.search(r'<title>(.*?)</title>', s, re.S)
        titles[u] = html.unescape(m.group(1)).strip() if m else ''
    except Exception as ex:
        print('fail', u, ex)
        titles[u] = ''
    json.dump(titles, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(i + 1, len(entries), titles[u].encode('ascii', 'replace').decode())
    time.sleep(1.2)
print('DONE')
