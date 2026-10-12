#!/usr/bin/env python3
"""Illustrations for the design-and-output slides (lesson 8): transient vs steady state,
Welch's method on a simulated warm-up process, and batch means. Run from the repo root:
    python3 tools/output_plots.py      (needs numpy, matplotlib)
The Welch data are simulated here (an illustration of the method), not the textbook's data.
"""
import pathlib
import numpy as np
import matplotlib
matplotlib.use('svg')
import matplotlib.pyplot as plt

OUT = pathlib.Path(__file__).resolve().parent.parent / 'exercises' / 'slides' / 'out'
INK, MUT, LINE, AMB, TEAL, RED = '#F3EEE4', '#9AA3B2', '#2B3750', '#F2B441', '#7FC1C9', '#E4553C'
plt.rcParams.update({'svg.fonttype': 'none', 'font.family': 'DejaVu Sans', 'font.size': 11, 'text.color': INK,
                     'axes.labelcolor': MUT, 'xtick.color': MUT, 'ytick.color': MUT, 'axes.edgecolor': LINE,
                     'axes.facecolor': 'none', 'figure.facecolor': 'none'})


def clean(ax):
    for sp in ['top', 'right']:
        ax.spines[sp].set_visible(False)


def save(f, name):
    f.tight_layout()
    f.savefig(OUT / f'{name}.svg', transparent=True)
    plt.close(f)


def transient():
    f, ax = plt.subplots(figsize=(8, 3.6))
    i = np.linspace(0, 10, 400)
    mean = 60 - 25 * np.exp(-i / 1.6)
    ax.plot(i, mean, color=AMB, lw=2.5)
    ax.axhline(60, color=MUT, lw=1, ls='--')
    ax.text(10.15, 60, r'$\nu = E(Y)$', color=MUT, va='center', ha='left')
    y = np.linspace(-9, 9, 200)
    for k, x0 in enumerate([1.2, 2.6, 4.2, 6.2, 8.4]):
        m = 60 - 25 * np.exp(-x0 / 1.6)
        sd = 3 + 2 * np.exp(-x0 / 2)
        skew = 1 + 0.8 * np.exp(-x0 / 2) * np.tanh(y / 3)
        dens = np.exp(-0.5 * (y / sd) ** 2) * skew
        ax.plot(x0 - 1.1 * dens / dens.max(), m + y, color=TEAL, lw=1.6)
        ax.plot([x0, x0], [m - 9, m + 9], color=LINE, lw=1)
    ax.annotate('מצב מעבר', xy=(2.5, 40), color=MUT, ha='center')
    ax.annotate('מצב יציב', xy=(8.4, 50), color=MUT, ha='center')
    ax.set_xlabel('i'); ax.set_xticks([]); ax.set_yticks([])
    clean(ax)
    save(f, 'transient')


def welch_data(n=5, m=160, seed=7):
    rng = np.random.default_rng(seed)
    t = np.arange(1, m + 1)
    base = 60 - 12 * np.exp(-t / 6.0)
    Y = np.empty((n, m))
    for j in range(n):            # AR(1) noise around the transient mean
        e = np.zeros(m)
        for s in range(m):
            e[s] = (0.6 * e[s - 1] if s else 0) + rng.normal(0, 7)
        Y[j] = base + e
    return Y


def moving_avg(ybar, w):
    m = len(ybar)
    out = []
    for i in range(1, m - w + 1):
        lo = i - min(i - 1, w)
        hi = i + min(i - 1, w)
        out.append(ybar[lo - 1:hi].mean())
    return np.array(out)


def welch():
    Y = welch_data()
    ybar = Y.mean(axis=0)
    for name, series, title in [('welch-avg', [(ybar, AMB)], r'$\bar{Y}_i$'),
                                ('welch-w20', [(ybar, LINE), (moving_avg(ybar, 20), AMB)], r'$\bar{Y}_i(20)$'),
                                ('welch-w30', [(moving_avg(ybar, 5), AMB), (moving_avg(ybar, 30), TEAL)],
                                 r'$\bar{Y}_i(5)$,  $\bar{Y}_i(30)$')]:
        f, ax = plt.subplots(figsize=(8.4, 2.6))
        for s, c in series:
            lab = {AMB: 'w = 5', TEAL: 'w = 30'}.get(c) if name == 'welch-w30' else None
            ax.plot(np.arange(1, len(s) + 1), s, color=c, lw=1.8 if c != LINE else 1, label=lab)
        if name == 'welch-w30':
            ax.legend(frameon=False, loc='lower right')
        ax.set_ylim(40, 75); ax.set_xlim(0, 162)
        ax.set_title(title, loc='left', color=INK, fontsize=12)
        ax.set_xlabel('i'); ax.grid(color=LINE, lw=.5); ax.set_axisbelow(True)
        clean(ax)
        save(f, name)


def batch():
    rng = np.random.default_rng(3)
    f, ax = plt.subplots(figsize=(8.4, 2.6))
    m, k = 250, 50
    e = np.zeros(m)
    for s in range(m):
        e[s] = (0.8 * e[s - 1] if s else 0) + rng.normal(0, 1)
    ax.plot(np.arange(m), 10 + e, color=AMB, lw=1.4)
    for b in range(0, m + 1, k):
        ax.axvline(b, color=MUT, lw=1, ls='--')
    for b in range(5):
        ax.text(b * k + k / 2, ax.get_ylim()[0] if False else 4.2, rf'$\bar{{Y}}_{{{b + 1}}}(k)$', color=TEAL, ha='center')
    ax.set_ylim(4, 16); ax.set_yticks([]); ax.set_xlabel('i')
    clean(ax)
    save(f, 'batch')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    transient(); welch(); batch()


if __name__ == '__main__':
    main()
