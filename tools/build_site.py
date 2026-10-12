#!/usr/bin/env python3
"""site.json + videos.md + labs.md (+ lesson titles from exercises.md) -> index.html, videos.html, labs.html.

Usage (from the repo root):  python3 tools/build_site.py
"""
import html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
COLORS = ['#F2B441', '#E4553C', '#7FC1C9']
E = html.escape

BASE_CSS = """@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;800&display=swap');
:root{--bg:#182233;--ink:#F3EEE4;--muted:#9AA3B2;--line:#2B3750;--panel:#1C2A3E;--amber:#F2B441;--red:#E4553C;--teal:#7FC1C9}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink)}
body{font-family:Heebo,"Segoe UI",Arial,sans-serif;font-size:clamp(16px,1.25vw,20px);line-height:1.55;font-weight:300}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
strong{font-weight:600}
.wrap{max-width:820px;margin:0 auto;padding:7vh 5vw 10vh}
h1{margin:0;font-weight:800;line-height:1.05}
.muted{color:var(--muted)}
.back{display:inline-block;color:var(--muted);margin-bottom:3em}
.back:hover{color:var(--ink)}
footer{margin-top:10vh;color:var(--muted);font-size:.85em;border-top:1px solid var(--line);padding-top:1.2em;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1em}
footer a:hover{color:var(--ink)}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
"""


def page(title, css, body, site, script=''):
    foot = (f'<footer><span>{E(site["footer"])}</span><span dir="ltr"><a href="{site["home_url"]}">'
            f'{E(site["home_url"].split("//", 1)[1])}</a></span></footer>')
    return (f'<!DOCTYPE html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>{E(title)}</title>\n'
            f'<style>{BASE_CSS}\n{css}</style>\n</head><body>\n<div class="wrap">\n{body}\n{foot}\n</div>\n'
            f'{script}</body></html>')


def md_link(text):
    m = re.match(r'^\[([^\]]+)\]\(([^)]+)\)$', text.strip())
    return (m.group(1), m.group(2)) if m else None


def lesson_titles():
    md = (ROOT / 'exercises.md').read_text(encoding='utf8')
    return {int(n): t.strip() for n, t in re.findall(r'^## שיעור (\d+) — (.+)$', md, re.M)}


# ---------------- home ----------------
HOME_CSS = """.hero h1{font-size:clamp(3.2em,9vw,5.6em);letter-spacing:-.01em}
.who{font-size:1.15em;margin:.6em 0 0;font-weight:400}
.who span{color:var(--muted);font-weight:300}
.about{max-width:62ch;margin:2.2em 0 0;font-size:1.05em}
.timeline{display:block;width:100%;height:auto;margin:3.5em 0 3em}
.links{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.links li{border-bottom:1px solid var(--line)}
.links a{display:grid;grid-template-columns:6px 1fr auto;gap:0 1.2em;align-items:center;padding:1.15em 0;transition:padding-inline-start .15s}
.links a:hover{padding-inline-start:.6em}
.links .bar{width:6px;height:2.6em;border-radius:3px}
.links .t{font-size:1.55em;font-weight:800;line-height:1.15}
.links .d{color:var(--muted);display:block;font-size:.72em;font-weight:300;margin-top:.15em}
.links .ext{color:var(--muted);font-size:.85em;font-weight:300}
@media (max-width:600px){.links .ext{display:none}}"""

TL_X = [754, 640, 517, 402, 295, 180, 66]   # hand-placed for the 7-stage arc


def timeline(arc):
    n = len(arc)
    xs = TL_X if n == len(TL_X) else [round(820 - 66 - i * (820 - 132) / max(n - 1, 1)) for i in range(n)]
    parts = ['<line x1="16.4" y1="60" x2="803.6" y2="60" stroke="#2B3750" stroke-width="2"/>']
    for i, (x, label) in enumerate(zip(xs, arc)):
        c, top = COLORS[i % 3], [46, 36, 26][i % 3]
        parts.append(f'<line x1="{x}" y1="{top}" x2="{x}" y2="60" stroke="{c}" stroke-width="3" stroke-linecap="round"/>'
                     f'<circle cx="{x}" cy="60" r="5" fill="{c}"/>'
                     f'<text x="{x}" y="92" text-anchor="middle" fill="#9AA3B2" font-size="15" '
                     f'font-family="Heebo,Arial,sans-serif">{E(label)}</text>')
    parts.append('<path d="M10 60 l11 -6 v12 z" fill="#5A6B8A"/>')
    return f'<svg class="timeline" viewBox="0 0 820 130" role="img" aria-label="ציר הקורס">{"".join(parts)}</svg>'


