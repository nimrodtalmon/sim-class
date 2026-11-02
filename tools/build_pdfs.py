#!/usr/bin/env python3
"""exercises.md -> pdfs/lesson-N.pdf (class exercises only, no decks, room to write).

Usage (from the repo root):  python3 tools/build_pdfs.py
Needs Python playwright with Chromium. Run tools/build_site.py afterwards (pdfs.html lists the files).
"""
import html, os, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from build import parse  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'pdfs'
E = html.escape
TIER = {'warm': ('חימום', '#C98A12'), 'judge': ('שיפוט', '#C9432D'), 'stretch': ('אתגר', '#3E8C96')}
HEB_PART = re.compile(r'^([א-ת])\.\s+(.*)$')

CSS = """@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;800&display=swap');
@page{size:A4;margin:18mm 17mm 18mm 17mm}
*{box-sizing:border-box}
body{margin:0;font-family:Heebo,Arial,sans-serif;font-weight:300;font-size:11.5pt;line-height:1.55;color:#1d2433}
strong,b{font-weight:600}
.lesson{break-before:page}
.lesson:first-child{break-before:auto}
.head{border-bottom:2px solid #1d2433;padding-bottom:3mm;margin-bottom:6mm}
.head .c{font-size:9.5pt;color:#6b7385}
.head h1{margin:1mm 0 0;font-size:20pt;font-weight:800;line-height:1.15}
.tier{margin:7mm 0 3mm;font-size:12.5pt;font-weight:800;display:flex;align-items:center;gap:3mm}
.tier i{display:inline-block;width:4mm;height:4mm;border-radius:1mm}
.q,.keep{margin:0 0 4mm;break-inside:avoid-page}
.keep .q{margin:0}
.q .id{font-weight:800;direction:ltr;unicode-bidi:isolate}
.q p{margin:0 0 1.2mm}
.q ul{margin:0 0 1.2mm;padding-inline-start:6mm}
.q .part{display:flex;gap:2mm;margin:0 0 1.2mm;padding-inline-start:4mm}
.q .part b{min-width:4mm}
.imgs{display:flex;gap:5mm;justify-content:center;align-items:flex-end;margin:2mm 0}
.imgs img{max-height:55mm;max-width:100%;object-fit:contain}
.imgs.n3 img{max-height:48mm;max-width:31%}
.intro{margin:0 0 4mm}
.intro p{margin:0 0 1.2mm}
.intro ul{margin:0 0 1.2mm;padding-inline-start:6mm}
.ltr{direction:ltr;unicode-bidi:isolate}
code{font-family:"DejaVu Sans Mono",monospace;font-size:.9em;direction:ltr;unicode-bidi:isolate}
"""


HEB = re.compile(r'[\u0590-\u05FF]')


def ltr_runs(text):
    """Wrap Latin/math runs inside Hebrew text in LTR isolates, so '0 < x < 1' keeps its order."""
    out = []
    for seg in re.split(r'([\u0590-\u05FF][\u0590-\u05FF\'"״׳]*)', text):
        if not seg or HEB.search(seg) or not re.search(r'[A-Za-z0-9\u0370-\u03FF=<>≤≥~²³ⁿ]', seg):
            out.append(E(seg)); continue
        m = re.match(r'^([\s\-.,:;?!)\]]*)(.*?)([\s.,:;?!(\[]*)$', seg, re.S)
        a, mid, b = m.groups()
        while mid.endswith(')') and mid.count(')') > mid.count('('):      # unbalanced bracket belongs to the Hebrew
            mid, b = mid[:-1].rstrip(), mid[len(mid[:-1].rstrip()):] + b
        while mid.startswith('(') and mid.count('(') > mid.count(')'):
            a, mid = a + mid[:len(mid) - len(mid[1:].lstrip())], mid[1:].lstrip()
        out.append(f'{E(a)}<span class="ltr">{E(mid)}</span>{E(b)}' if mid else E(seg))
    return ''.join(out)


def bidi(html_s):
    return ''.join(t if t.startswith('<') else ltr_runs(html.unescape(t)) for t in re.split(r'(<[^>]+>)', html_s))


def inline(s):
    return bidi(_inline(s))


