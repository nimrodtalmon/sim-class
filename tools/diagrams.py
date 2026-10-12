#!/usr/bin/env python3
"""Event-graph SVGs for the slides (site palette). Run from the repo root:
    python3 tools/diagrams.py
Writes exercises/slides/svg/eg-*.svg for the worked examples.
"""
import math, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'exercises' / 'slides' / 'svg'
INK, MUT, TEAL, RED, PANEL = '#F3EEE4', '#9AA3B2', '#7FC1C9', '#E4553C', '#22324A'
FONT = 'font-family="Heebo,Arial,sans-serif"'
R = 62


def event_graph(name, w, h, nodes, edges=(), loops=(), zigs=(), crossed=()):
    """nodes: {key: (x, y, [lines])}; edges: (a, b, bold, bend); loops: (key, bold);
    zigs: (key, angle_deg) — direction of travel into the node (0 = from the left, 30 = from upper-left)."""
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="תרשים אירועים">',
         f'<defs><marker id="eh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">'
         f'<path d="M0 0L10 5L0 10z" fill="{INK}"/></marker></defs>']
    for a, b, bold, bend in edges:
        (x1, y1, _), (x2, y2, _) = nodes[a], nodes[b]
        d = math.hypot(x2 - x1, y2 - y1); ux, uy = (x2 - x1) / d, (y2 - y1) / d
        px, py = -uy, ux
        sx, sy = x1 + ux * R + px * bend * .25, y1 + uy * R + py * bend * .25
        ex, ey = x2 - ux * (R + 6) + px * bend * .25, y2 - uy * (R + 6) + py * bend * .25
        cx, cy = (sx + ex) / 2 + px * bend, (sy + ey) / 2 + py * bend
        s.append(f'<path d="M{sx:.1f} {sy:.1f} Q{cx:.1f} {cy:.1f} {ex:.1f} {ey:.1f}" fill="none" stroke="{INK}" '
                 f'stroke-width="{5 if bold else 2.5}" marker-end="url(#eh)"/>')
    for key, bold in loops:
        x, y, _ = nodes[key]
        s.append(f'<path d="M{x-28} {y-R+6} C {x-60} {y-R-75}, {x+60} {y-R-75}, {x+30} {y-R+4}" fill="none" '
                 f'stroke="{INK}" stroke-width="{5 if bold else 2.5}" marker-end="url(#eh)"/>')
    for key, ang in zigs:
        x, y, _ = nodes[key]
        a = math.radians(ang); ux, uy = math.cos(a), math.sin(a)
        ex, ey = x - ux * (R + 6), y - uy * (R + 6)
        sx, sy = ex - ux * 95, ey - uy * 95
        px, py = -uy, ux
        pts = [(sx, sy)] + [(sx + ux * i * 13 + px * (11 if i % 2 else -11), sy + uy * i * 13 + py * (11 if i % 2 else -11)) for i in range(1, 6)] + [(ex, ey)]
        s.append(f'<polyline points="{" ".join(f"{p:.1f},{q:.1f}" for p, q in pts)}" fill="none" stroke="{INK}" '
                 f'stroke-width="2.5" marker-end="url(#eh)"/>')
    for key, (x, y, lines) in nodes.items():
        dim = key in crossed
        s.append(f'<circle cx="{x}" cy="{y}" r="{R}" fill="{PANEL}" stroke="{MUT if dim else TEAL}" stroke-width="3"'
                 f'{' opacity=".6"' if dim else ""}/>')
        y0 = y - (len(lines) - 1) * 13
        for i, l in enumerate(lines):
            s.append(f'<text x="{x}" y="{y0 + i * 26 + 8}" text-anchor="middle" font-size="19" '
                     f'fill="{MUT if dim else INK}" {FONT}>{l}</text>')
        if dim:
            s.append(f'<path d="M{x-R} {y-R}L{x+R} {y+R}M{x+R} {y-R}L{x-R} {y+R}" stroke="{RED}" stroke-width="10" '
                     f'stroke-linecap="round"/>')
    s.append('</svg>')
    (OUT / f'{name}.svg').write_text(''.join(s), encoding='utf8')


def main():
    # campus gate security: employee/student arrivals, guard finish, end; detector finish not needed
    n = {'w': (270, 170, ['הגעת עובד', '(אירוע 1)']), 's': (270, 400, ['הגעת סטודנט', '(אירוע 2)']),
         'g': (530, 285, ['סיום שומר', '(אירוע 3)']), 'e': (800, 140, ['סיום סימולציה', '(אירוע 4)']),
         'd': (800, 380, ['סיום גלאי', '???'])}
    event_graph('eg-security', 920, 500, n,
                edges=[('w', 'g', True, 0), ('s', 'g', True, 0)],
                loops=[('w', True), ('s', True), ('g', True)],
                zigs=[('w', 20), ('s', -20), ('e', 0)], crossed=['d'])
    # time-shared computer: n users, round robin
    n = {'a': (250, 200, ['Arrival']), 'c': (560, 200, ['End CPU', 'run']), 'e': (840, 200, ['End', 'simulation'])}
    event_graph('eg-computer', 960, 320, n,
                edges=[('a', 'c', True, -30), ('c', 'a', True, -30), ('c', 'e', False, 0)],
                loops=[('c', True)], zigs=[('a', 35), ('a', 0), ('a', -35)])


if __name__ == '__main__':
    main()