def build_home(site):
    items = []
    for i, L in enumerate(site['links']):
        ext = '<span class="ext">↗</span>' if L['url'].startswith('http') else ''
        items.append(f'<li><a href="{E(L["url"])}"><span class="bar" style="background:{COLORS[i % 3]}"></span>'
                     f'<span><span class="t">{E(L["title"])}</span><span class="d">{E(L["desc"])}</span></span>'
                     f'{ext}</a></li>')
    body = (f'<header class="hero">\n<h1>{E(site["course"])}</h1>\n'
            f'<p class="who">{E(site["lecturer"])} <span>· {E(site["affiliation"])}</span></p>\n'
            f'<p class="about">{E(site["about"])}</p>\n</header>\n{timeline(site["arc"])}\n'
            f'<ul class="links">{"".join(items)}</ul>')
    return page(site['course'], HOME_CSS, body, site)


# ---------------- videos (in-page player) ----------------
VID_CSS = """h1{font-size:clamp(2.4em,6vw,3.6em)}
.intro{max-width:62ch;margin:1.2em 0 .6em;font-size:1.05em}
.folder{display:inline-block;color:var(--teal);border:1px solid var(--teal);border-radius:4px;padding:.3em 1em;font-weight:600;font-size:.9em;margin:.6em 0 3em}
.folder:hover{background:rgba(127,193,201,.12)}
.lec{margin:0 0 3.2em}
.lec h2{margin:0 0 .5em;font-size:1.05em;font-weight:400;color:var(--muted);display:flex;gap:.8em;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:.4em}
.lec h2 b{font-size:2.1em;font-weight:800;color:var(--ink);line-height:1}
.vids{list-style:none;margin:0;padding:0}
.vids li{display:grid;grid-template-columns:3.2em 1fr;gap:0 .8em;align-items:baseline;padding:.42em 0}
.vids .n{color:var(--muted);font-variant-numeric:tabular-nums;font-size:.9em;text-align:left;direction:ltr}
.vids .vt{font-weight:400;font-size:1.08em;text-align:start}
.vids .vt:hover,.vids li.on .vt{text-decoration:underline;text-decoration-color:var(--amber);text-underline-offset:.2em}
.vids li.on .vt{color:var(--amber)}
.player{grid-column:1/-1;margin:.7em 0 .9em}
.player .frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:6px;overflow:hidden}
.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.player .bar{display:flex;justify-content:space-between;gap:1em;margin-top:.5em;font-size:.85em;color:var(--muted)}
.player .bar button,.player .bar a{color:var(--muted)}
.player .bar button:hover,.player .bar a:hover{color:var(--ink)}"""

VID_JS = """<script>
(function(){
  var items=[].slice.call(document.querySelectorAll('.vids li[data-id]'));
  var open=null;
  function close(){ if(!open) return; open.li.classList.remove('on'); open.box.remove(); open=null; }
  function play(i){
    close(); var li=items[i]; if(!li) return;
    var id=li.getAttribute('data-id'), box=document.createElement('div');
    box.className='player';
    box.innerHTML='<div class="frame"><iframe allow="autoplay; fullscreen" allowfullscreen src="https://drive.google.com/file/d/'+id+'/preview"></iframe></div>'
      +'<div class="bar"><span>'+(i>0?'<button data-k="prev">→ הקודם</button>':'')+'</span>'
      +'<a href="https://drive.google.com/file/d/'+id+'/view" target="_blank" rel="noopener">פתיחה ב-Drive ↗</a>'
      +'<span>'+(i<items.length-1?'<button data-k="next">הבא ←</button>':'')+'</span></div>';
    box.addEventListener('click',function(e){var k=e.target.getAttribute('data-k'); if(k==='prev')play(i-1); if(k==='next')play(i+1);});
    li.appendChild(box); li.classList.add('on'); open={li:li,box:box};
    li.scrollIntoView({behavior:'smooth',block:'start'});
    history.replaceState(null,'','#v'+li.getAttribute('data-n'));
  }
  items.forEach(function(li,i){ li.querySelector('.vt').addEventListener('click',function(){
    if(open&&open.li===li){close();history.replaceState(null,'',location.pathname);} else play(i); }); });
  var m=location.hash.match(/^#v(.+)$/);
  if(m){ var j=items.findIndex(function(li){return li.getAttribute('data-n')===decodeURIComponent(m[1]);}); if(j>=0) play(j); }
})();
</script>
"""


