#!/usr/bin/env python3
"""exercises.md -> exercises/index.html (single file, React from CDN, data embedded).

Usage (from the repo root):  python3 tools/build.py
Needs node (npx esbuild is fetched on first use).
"""
import json, pathlib, re, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TIERS = {'חימום': 'warm', 'שיפוט': 'judge', 'אתגר': 'stretch'}


def parse(md):
    lessons, cur, sec, item = [], None, None, None
    in_fence = False

    def flush():
        nonlocal item
        if item:
            while item['lines'] and not item['lines'][-1].strip():
                item['lines'].pop()
            sec['items'].append(item)
            item = None

    for raw in md.split('\n'):
        line = raw.rstrip()
        if in_fence:                       # code / mermaid / svg blocks pass through verbatim
            item['lines'].append(line)
            if line.strip().startswith('```'):
                in_fence = False
            continue
        m = re.match(r'^## שיעור (\d+) — (.+)$', line)
        if m:
            flush()
            cur = {'num': int(m.group(1)), 'title': m.group(2).strip(), 'intro': [], 'sections': []}
            lessons.append(cur); sec = None
            continue
        if cur is None:
            continue
        m = re.match(r'^### (חימום|שיפוט|אתגר)$', line)
        if m:
            flush(); sec = {'tier': TIERS[m.group(1)], 'items': []}; cur['sections'].append(sec)
            continue
        m = re.match(r'^### מצגת(?:\s+—\s+(.+))?$', line)
        if m:
            flush(); sec = {'tier': 'deck', 'title': (m.group(1) or '').strip(), 'items': []}
            cur['sections'].append(sec)
            continue
        if sec is not None and sec['tier'] == 'deck':
            m = re.match(r'^#### ?(.*)$', line)
            if m:
                flush(); item = {'id': '', 'title': m.group(1).strip(), 'lines': []}
                continue
            if item is not None:
                if line.strip().startswith('```'):
                    in_fence = True
                item['lines'].append(line)
            continue
        m = re.match(r'^\*\*(\d+\.\d+)\*?\*?\s*(.*)$', line)
        if m:
            flush()
            if sec is None:
                sec = {'tier': 'judge', 'items': []}; cur['sections'].append(sec)
            rest, title = m.group(2), ''
            mt = re.match(r'^(.*?)\*\*\s*(.*)$', rest)
            if mt:
                title, rest = mt.group(1).strip().rstrip('.'), mt.group(2)
            item = {'id': m.group(1), 'title': title, 'lines': []}
            if rest.strip():
                item['lines'].append(rest.strip())
            continue
        if line.strip() == '---':
            continue
        if item is not None:
            item['lines'].append(line)
        elif sec is None:
            cur['intro'].append(line)
    flush()
    for L in lessons:
        L['intro'] = [l for l in L['intro'] if not l.startswith('*סטטוס')]
        while L['intro'] and not L['intro'][-1].strip(): L['intro'].pop()
        while L['intro'] and not L['intro'][0].strip(): L['intro'].pop(0)
    return lessons


def main():
    lessons = parse((ROOT / 'exercises.md').read_text(encoding='utf8'))
    src = (ROOT / 'tools' / 'app.jsx').read_text(encoding='utf8')
    src = src.replace('__DATA__', json.dumps(lessons, ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        jsx, js = pathlib.Path(td) / 'app.jsx', pathlib.Path(td) / 'app.js'
        jsx.write_text(src, encoding='utf8')
        subprocess.run(['npx', '--yes', 'esbuild', str(jsx), '--loader:.jsx=jsx', '--jsx=transform',
                        '--minify', f'--outfile={js}', '--log-level=warning'], check=True)
        code = js.read_text(encoding='utf8')
    html = f'''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>סימולציה — תרגילי כיתה</title>
<style>html,body{{margin:0;background:#182233}}</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head><body><div id="root"></div>
<script>
{code}
</script></body></html>'''
    out = ROOT / 'exercises' / 'index.html'
    out.write_text(html, encoding='utf8')
    nq = sum(len(s['items']) for L in lessons for s in L['sections'] if s['tier'] != 'deck')
    ns = sum(len(s['items']) for L in lessons for s in L['sections'] if s['tier'] == 'deck')
    print(f'wrote {out.relative_to(ROOT)}: {len(html)} bytes, {nq} questions, {ns} slides')


if __name__ == '__main__':
    main()