def _inline(s):
    s = E(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
    s = re.sub(r'\$([^$]+)\$', r'\1', s)
    s = re.sub(r'\^\{([^}]*)\}', r'<sup>\1</sup>', s)
    s = re.sub(r'_\{([^}]*)\}', r'<sub>\1</sub>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    return s


def block(lines):
    """Render question/intro lines: paragraphs, bullets, Hebrew-letter sub-parts, image rows."""
    out, ul = [], []

    def flush_ul():
        if ul:
            out.append('<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in ul) + '</ul>'); ul.clear()

    for raw in lines:
        t = raw.strip()
        if not t:
            flush_ul(); continue
        imgs = re.findall(r'!\[[^\]]*\]\(([^)]+)\)', t)
        if imgs and not re.sub(r'!\[[^\]]*\]\([^)]+\)', '', t).strip():
            flush_ul()
            srcs = ''.join(f'<img src="{(ROOT / "exercises" / p).as_uri()}">' for p in imgs)
            out.append(f'<div class="imgs n{len(imgs)}">{srcs}</div>'); continue
        if t.startswith('- '):
            ul.append(t[2:]); continue
        flush_ul()
        m = HEB_PART.match(t)
        if m:
            out.append(f'<div class="part"><b>{m.group(1)}.</b><span>{inline(m.group(2))}</span></div>')
        elif t.startswith('>'):
            out.append(f'<p>{inline(t.lstrip("> ").strip())}</p>')
        else:
            out.append(f'<p>{inline(t)}</p>')
    flush_ul()
    return ''.join(out)


def lesson_html(L, course):
    parts = [f'<section class="lesson"><div class="head"><div class="c">{E(course)} · תרגילי כיתה</div>'
             f'<h1>שיעור {L["num"]} — {E(L["title"])}</h1></div>']
    if L['story']:
        parts.append(f'<div class="intro">{block(L["intro"])}</div>')
    for s in L['sections']:
        if s['tier'] == 'deck' or not s['items']:
            continue
        name, c = TIER[s['tier']]
        head = f'<div class="tier"><i style="background:{c}"></i>{name}</div>'
        for k, it in enumerate(s['items']):
            t = it['title']
            title = (' ' + inline(t) + ('' if t[-1:] in '?!.:' else '.')) if t else ''
            body = it['lines']
            first = ''
            if title:
                first = f'<p><span class="id">{it["id"]}</span><strong>{title}</strong></p>'
            elif body and not body[0].strip().startswith(('א.', '- ', '![')):
                first = f'<p><span class="id">{it["id"]}</span> {inline(body[0].strip())}</p>'; body = body[1:]
            else:
                first = f'<p><span class="id">{it["id"]}</span></p>'
            nparts = sum(1 for x in body if HEB_PART.match(x.strip()))
            space = min(40 + 12 * nparts, 90)                       # mm of empty room to write in
            q = f'<div class="q">{first}{block(body)}<div style="height:{space}mm"></div></div>'
            parts.append(f'<div class="keep">{head}{q}</div>' if k == 0 else q)   # tier title never alone at page end
    parts.append('</section>')
    return ''.join(parts)


def doc(lessons, course, title):
    return (f'<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>{E(title)}</title>'
            f'<style>{CSS}</style></head><body>{"".join(lesson_html(L, course) for L in lessons)}</body></html>')


def main():
    from playwright.sync_api import sync_playwright
    course = 'סימולציה'
    lessons = parse((ROOT / 'exercises.md').read_text(encoding='utf8'))
    keep = []
    for L in lessons:
        has_q = any(s['tier'] != 'deck' and s['items'] for s in L['sections'])
        L['story'] = bool(L['intro']) and L['intro'][0].startswith('**')   # e.g. the café story in lesson 7
        if has_q or L['story']:
            keep.append(L)
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob('*.pdf'):
        old.unlink()
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    with sync_playwright() as p:
        b = p.chromium.launch(proxy={'server': proxy} if proxy else None)
        page = b.new_page()
        tmp = OUT / '_tmp.html'
        jobs = [(f'lesson-{L["num"]}.pdf', [L], f'{course} — שיעור {L["num"]}') for L in keep]
        for name, ls, title in jobs:
            tmp.write_text(doc(ls, course, title), encoding='utf8')
            page.goto(tmp.as_uri(), wait_until='networkidle')
            page.evaluate('document.fonts.ready')
            page.pdf(path=str(OUT / name), format='A4', print_background=True, prefer_css_page_size=True)
            print('wrote', f'pdfs/{name}')
        tmp.unlink()
        b.close()


if __name__ == '__main__':
    main()
