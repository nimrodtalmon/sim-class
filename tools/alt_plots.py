#!/usr/bin/env python3
"""Illustrations for the comparing-alternatives slides (lesson 10), simulated here:
Zippy (M/M/1, mean service 0.9) vs Klunky (M/M/2, mean service 1.8), arrival rate 1,
measure = average delay in queue of the first 100 customers from empty-and-idle.
Run from the repo root:  python3 tools/alt_plots.py   (needs numpy, matplotlib)
"""
import pathlib
import numpy as np
import matplotlib
matplotlib.use('svg')
import matplotlib.pyplot as plt

OUT = pathlib.Path(__file__).resolve().parent.parent / 'exercises' / 'slides' / 'alt'
INK, MUT, LINE, AMB, TEAL, RED = '#F3EEE4', '#9AA3B2', '#2B3750', '#F2B441', '#7FC1C9', '#E4553C'
plt.rcParams.update({'svg.fonttype': 'none', 'font.family': 'DejaVu Sans', 'font.size': 11, 'text.color': INK,
                     'axes.labelcolor': MUT, 'xtick.color': MUT, 'ytick.color': MUT, 'axes.edgecolor': LINE,
                     'axes.facecolor': 'none', 'figure.facecolor': 'none', 'legend.frameon': False})
N = 100


def delays_zippy(ua, us):
    a = -np.log(1 - ua)            # interarrival, rate 1
    s = -0.9 * np.log(1 - us)      # service, mean 0.9
    d, tot = 0.0, 0.0
    for k in range(1, N):
        d = max(0.0, d + s[k - 1] - a[k])
        tot += d
    return tot / N


def delays_klunky(ua, us):
    a = -np.log(1 - ua)
    s = -1.8 * np.log(1 - us)      # service, mean 1.8
    t, free, tot = 0.0, [0.0, 0.0], 0.0
    for k in range(N):
        t += a[k]
        j = 0 if free[0] <= free[1] else 1
        start = max(t, free[j])
        tot += start - t
        free[j] = start + s[k]
    return tot / N


def rep(rng, crn):
    ua, us = rng.random(N), rng.random(N)
    if crn:
        return delays_zippy(ua, us), delays_klunky(ua, us)
    return delays_zippy(ua, us), delays_klunky(rng.random(N), rng.random(N))


def clean(ax):
    for sp in ['top', 'right']:
        ax.spines[sp].set_visible(False)


def save(f, name):
    f.tight_layout()
    f.savefig(OUT / f'{name}.svg', transparent=True)
    plt.close(f)


def dotplot(rng):
    f, ax = plt.subplots(figsize=(8.6, 3.6))
    ns = [1, 5, 10, 20]
    for row, n in enumerate(ns):
        z = [np.mean([rep(rng, False)[0] for _ in range(n)]) for _ in range(100)]
        k = [np.mean([rep(rng, False)[1] for _ in range(n)]) for _ in range(100)]
        y = row * 2
        ax.plot(z, np.full(100, y + .45) + rng.uniform(-.12, .12, 100), 'o', ms=2.6, color=AMB, alpha=.7)
        ax.plot(k, np.full(100, y - .05) + rng.uniform(-.12, .12, 100), 'o', ms=2.6, color=TEAL, alpha=.7)
        ax.text(16.3, y + .2, f'n = {n}', color=INK, va='center')
    ax.axvline(4.13, color=AMB, lw=1.2, ls='--')
    ax.axvline(3.70, color=TEAL, lw=1.2, ls='--')
    ax.plot([], [], 'o', color=AMB, label='Zippy (M/M/1)')
    ax.plot([], [], 'o', color=TEAL, label='Klunky (M/M/2)')
    ax.legend(loc='lower left', bbox_to_anchor=(0, 1.0), ncol=2, fontsize=9)
    ax.set_yticks([]); ax.set_xlim(0, 17.5); ax.set_xlabel('average delay in queue')
    clean(ax)
    save(f, 'dotplot')


def crn_series(rng):
    f, axs = plt.subplots(2, 1, figsize=(8.6, 4.4), sharex=True)
    for ax, crn, title in [(axs[0], False, 'independent sampling'), (axs[1], True, 'CRN')]:
        xs = np.array([rep(rng, crn) for _ in range(100)])
        j = np.arange(1, 101)
        ax.vlines(j, xs[:, 0], xs[:, 1], color=LINE, lw=1)
        ax.plot(j, xs[:, 0], 'o', ms=3, color=AMB, label='Zippy')
        ax.plot(j, xs[:, 1], 'o', ms=3, color=TEAL, label='Klunky')
        ax.set_title(title, loc='left', color=INK, fontsize=11)
        ax.set_ylim(0, 16)
        clean(ax)
    axs[0].legend(loc='lower right', bbox_to_anchor=(1, 1.0), fontsize=9, ncol=2)
    axs[1].set_xlabel('replication j')
    save(f, 'crn-series')


def crn_scatter(rng):
    f, ax = plt.subplots(figsize=(4.8, 4.4))
    for crn, c, lab in [(False, MUT, 'independent'), (True, AMB, 'CRN')]:
        xs = np.array([rep(rng, crn) for _ in range(100)])
        r = np.corrcoef(xs[:, 0], xs[:, 1])[0, 1]
        ax.plot(xs[:, 0], xs[:, 1], 'o', ms=3.5, color=c, alpha=.8, label=f'{lab} (r = {r:.2f})')
    ax.set_xlabel('Zippy'); ax.set_ylabel('Klunky')
    ax.set_xlim(0, 16); ax.set_ylim(0, 16)
    ax.legend(loc='upper left', fontsize=9)
    clean(ax)
    save(f, 'crn-scatter')


def fire():
    f, axs = plt.subplots(2, 2, figsize=(6.4, 4.4))
    u = np.linspace(0, 1, 100)
    cases = [(u ** 2, .3 + .7 * u, 'works'), (1 - u ** .5, .9 - .6 * u, 'works'),
             (u ** 2, 1 - .8 * u, 'backfires'), (1 - u ** .5, .2 + .6 * u, 'backfires')]
    for ax, (a, b, lab) in zip(axs.flat, cases):
        ax.plot(u, a, color=AMB, lw=2); ax.plot(u, b, color=TEAL, lw=2)
        ax.set_title(lab, loc='right', color=RED if lab == 'backfires' else INK, fontsize=10)
        ax.set_xticks([]); ax.set_yticks([]); ax.set_xlabel('U')
        clean(ax)
    save(f, 'crn-fire')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(2026)
    dotplot(rng); crn_series(rng); crn_scatter(rng); fire()


if __name__ == '__main__':
    main()