def drive_id(url):
    m = re.search(r'/d/([\w-]+)', url)
    return m.group(1) if m else None


def build_videos(site):
    md = (ROOT / 'videos.md').read_text(encoding='utf8')
    titles = lesson_titles()
    lines = md.split('\n')
    h1 = lines[0].lstrip('# ').strip()
    intro, folder, secs, cur = [], None, [], None
    for line in lines[1:]:
        t = line.strip()
        m = re.match(r'^## הרצאה (\d+)$', t)
        if m:
            cur = {'num': int(m.group(1)), 'vids': []}; secs.append(cur); continue
        if cur is None:
            if md_link(t): folder = md_link(t)
            elif t: intro.append(t)
            continue
        m = re.match(r'^- (.+?) \| (.+?) \| (\S+)$', t)
        if m:
            cur['vids'].append(m.groups())
    out = [f'<a class="back" href="./">→ {E(site["course"])}</a>', f'<h1>{E(h1)}</h1>']
    out += [f'<p class="intro">{E(p)}</p>' for p in intro]
    if folder:
        out.append(f'<a class="folder" href="{E(folder[1])}" target="_blank" rel="noopener">{E(folder[0])}</a>')
    for i, s in enumerate(secs):
        lis = ''.join(f'<li data-id="{drive_id(u)}" data-n="{E(n)}" id="v{E(n)}"><span class="n">{E(n)}</span>'
                      f'<span><button type="button" class="vt">{E(t)}</button></span></li>' for n, t, u in s['vids'])
        out.append(f'<section class="lec" id="l{s["num"]}"><h2><b style="color:{COLORS[i % 3]}">{s["num"]}</b>'
                   f'<span>{E(titles.get(s["num"], ""))}</span></h2><ul class="vids">{lis}</ul></section>')
    return page(f'{site["course"]} — סרטונים', VID_CSS, '\n'.join(out), site, VID_JS)


# ---------------- labs ----------------
LAB_CSS = VID_CSS + """
.labs{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.labs li{display:grid;grid-template-columns:2.4em 1fr auto;gap:0 1em;align-items:baseline;padding:.7em 0;border-bottom:1px solid var(--line)}
.labs .n{color:var(--muted);font-variant-numeric:tabular-nums;text-align:left;direction:ltr}
.labs .t{font-weight:400;font-size:1.08em}
.labs a.go{font-size:.8em;font-weight:600;border:1px solid;border-radius:4px;padding:.15em .8em;white-space:nowrap}
.labs a.go:hover{background:rgba(255,255,255,.06)}"""
LAB_KIND = {
    'colab': ('פתיחה ב-Colab', 'https://colab.research.google.com/drive/{}', '#F2B441'),
    'pdf': ('PDF', 'https://drive.google.com/file/d/{}/view', '#7FC1C9'),
    'folder': ('תיקייה', 'https://drive.google.com/drive/folders/{}', '#9AA3B2'),
}


def build_labs(site):
    lines = (ROOT / 'labs.md').read_text(encoding='utf8').split('\n')
    h1 = lines[0].lstrip('# ').strip()
    out = [f'<a class="back" href="./">→ {E(site["course"])}</a>', f'<h1>{E(h1)}</h1>']
    rows = []
    for line in lines[1:]:
        t = line.strip()
        m = re.match(r'^- (.+?) \| (.+?) \| (\w+) \| ([\w-]+)$', t)
        if m:
            n, title, kind, fid = m.groups()
            label, url, c = LAB_KIND[kind]
            rows.append(f'<li><span class="n">{E(n)}</span><span class="t">{E(title)}</span>'
                        f'<a class="go" style="color:{c}" href="{url.format(fid)}" target="_blank" rel="noopener">{label} ↗</a></li>')
        elif md_link(t):
            a = md_link(t)
            out.append(f'<a class="folder" href="{E(a[1])}" target="_blank" rel="noopener">{E(a[0])}</a>')
        elif t:
            out.append(f'<p class="intro">{E(t)}</p>')
    out.append(f'<ul class="labs">{"".join(rows)}</ul>')
    return page(f'{site["course"]} — מעבדות', LAB_CSS, '\n'.join(out), site)


def main():
    site = json.loads((ROOT / 'site.json').read_text(encoding='utf8'))
    for name, fn in [('index.html', build_home), ('videos.html', build_videos), ('labs.html', build_labs)]:
        (ROOT / name).write_text(fn(site), encoding='utf8')
        print('wrote', name)


if __name__ == '__main__':
    main()
