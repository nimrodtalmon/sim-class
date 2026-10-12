#!/usr/bin/env python3
"""P/f and F plots for the 'interesting distributions' slides (lesson 2), in the site palette.
Run from the repo root:  python3 tools/dist_plots.py   (needs numpy, scipy, matplotlib)
"""
import pathlib
import numpy as np
import matplotlib
matplotlib.use('svg')
import matplotlib.pyplot as plt
from scipy import stats

OUT = pathlib.Path(__file__).resolve().parent.parent / 'exercises' / 'slides' / 'dist'
INK, MUT, LINE = '#F3EEE4', '#9AA3B2', '#2B3750'
COLS = ['#F2B441', '#7FC1C9', '#E4553C']
plt.rcParams.update({'svg.fonttype': 'none', 'font.family': 'DejaVu Sans', 'font.size': 11, 'text.color': INK,
                     'axes.labelcolor': MUT, 'xtick.color': MUT, 'ytick.color': MUT, 'axes.edgecolor': LINE,
                     'axes.facecolor': 'none', 'figure.facecolor': 'none', 'legend.frameon': False})


def fig(name, plots, discrete):
    f, axs = plt.subplots(1, 2, figsize=(8.4, 2.7))
    for ax, kind in zip(axs, ['pmf' if discrete else 'pdf', 'cdf']):
        for (lab, dist, xs), c in zip(plots, COLS):
            if discrete and kind == 'pmf':
                y = dist.pmf(xs)
                ax.vlines(xs, 0, y, color=c, lw=2, alpha=.85)
                ax.plot(xs, y, 'o', color=c, ms=3.5, label=lab)
            elif discrete:
                xe = np.arange(xs.min() - 1, xs.max() + 2)
                ax.step(xe, dist.cdf(xe), where='post', color=c, lw=2, label=lab)
            else:
                ax.plot(xs, dist.pdf(xs) if kind == 'pdf' else dist.cdf(xs), color=c, lw=2.2, label=lab)
        ax.set_title({'pmf': 'P', 'pdf': 'f', 'cdf': 'F'}[kind], color=INK, fontsize=13, loc='left')
        for sp in ['top', 'right']:
            ax.spines[sp].set_visible(False)
        ax.grid(color=LINE, lw=.6)
        ax.set_axisbelow(True)
    axs[1].legend(fontsize=9, loc='lower right')
    f.tight_layout()
    f.savefig(OUT / f'{name}.svg', transparent=True)
    plt.close(f)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    k = np.arange(0, 21)
    fig('unif-d', [('a=1, b=6', stats.randint(1, 7), np.arange(1, 7)), ('a=0, b=1', stats.randint(0, 2), np.arange(0, 2))], True)
    fig('bern', [('p=0.3', stats.bernoulli(.3), np.arange(0, 2)), ('p=0.7', stats.bernoulli(.7), np.arange(0, 2))], True)
    fig('binom', [('n=20, p=0.3', stats.binom(20, .3), k), ('n=20, p=0.7', stats.binom(20, .7), k)], True)
    fig('geom', [('p=0.2', stats.geom(.2), np.arange(1, 21)), ('p=0.5', stats.geom(.5), np.arange(1, 21))], True)
    fig('pois', [('λ=1', stats.poisson(1), k), ('λ=4', stats.poisson(4), k), ('λ=10', stats.poisson(10), k)], True)
    x = np.linspace(-0.5, 4.5, 600)
    fig('unif-c', [('a=0, b=1', stats.uniform(0, 1), x), ('a=1, b=4', stats.uniform(1, 3), x)], False)
    fig('tri', [('a=0, c=1, b=4', stats.triang(.25, 0, 4), x), ('a=0, c=3, b=4', stats.triang(.75, 0, 4), x)], False)
    x = np.linspace(0, 5, 600)
    fig('exp', [('λ=0.5', stats.expon(scale=2), x), ('λ=1', stats.expon(scale=1), x), ('λ=2', stats.expon(scale=.5), x)], False)
    x = np.linspace(-5, 5, 600)
    fig('norm', [('μ=0, σ=1', stats.norm(0, 1), x), ('μ=0, σ=2', stats.norm(0, 2), x), ('μ=−2, σ=0.5', stats.norm(-2, .5), x)], False)


if __name__ == '__main__':
    main()
