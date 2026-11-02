// Exercises app (React, no JSX syntax needed). Restored 2 Nov 2026 from the compiled exercises/index.html:
// top-level names are original; local variable names are short because the original source was lost.
// tools/build.py replaces __DATA__ with the parsed exercises.md.
const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React,
  LESSONS = __DATA__,
  TIER = {
    warm: { label: "חימום", color: "#F2B441" },
    judge: { label: "שיפוט", color: "#E4553C" },
    stretch: { label: "אתגר", color: "#7FC1C9" },
    deck: { label: "מצגת", color: "#D9D2C5" },
  },
  PRESETS = [1, 2, 3, 5];
function slidesOf(t) {
  const i = [];
  return (
    t.intro.length && i.push({ kind: "intro", lesson: t, lines: t.intro }),
    t.sections.forEach((e) =>
      e.items.forEach((l) =>
        i.push({
          kind: e.tier === "deck" ? "slide" : "item",
          lesson: t,
          tier: e.tier,
          deck: e.title,
          item: l,
        }),
      ),
    ),
    i.length || i.push({ kind: "intro", lesson: t, lines: [] }),
    i
  );
}
const MATHCH =
    "A-Za-z\\u0370-\\u03FF\\u0300-\\u036F0-9\\u2080-\\u209C\\u2070-\\u2079\\u00B2\\u00B3\\u00B9\\u00BC-\\u00BE\\u2150-\\u215E()\\[\\]{}=+\\-\\u2212\\u00B7*/\\u221A^_<>\\u2264\\u2265~\\u223C.,:;|!' \\u2026\\u221E\\u0302\\u2032%±ᵢ-ᵪ",
  MATHRUN = new RegExp("[" + MATHCH + "]+", "g"),
  OPS = /[()=<>≤≥+−·\/√^_~∼\[\]{}]/,
  LETTER = /[A-Za-zͰ-Ͽ]/;
function SupSub({ text: t }) {
  return t
    .split(/(\^\{[^}]+\}|_\{[^}]+\})/g)
    .filter(Boolean)
    .map((i, e) =>
      i.startsWith("^{")
        ? React.createElement("sup", { key: e }, i.slice(2, -1))
        : i.startsWith("_{")
          ? React.createElement("sub", { key: e }, i.slice(2, -1))
          : React.createElement("span", { key: e }, i),
    );
}
function MathSpan({ text: t }) {
  return React.createElement(
    "span",
    { className: "math", dir: "ltr" },
    React.createElement(SupSub, { text: t }),
  );
}
const HEB = /[\u0590-\u05FF]/;
function Plain({ text: t, ltr: i }) {
  if (i) return React.createElement(SupSub, { text: t });
  const e = [];
  let l = 0,
    s;
  for (MATHRUN.lastIndex = 0; (s = MATHRUN.exec(t)) !== null;) {
    let n = s[0],
      r = s.index;
    const d = n.match(/^[-\s,.:;]+/);
    d && ((r += d[0].length), (n = n.slice(d[0].length)));
    const m = n.match(/[\s,.:;!=<>+−~∼·\/(]+$/);
    m && (n = n.slice(0, -m[0].length));
    const a = (x, u) => x.split(u).length - 1;
    for (; n.startsWith("(") && a(n, "(") > a(n, ")");) ((n = n.slice(1)), (r += 1));
    for (; n.endsWith(")") && a(n, ")") > a(n, "(");) n = n.slice(0, -1);
    ((n = n.replace(/[\s,.:;]+$/, "")),
      !(!n || !OPS.test(n) || !LETTER.test(n)) &&
        (r > l &&
          e.push(
            React.createElement("span", { key: l }, React.createElement(SupSub, { text: t.slice(l, r) })),
          ),
        e.push(React.createElement(MathSpan, { key: "m" + r, text: n })),
        (l = r + n.length)));
  }
  return (
    l < t.length &&
      e.push(React.createElement("span", { key: l }, React.createElement(SupSub, { text: t.slice(l) }))),
    e
  );
}
function Inline({ text: t, ltr: i }) {
  return t
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
    .filter(Boolean)
    .map((e, l) => {
      const s = e.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      return s
        ? React.createElement(
            "a",
            { key: l, className: "lnk", href: s[2], target: "_blank", rel: "noopener" },
            React.createElement(Plain, { text: s[1], ltr: i }),
          )
        : e.startsWith("**")
          ? React.createElement(
              "strong",
              { key: l },
              React.createElement(Inline, { text: e.slice(2, -2), ltr: i }),
            )
          : e.startsWith("$")
            ? React.createElement(MathSpan, { key: l, text: e.slice(1, -1) })
            : e.startsWith("`")
              ? React.createElement("code", { key: l, dir: "ltr" }, e.slice(1, -1))
              : e.startsWith("*")
                ? React.createElement(
                    "em",
                    { key: l },
                    React.createElement(Plain, { text: e.slice(1, -1), ltr: i }),
                  )
                : React.createElement(Plain, { key: l, text: e, ltr: i });
    });
}
const SUB = /^([א-ת])\.\s+/;
function Figs({ line: t }) {
  const i = [...t.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  return React.createElement(
    "div",
    { className: "figrow" },
    i.map((e, l) => {
      const s = (e[1].match(/^((?:card|wide|cap):\s*)+/) || [""])[0],
        n = e[1].slice(s.length),
        r = React.createElement("img", {
          key: l,
          src: e[2],
          alt: n,
          className: s.includes("card") ? "card" : "",
        });
      return s.includes("cap")
        ? React.createElement("figure", { key: l }, r, React.createElement("figcaption", null, n))
        : r;
    }),
  );
}
function Body({ lines: t, revealed: i }) {
  let e = -1;
  return React.createElement(
    "div",
    { className: "body" },
    t.map((l, s) => {
      const n = l.trim();
      if (!n) return React.createElement("div", { key: s, className: "gap" });
      const r = n.match(/^>\s*\*\[(.+)\]\*$/);
      if (r) return React.createElement("div", { key: s, className: "fig" }, r[1]);
      if (/^!\[/.test(n)) return React.createElement(Figs, { key: s, line: n });
      if (n.startsWith("> "))
        return React.createElement(
          "div",
          { key: s, className: "quote" },
          React.createElement(Inline, { text: n.slice(2) }),
        );
      if (n.startsWith("- "))
        return React.createElement(
          "div",
          { key: s, className: "bullet" },
          React.createElement("span", { className: "dot" }),
          React.createElement("span", null, React.createElement(Inline, { text: n.slice(2) })),
        );
      const d = n.match(SUB);
      return d
        ? (e++,
          React.createElement(
            "div",
            { key: s, className: "sub" + (e >= i ? " hidden" : "") },
            React.createElement("span", { className: "subletter" }, d[1], "."),
            React.createElement("span", null, React.createElement(Inline, { text: n.slice(d[0].length) })),
          ))
        : React.createElement(
            "p",
            { key: s, className: /^\s{2,}/.test(l) ? "indent" : "" },
            React.createElement(Inline, { text: n }),
          );
    }),
  );
}
function parseSlide(t) {
  const i = [];
  for (let e = 0; e < t.length; e++) {
    const l = t[e],
      s = l.trim();
    if (s.startsWith("```")) {
      const n = s.slice(3).trim(),
        r = [];
      for (e++; e < t.length && !t[e].trim().startsWith("```");) r.push(t[e++]);
      i.push({ type: n === "mermaid" ? "mermaid" : n === "svg" ? "svg" : "code", lang: n, body: r });
      continue;
    }
    if (s.startsWith("|")) {
      const n = [];
      for (; e < t.length && t[e].trim().startsWith("|");) n.push(t[e++].trim());
      (e--, i.push({ type: "table", rows: n }));
      continue;
    }
    if (!s) {
      i.push({ type: "gap" });
      continue;
    }
    if (s.startsWith("$$") && s.endsWith("$$") && s.length > 4) {
      i.push({ type: "tex", tex: s.slice(2, -2) });
      continue;
    }
    if (/^!\[/.test(s)) {
      i.push({ type: "img", line: s, wide: /!\[wide:/.test(s) });
      continue;
    }
    if (s.startsWith("!! ")) {
      i.push({ type: "big", text: s.slice(3) });
      continue;
    }
    if (s.startsWith("> ")) {
      i.push({ type: "box", text: s.slice(2) });
      continue;
    }
    if (s.startsWith("+ ")) {
      i.push({ type: "bullet", text: s.slice(2), level: 0, reveal: true });
      continue;
    }
    if (s.startsWith("- ")) {
      i.push({ type: "bullet", text: s.slice(2), level: /^\s{2,}/.test(l) ? 1 : 0 });
      continue;
    }
    i.push({ type: "p", text: s });
  }
  for (; i.length && i[i.length - 1].type === "gap";) i.pop();
  return i;
}
function revealCount(t) {
  return parseSlide(t).reduce(
    (i, e) =>
      i + (e.reveal ? 1 : 0) + (e.type === "table" ? e.rows.filter((l) => l.startsWith("|+")).length : 0),
    0,
  );
}
let mermaidReady = null;
function loadMermaid() {
  return (
    mermaidReady ||
      (mermaidReady = new Promise((t, i) => {
        const e = document.createElement("script");
        ((e.src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"),
          (e.onload = () => {
            (window.mermaid.initialize({
              startOnLoad: false,
              theme: "base",
              fontFamily: "Heebo, Arial, sans-serif",
              flowchart: { htmlLabels: true, curve: "basis", rankSpacing: 28, nodeSpacing: 28, padding: 6 },
              themeVariables: {
                background: "#182233",
                primaryColor: "#22324A",
                primaryTextColor: "#F3EEE4",
                primaryBorderColor: "#7FC1C9",
                lineColor: "#9AA3B2",
                textColor: "#F3EEE4",
                secondaryColor: "#2B3750",
                tertiaryColor: "#1C2A3E",
                fontSize: "18px",
              },
            }),
              t(window.mermaid));
          }),
          (e.onerror = i),
          document.head.appendChild(e));
      })),
    mermaidReady
  );
}
let katexReady = null;
function loadKatex() {
  return (
    katexReady ||
      (katexReady = new Promise((t, i) => {
        const e = document.createElement("link");
        ((e.rel = "stylesheet"),
          (e.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"),
          (e.onload = () => window.dispatchEvent(new Event("refit"))),
          document.head.appendChild(e));
        const l = document.createElement("script");
        ((l.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"),
          (l.onload = () => t(window.katex)),
          (l.onerror = i),
          document.head.appendChild(l));
      })),
    katexReady
  );
}
function Tex({ tex: t }) {
  const i = useRef(null);
  return (
    useEffect(() => {
      loadKatex()
        .then((e) => {
          i.current && e.render(t, i.current, { displayMode: true, throwOnError: false });
        })
        .catch(() => {
          i.current && (i.current.textContent = t);
        });
    }, [t]),
    React.createElement("div", { className: "tex", dir: "ltr", ref: i })
  );
}
let mermaidSeq = 0;
function Mermaid({ code: t }) {
  const i = useRef(null);
  return (
    useEffect(() => {
      let e = true;
      return (
        loadMermaid()
          .then((l) => l.render("mmd" + ++mermaidSeq, t))
          .then(({ svg: l }) => {
            e && i.current && (i.current.innerHTML = l);
          })
          .catch(() => {
            i.current && (i.current.textContent = "(לא הצלחתי לצייר את התרשים)");
          }),
        () => {
          e = false;
        }
      );
    }, [t]),
    React.createElement("div", { className: "mermaid-box", dir: "ltr", ref: i })
  );
}
function Code({ body: t }) {
  const i = t.map((l) => {
      const s = l.indexOf("  ## ");
      return s >= 0 ? [l.slice(0, s).replace(/\s+$/, ""), l.slice(s + 5)] : [l, ""];
    }),
    e = i.some((l) => l[1]);
  return React.createElement(
    "div",
    { className: "code" + (e ? " withnotes" : "") + (t.length > 22 ? " long" : "") },
    i.map(([l, s], n) =>
      React.createElement(
        "div",
        { key: n, className: "crow" },
        React.createElement("pre", { dir: "ltr" }, l || " "),
        e &&
          React.createElement(
            "span",
            { className: "cnote" + (s ? " on" : "") },
            s && React.createElement(Inline, { text: s }),
          ),
      ),
    ),
  );
}
function Table({ rows: t, shown: i }) {
  const e = (m) =>
      m
        .replace(/^\|\+?/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((a) => a.trim()),
    l = (m) => /^\|[\s:|-]+\|?$/.test(m) && m.includes("-"),
    n = t.findIndex(l) === 1 ? e(t[0]) : null,
    r = t.filter((m, a) => !l(m) && !(n && a === 0));
  let d = -1;
  return React.createElement(
    "div",
    { className: "tablewrap" },
    React.createElement(
      "table",
      { dir: t.some((m) => HEB.test(m)) ? void 0 : "ltr" },
      n &&
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            n.map((m, a) =>
              React.createElement(
                "th",
                { key: a },
                React.createElement(Inline, { text: m, ltr: !HEB.test(m) }),
              ),
            ),
          ),
        ),
      React.createElement(
        "tbody",
        null,
        r.map((m, a) => {
          let x = false;
          return (
            m.startsWith("|+") && (d++, (x = !i(d))),
            React.createElement(
              "tr",
              { key: a, className: x ? "hidden" : "" },
              e(m).map((u, o) =>
                React.createElement(
                  "td",
                  { key: o },
                  React.createElement(Inline, { text: u, ltr: !HEB.test(u) }),
                ),
              ),
            )
          );
        }),
      ),
    ),
  );
}
function SlideBody({ lines: t, revealed: i }) {
  const e = parseSlide(t),
    l = "sbody";
  let s = -1;
  const n = () => (s++, s < i),
    r = (o, h) => {
      switch (o.type) {
        case "gap":
          return React.createElement("div", { key: h, className: "gap" });
        case "big":
          return React.createElement(
            "div",
            { key: h, className: "big", dir: "auto" },
            React.createElement(Inline, { text: o.text, ltr: !HEB.test(o.text) }),
          );
        case "box":
          return React.createElement(
            "div",
            { key: h, className: "box", dir: "auto" },
            React.createElement(Inline, { text: o.text, ltr: !HEB.test(o.text) }),
          );
        case "img":
          return React.createElement(Figs, { key: h, line: o.line });
        case "code":
          return React.createElement(Code, { key: h, body: o.body });
        case "mermaid":
          return React.createElement(Mermaid, {
            key: h,
            code: o.body.join(`
`),
          });
        case "tex":
          return React.createElement(Tex, { key: h, tex: o.tex });
        case "svg":
          return React.createElement("div", {
            key: h,
            className: "svgbox",
            dir: "ltr",
            dangerouslySetInnerHTML: {
              __html: o.body.join(`
`),
            },
          });
        case "table": {
          const p = s,
            g = o.rows.filter((y) => y.startsWith("|+")).length;
          return (
            (s += g),
            React.createElement(Table, { key: h, rows: o.rows, shown: (y) => p + 1 + y < i })
          );
        }
        case "bullet": {
          const p = o.reveal && !n();
          return React.createElement(
            "div",
            { key: h, className: "bullet" + (o.level ? " l1" : "") + (p ? " hidden" : "") },
            React.createElement("span", { className: "dot" }),
            React.createElement(
              "span",
              { dir: "auto" },
              React.createElement(Inline, { text: o.text, ltr: !HEB.test(o.text) }),
            ),
          );
        }
        default:
          return React.createElement(
            "p",
            { key: h, dir: "auto" },
            React.createElement(Inline, { text: o.text, ltr: !HEB.test(o.text) }),
          );
      }
    },
    d = e.some((o) => o.type === "table"),
    m = (o) => (o.type === "img" && !o.wide) || (o.type === "mermaid" && !d),
    a = e.filter(m),
    u = e.filter((o) => !m(o)).some((o) => o.type !== "gap");
  if (a.length && u) {
    const o = [],
      h = [];
    return (
      e.forEach((p, g) => (a.includes(p) ? h : o).push(r(p, g))),
      React.createElement(
        "div",
        { className: l + " split" },
        React.createElement("div", { className: "scol" }, o),
        React.createElement("div", { className: "mcol" }, h),
      )
    );
  }
  return React.createElement("div", { className: l }, e.map(r));
}
// ---- timer music: calm generative lo-fi loops (four variants) (WebAudio, no files, no network) ----
// Style, key, progression and tempo are seeded by the slide's text; the melody is "read" from that text,
// so each question has its own tune (the same tune every time it is shown).
const Music = (() => {
  let ctx = null, master = null, echo = null, timerId = null, next = 0, step = 0;
  let cfg = null, seedText = "", chars = [], ci = 0, mel = 4;
  let on = true;
  try { on = localStorage.getItem("simMusic") !== "off"; } catch {}
  const SOFT = [
    [[0, 4, 7, 11, 14], [9, 12, 16, 19], [5, 9, 12, 16, 19], [7, 11, 14, 17]],   // Imaj9 vi7 IVmaj9 V7
    [[2, 5, 9, 12], [7, 11, 14, 17], [0, 4, 7, 11, 14], [9, 12, 16, 19]],        // ii7 V7 Imaj9 vi7
    [[5, 9, 12, 16], [4, 7, 11, 14], [9, 12, 16, 19], [0, 4, 7, 11, 14]],       // IVmaj7 iii7 vi7 Imaj9
    [[0, 4, 7, 11], [5, 9, 12, 16], [0, 4, 7, 11], [5, 9, 12, 16, 19]],         // Imaj7 IVmaj7 (floating)
  ];
  const PROGS = { classic: SOFT, rain: SOFT, jazzy: SOFT, dreamy: SOFT };
  const STYLES = {                                                // all lo-fi, calm; differ in groove and colour
    classic: { bpm: [68, 76], swing: 0.15, steps: 16 },
    rain: { bpm: [62, 68], swing: 0.1, steps: 16 },
    jazzy: { bpm: [72, 80], swing: 0.22, steps: 16 },
    dreamy: { bpm: [64, 72], swing: 0.12, steps: 16 },
  };
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function rng(str) {                                            // string hash -> mulberry32
    let h = 1779033703 ^ str.length;
    for (let k = 0; k < str.length; k++) { h = Math.imul(h ^ str.charCodeAt(k), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain(); master.gain.value = 0;
    const warm = ctx.createBiquadFilter(); warm.frequency.value = 3200;
    master.connect(warm); warm.connect(comp); comp.connect(ctx.destination);
    echo = ctx.createDelay(); echo.delayTime.value = 0.3;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(master);
  }
  function tone(f, t, dur, { type = "sine", vol = 0.1, att = 0.01, cut = 2000, toEcho = false } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; lp.frequency.value = cut;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(lp); lp.connect(g); g.connect(master); if (toEcho) g.connect(echo);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, cut) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = b; hp.type = "highpass"; hp.frequency.value = cut;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(hp); hp.connect(g); g.connect(master); src.start(t);
  }
  function kick(t, vol = 0.35) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35);
  }
  // next melody note "read" from the slide text: letters walk the pentatonic scale, spaces/punctuation are rests
  function textNote() {
    if (!chars.length) return null;
    const c = chars[ci++ % chars.length];
    if (!/[\p{L}\p{N}]/u.test(c)) return null;
    mel = Math.max(0, Math.min(PENTA.length - 1, mel + [-2, -1, 0, 1, 2, 1, -1][c.charCodeAt(0) % 7]));
    return PENTA[mel];
  }
  function pad(f, t, dur, vol) {                                   // two slightly detuned voices, slow swell
    tone(f * 1.003, t, dur, { type: "triangle", vol, att: Math.min(1.2, dur / 3), cut: 900 });
    tone(f * 0.997, t, dur, { type: "sine", vol, att: Math.min(1.2, dur / 3), cut: 900 });
  }
  function crackle(t) {                                           // vinyl dust
    if (Math.random() < 0.35) noise(t + Math.random() * cfg.s16, 0.004, 0.012 + Math.random() * 0.01, 2500);
  }
  function play(i, t) {
    const { style, s16, root, prog } = cfg, n = STYLES[style].steps;
    const bar = Math.floor(i / n) % prog.length, pos = i % n, ch = prog[bar];
    if (pos % 2) t += s16 * STYLES[style].swing;
    const mel = (d, vol, cut) => { const m = textNote(); if (m != null) tone(hz(root + 72 + m), t, d, { vol, att: 0.02, cut, toEcho: true }); };
    if (style === "classic") {                                    // keys on the bar, soft boom-bap, quarter-note melody
      if (pos === 0) ch.forEach((x, k) => tone(hz(root + 48 + x), t + k * 0.02, s16 * 16, { type: "triangle", vol: 0.032, att: 0.09, cut: 1000 }));
      if (pos === 0 || pos === 10) { tone(hz(root + 36 + ch[0]), t, s16 * 6, { vol: 0.13, att: 0.04, cut: 320 }); kick(t, 0.16); }
      if (pos === 4 || pos === 12) noise(t, 0.16, 0.018, 1200);
      if (pos % 4 === 0) mel(1.4, 0.04, 2200);
    } else if (style === "rain") {                                // slow, half-time, lazy chord stabs, crackle
      if (pos === 0 || pos === 7) ch.forEach((x, k) => tone(hz(root + 48 + x), t + k * 0.03, s16 * (pos ? 9 : 7), { type: "triangle", vol: 0.028, att: 0.06, cut: 900 }));
      if (pos === 0) { tone(hz(root + 36 + ch[0]), t, s16 * 12, { vol: 0.12, att: 0.05, cut: 300 }); kick(t, 0.14); }
      if (pos === 8) noise(t, 0.22, 0.016, 1000);
      crackle(t);
      if (pos === 2 || pos === 11) mel(1.8, 0.035, 1900);
    } else if (style === "jazzy") {                               // walking-ish bass, swung soft hats
      if (pos === 0 || pos === 6) ch.forEach((x, k) => tone(hz(root + 50 + x), t + k * 0.015, s16 * 5.5, { type: "triangle", vol: 0.028, att: 0.05, cut: 1100 }));
      if (pos % 4 === 0) tone(hz(root + 36 + [ch[0], ch[2] - 12, ch[0] + 12, ch[1] - 12][pos / 4]), t, s16 * 3.5, { vol: 0.11, att: 0.03, cut: 340 });
      if (pos === 0 || pos === 7 || pos === 10) kick(t, 0.13);
      if (pos === 4 || pos === 12) noise(t, 0.14, 0.016, 1300);
      if (pos % 2 === 0) noise(t, 0.03, 0.006, 6000);
      if (pos % 4 === 2) mel(1.1, 0.034, 2100);
    } else {                                                      // dreamy: pads + soft beat + bell melody with echo
      if (pos === 0) ch.forEach((x) => pad(hz(root + 48 + x), t, s16 * 17, 0.02));
      if (pos === 0 || pos === 10) { tone(hz(root + 36 + ch[0]), t, s16 * 6, { vol: 0.1, att: 0.06, cut: 300 }); kick(t, 0.13); }
      if (pos === 4 || pos === 12) noise(t, 0.18, 0.014, 1100);
      crackle(t);
      if (pos === 0 || pos === 6 || pos === 10) mel(2.4, 0.03, 2600);
    }
  }
  function tick() {
    while (next < ctx.currentTime + 0.15) { play(step++, next); next += cfg.s16; }
  }
  function start() {
    if (!on || timerId) return;
    try {
      init(); ctx.resume();
      const r = rng(seedText || String(Math.random()));
      const style = pick(r, Object.keys(STYLES)), S = STYLES[style];
      const bpm = S.bpm[0] + Math.floor(r() * (S.bpm[1] - S.bpm[0] + 1));
      cfg = { style, s16: 60 / bpm / 4, root: pick(r, [0, 2, 3, 5, 7, 8, 10]) - 2, prog: pick(r, PROGS[style]) };
      echo.delayTime.value = cfg.s16 * 3;
      chars = Array.from(seedText.replace(/\s+/g, " ")); ci = 0; mel = 4;
      step = 0; next = ctx.currentTime + 0.08;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(1.6, ctx.currentTime + 2.5);
      timerId = setInterval(tick, 25); tick();
    } catch {}
  }
  function stop(fade = 0.8) {
    if (!timerId) return;
    clearInterval(timerId); timerId = null;
    try {
      const n = ctx.currentTime;
      master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n);
      master.gain.linearRampToValueAtTime(0, n + fade);
    } catch {}
  }
  return {
    start, stop,
    setSeed: (s) => { seedText = s || ""; },
    style: () => cfg && cfg.style,
    isOn: () => on,
    toggle(running) {
      on = !on;
      try { localStorage.setItem("simMusic", on ? "on" : "off"); } catch {}
      on ? running && start() : stop(0.3);
      return on;
    },
  };
})();
// keep the screen (and so the projector) awake while the app is open
function useWakeLock() {
  useEffect(() => {
    let lock = null;
    const get = async () => {
      try { if (document.visibilityState === "visible" && navigator.wakeLock && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch {}
    };
    get();
    document.addEventListener("visibilitychange", get);
    window.addEventListener("pointerdown", get);
    window.addEventListener("keydown", get);
    return () => { document.removeEventListener("visibilitychange", get); window.removeEventListener("pointerdown", get); window.removeEventListener("keydown", get); };
  }, []);
}
function useTimer() {
  const [t, i] = useState(300),
    [e, l] = useState(300),
    [s, n] = useState(false),
    [r, d] = useState(false),
    m = useRef(null);
  return (
    useEffect(() => (s ? Music.start() : Music.stop(), () => Music.stop()), [s]),
    useEffect(() => {
      if (s)
        return (
          (m.current = setInterval(() => {
            l((a) => (a <= 1 ? (clearInterval(m.current), n(false), d(true), beep(), 0) : a - 1));
          }, 1e3)),
          () => clearInterval(m.current)
        );
    }, [s]),
    {
      total: t,
      left: e,
      running: s,
      done: r,
      set: (a) => {
        (i(a * 60), l(a * 60), n(false), d(false));
      },
      toggle: () => {
        e !== 0 && (d(false), n((a) => !a));
      },
      reset: () => {
        (l(t), n(false), d(false));
      },
    }
  );
}
function beep() {
  try {
    const t = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((i) => {
      const e = t.createOscillator(),
        l = t.createGain();
      (e.connect(l),
        l.connect(t.destination),
        (e.frequency.value = 880),
        (l.gain.value = 0.15),
        e.start(t.currentTime + i),
        e.stop(t.currentTime + i + 0.15));
    });
  } catch {}
}
function Ring({ left: t, total: i, color: e, running: l, done: s, music: mu, onClick: n }) {
  const r = 2 * Math.PI * 92,
    d = i ? t / i : 0,
    m = String(Math.floor(t / 60)).padStart(2, "0"),
    a = String(t % 60).padStart(2, "0");
  return React.createElement(
    "button",
    { className: "ring" + (s ? " done" : ""), onClick: n, "aria-label": "הפעל/עצור טיימר" },
    React.createElement(
      "svg",
      { viewBox: "0 0 220 220" },
      React.createElement("circle", { cx: "110", cy: "110", r: 92, className: "track" }),
      React.createElement("circle", {
        cx: "110",
        cy: "110",
        r: 92,
        className: "arc",
        stroke: e,
        strokeDasharray: r,
        strokeDashoffset: r * (1 - d),
      }),
    ),
    React.createElement("div", { className: "time", style: { color: s ? e : void 0 } }, m, ":", a),
    React.createElement("div", { className: "hint" }, s ? "הזמן נגמר" : l ? (mu ? "רץ ♪" : "רץ") : "רווח להתחלה"),
    React.createElement("div", { className: "mhint" }, "M · מוזיקה " + (mu ? "פועלת" : "כבויה")),
  );
}
function revealTotal(t) {
  return t
    ? t.kind === "slide"
      ? revealCount(t.item.lines)
      : 0
    : 0;
}
function tileMeta(t) {
  const i = t.sections.filter((s) => s.tier !== "deck").reduce((s, n) => s + n.items.length, 0),
    e = t.sections.filter((s) => s.tier === "deck").reduce((s, n) => s + n.items.length, 0),
    l = [];
  return (
    i && l.push(`${i} שאלות`),
    e && l.push(`${e} שקפים`),
    l.length ? l.join(" · ") : t.intro.some((s) => s.trim().startsWith("- ")) ? "סיפור" : "—"
  );
}
function Fit({ sig: t, children: i }) {
  const e = useRef(null),
    l = useRef(null),
    s = () => {
      const n = e.current,
        r = l.current;
      if (!n || !r) return;
      r.style.transform = "";
      const d = n.clientWidth,
        m = n.clientHeight,
        a = () =>
          r.scrollHeight > m + 1 ||
          r.scrollWidth > d + 1 ||
          [...r.querySelectorAll(".tablewrap,.code,.tex,.katex-display>.katex,.mermaid-box,.svgbox")].some(
            (o) => o.scrollWidth > o.clientWidth + 1,
          );
      if ((r.style.setProperty("--k", 1), !a())) return;
      let x = 0.4,
        u = 1;
      for (let o = 0; o < 9; o++) {
        const h = (x + u) / 2;
        (r.style.setProperty("--k", h), a() ? (u = h) : (x = h));
      }
      (r.style.setProperty("--k", x),
        a() && (r.style.transform = `scale(${Math.min(m / r.scrollHeight, d / r.scrollWidth)})`));
    };
  return (
    useLayoutEffect(s, [t]),
    useEffect(() => {
      const n = l.current;
      let r = 0;
      const d = () => {
          (cancelAnimationFrame(r), (r = requestAnimationFrame(s)));
        },
        m = new MutationObserver(d);
      m.observe(n, { childList: true, subtree: true });
      const a = new ResizeObserver(d);
      return (
        a.observe(e.current),
        n.addEventListener("load", d, true),
        document.fonts && (document.fonts.ready.then(d), document.fonts.addEventListener("loadingdone", d)),
        window.addEventListener("refit", d),
        () => {
          (m.disconnect(),
            a.disconnect(),
            n.removeEventListener("load", d, true),
            cancelAnimationFrame(r),
            document.fonts && document.fonts.removeEventListener("loadingdone", d),
            window.removeEventListener("refit", d));
        }
      );
    }, [t]),
    React.createElement(
      "div",
      { className: "fit", ref: e },
      React.createElement("div", { className: "fitc", ref: l }, i),
    )
  );
}
function MiniTimer({ timer: t, color: i }) {
  const e = String(Math.floor(t.left / 60)).padStart(2, "0"),
    l = String(t.left % 60).padStart(2, "0");
  return React.createElement(
    "button",
    {
      className: "minitimer" + (t.running ? " on" : "") + (t.done ? " done" : ""),
      style: { color: t.running || t.done ? i : void 0 },
      onClick: t.toggle,
      "aria-label": "טיימר",
    },
    e,
    ":",
    l,
  );
}
function App() {
  const [t, i] = useState(null),
    [e, l] = useState(0),
    [s, n] = useState({}),
    r = useTimer(),
    [mu, setMu] = useState(Music.isOn()),
    d = t == null ? null : LESSONS[t],
    m = useMemo(() => (d ? slidesOf(d) : []), [d]),
    a = m[e],
    x = a?.tier ? TIER[a.tier] : null,
    u = x ? x.color : "#D9D2C5",
    o = a ? `${t}-${e}` : "",
    h = revealTotal(a),
    p = s[o] ?? 0,
    g = () => n((f) => ({ ...f, [o]: Math.min(h, (f[o] ?? 0) + 1) })),
    y = () => n((f) => ({ ...f, [o]: Math.max(0, (f[o] ?? 0) - 1) })),
    $ = (f) => {
      if (!d) return;
      const c = e + f;
      c >= 0 && c < m.length && (l(c), r.reset());
    },
    w = (f) => {
      (i(f), l(0), r.reset());
    },
    k = a?.kind === "slide";
  Music.setSeed(a ? [a.item?.id, a.item?.title, ...(a.item?.lines || a.lines || [])].filter(Boolean).join(" ") : "");
  useWakeLock();
  useEffect(() => {
    const f = (c) => {
      if (c.target.tagName !== "INPUT" && (c.key === "m" || c.key === "M" || c.key === "צ")) {
        setMu(Music.toggle(r.running));
        return;
      }
      c.target.tagName !== "INPUT" &&
        (c.key === "ArrowLeft" || c.key === "PageDown"
          ? (c.preventDefault(), p < h ? g() : $(1))
          : c.key === "ArrowRight" || c.key === "PageUp"
            ? (c.preventDefault(), p > 0 ? y() : $(-1))
            : c.key === " "
              ? (c.preventDefault(), a?.kind === "item" && r.toggle())
              : c.key === "r" || c.key === "R"
                    ? r.reset()
                    : c.key === "Escape"
                      ? i(null)
                      : /^[1-9]$/.test(c.key) && r.set(Number(c.key)));
    };
    return (window.addEventListener("keydown", f), () => window.removeEventListener("keydown", f));
  });
  const v = (f) => {
    (f.pointerType !== "touch" && f.pointerType !== "pen") ||
      f.target.closest("a,button,input,header") ||
      (f.clientX < window.innerWidth / 2 ? (p < h ? g() : $(1)) : p > 0 ? y() : $(-1));
  };
  return d == null
    ? React.createElement(
        "div",
        { dir: "rtl", className: "app menuapp" },
        React.createElement("style", null, CSS),
        React.createElement(
          "div",
          { className: "menu" },
          React.createElement("a", { className: "kicker", href: "../" }, "סימולציה · לאתר הקורס ←"),
          React.createElement("h1", null, "בחרו מספר שיעור"),
          React.createElement(
            "div",
            { className: "grid" },
            LESSONS.map((f, c) =>
              React.createElement(
                "button",
                { key: f.num, className: "tile", onClick: () => w(c) },
                React.createElement("div", { className: "tnum" }, f.num),
                React.createElement("div", { className: "ttitle" }, f.title),
                React.createElement("div", { className: "tmeta" }, tileMeta(f)),
                React.createElement(
                  "div",
                  { className: "tbar" },
                  f.sections.map((b, E) =>
                    React.createElement("span", {
                      key: E,
                      style: { background: TIER[b.tier].color, flex: b.items.length },
                    }),
                  ),
                ),
              ),
            ),
          ),
          React.createElement(
            "div",
            { className: "keys" },
            React.createElement(
              "span",
              null,
              "במחשב: חיצים ← → לדפדוף · רווח לטיימר · 1–9 דקות · M מוזיקה (" + (mu ? "פועלת" : "כבויה") + ") · Esc לתפריט",
            ),
            React.createElement("span", null, "בטלפון: הקשה בצד שמאל — הבא, בצד ימין — הקודם"),
          ),
        ),
      )
    : React.createElement(
        "div",
        { dir: "rtl", className: "app" + (r.done ? " flash" : ""), style: { "--accent": u } },
        React.createElement("style", null, CSS),
        React.createElement(
          "div",
          { className: "stage" + (k || a.kind === "intro" ? " deckmode" : ""), onPointerUp: v },
          React.createElement(
            "header",
            null,
            React.createElement(
              "button",
              { className: "crumb", onClick: () => i(null) },
              React.createElement("span", { className: "lnum" }, "שיעור ", d.num),
              React.createElement("span", { className: "ltitle" }, d.title),
            ),
            !k && a.kind !== "intro" && React.createElement(MiniTimer, { timer: r, color: u }),
          ),
          React.createElement(
            "div",
            { className: "bar" },
            m.map((f, c) =>
              React.createElement("span", {
                key: c,
                className: c === e ? "on" : c < e ? "past" : "",
                style: c === e ? { background: f.tier ? TIER[f.tier].color : "#D9D2C5" } : void 0,
                onClick: () => {
                  (l(c), r.reset());
                },
              }),
            ),
          ),
          React.createElement(
            "main",
            null,
            React.createElement(
              Fit,
              { sig: o },
              a.kind === "intro"
                ? React.createElement(
                    "div",
                    { className: "card intro" },
                    React.createElement("h1", null, d.title),
                    a.lines.length
                      ? React.createElement(Body, { lines: a.lines, revealed: 99 })
                      : React.createElement("p", { className: "muted" }, "אין שאלות בשיעור זה."),
                  )
                : a.kind === "slide"
                  ? React.createElement(
                      "div",
                      {
                        className: "card slide" + (a.item.title ? "" : " title-slide"),
                        dir: HEB.test(a.item.title + a.item.lines.join(" ")) ? void 0 : "ltr",
                      },
                      a.item.title &&
                        React.createElement("h1", null, React.createElement(Inline, { text: a.item.title })),
                      React.createElement(SlideBody, { lines: a.item.lines, revealed: p }),
                    )
                  : React.createElement(
                      "div",
                      { className: "card" },
                      React.createElement("div", { className: "tag", style: { color: x.color } }, x.label),
                      React.createElement(
                        "h1",
                        null,
                        React.createElement("span", { className: "qid" }, a.item.id),
                        a.item.title && React.createElement("span", { className: "qtitle" }, a.item.title),
                      ),
                      React.createElement(Body, { lines: a.item.lines, revealed: 99 }),
                      h > 0 &&
                        React.createElement(
                          "button",
                          { className: "more", onClick: g, disabled: p >= h },
                          p < h ? `סעיף הבא · ${p}/${h}` : `${h}/${h}`,
                        ),
                    ),
            ),
          ),
          !k &&
            a.kind !== "intro" &&
            React.createElement(
              "aside",
              null,
              React.createElement(Ring, {
                left: r.left,
                total: r.total,
                color: u,
                running: r.running,
                done: r.done,
                music: mu,
                onClick: r.toggle,
              }),
              React.createElement(
                "div",
                { className: "presets" },
                PRESETS.map((f) =>
                  React.createElement(
                    "button",
                    { key: f, className: r.total === f * 60 ? "on" : "", onClick: () => r.set(f) },
                    f,
                  ),
                ),
                React.createElement(
                  "button",
                  { className: "reset", onClick: r.reset, "aria-label": "איפוס" },
                  "↺",
                ),
              ),
            ),
        ),
      );
}
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800&display=swap');
.app{--bg:#182233;--ink:#F3EEE4;--muted:#9AA3B2;--soft:#D9D2C5;--line:#2B3750;--panel:#1E2C41;--teal:#7FC1C9;
  background:var(--bg);color:var(--ink);font-family:Heebo,"Segoe UI",Arial,sans-serif;
  font-size:clamp(15px,1.45vw,26px);line-height:1.5;-webkit-font-smoothing:antialiased}
.app.flash{box-shadow:inset 0 0 0 10px var(--accent);animation:pulse 1s ease-in-out 3}
@keyframes pulse{50%{box-shadow:inset 0 0 0 24px var(--accent)}}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
h1{margin:0}
.muted{color:var(--muted)}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88em;background:var(--panel);padding:0 .3em;border-radius:3px;unicode-bidi:isolate}
.lnk{color:var(--accent);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.2em}

/* menu */
.menuapp{min-height:100vh;min-height:100dvh}
.menu{max-width:1100px;margin:0 auto;padding:6vh 5vw}
.kicker{color:var(--muted);font-weight:300;text-decoration:none}
.kicker:hover{color:var(--ink)}
.menu h1{font-size:2.8em;font-weight:800;margin:.3em 0 .7em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.tile{text-align:start;padding:16px 18px 14px;border:1px solid var(--line);border-radius:8px;
  display:flex;flex-direction:column;gap:3px;transition:border-color .15s,background .15s}
.tile:hover{border-color:#4A5B78;background:var(--panel)}
.tnum{font-size:2em;font-weight:800;line-height:1}
.ttitle{font-weight:500}
.tmeta{color:var(--muted);font-size:.82em}
.tbar{display:flex;gap:2px;height:3px;margin-top:10px}
.tbar span{display:block;border-radius:2px}
.keys{margin-top:5vh;color:var(--muted);font-size:.82em;display:flex;flex-direction:column;gap:.2em}

/* stage */
.stage{height:100vh;height:100dvh;box-sizing:border-box;padding:18px 4vw 22px;display:grid;
  grid-template-columns:1fr 240px;grid-template-rows:auto auto 1fr;
  grid-template-areas:"head head" "bar bar" "main side";column-gap:3vw;overflow:hidden;
  touch-action:manipulation;-webkit-user-select:none;user-select:none}
.stage.deckmode{grid-template-columns:1fr;grid-template-areas:"head" "bar" "main"}
header{grid-area:head;display:flex;justify-content:space-between;align-items:center;gap:16px;min-width:0}
.crumb{display:flex;gap:.7em;align-items:baseline;font-size:.8em;min-width:0;white-space:nowrap;overflow:hidden}
.lnum{color:var(--muted)}
.ltitle{color:var(--muted);overflow:hidden;text-overflow:ellipsis}
.crumb:hover .ltitle{color:var(--ink)}
.bar{grid-area:bar;display:flex;gap:2px;height:3px;margin:10px 0 0}
.bar span{flex:1;background:var(--line);border-radius:2px;cursor:pointer}
.bar span.past{background:#3A4A66}
main{grid-area:main;position:relative;min-height:0;min-width:0}
.fit{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fitc{width:100%;font-size:calc(var(--k,1) * 1em);transform-origin:center center;display:flex;justify-content:center}

/* cards */
.card{width:100%;max-width:62ch;padding:1em 0}
.card h1{font-size:2em;font-weight:700;line-height:1.2;letter-spacing:-.01em;display:flex;gap:.45em;align-items:baseline;flex-wrap:wrap}
.tag{font-size:.75em;font-weight:500;letter-spacing:.04em;margin-bottom:.5em}
.qid{color:var(--accent);font-weight:300;font-size:.7em}
.intro h1{font-size:2.4em;margin-bottom:.6em}
.body{margin-top:1em;font-size:1.2em;font-weight:300}
.body strong{font-weight:500}
.body p{margin:.35em 0}
.body p.indent{padding-inline-start:1.6em;color:var(--soft)}
.gap{height:.6em}
.bullet{display:flex;gap:.7em;align-items:baseline;margin:.3em 0;transition:opacity .25s,filter .25s}
.dot{width:.32em;height:.32em;border-radius:50%;background:var(--accent);flex:none;transform:translateY(-.2em)}
.sub{display:flex;gap:.7em;margin:.5em 0;transition:opacity .25s,filter .25s}
.sub.hidden,.bullet.hidden,tr.hidden{opacity:.15;filter:blur(3px)}
.subletter{color:var(--accent);font-weight:500;flex:none;min-width:1.3em}
.figrow{display:flex;gap:.6em;flex-wrap:wrap;margin:.8em 0;justify-content:center}
.figrow img{background:#fff;border-radius:6px;padding:.4em;max-height:12em;max-width:100%;object-fit:contain;flex:1 1 0;min-width:0}
.figrow img:only-child{max-height:17em;flex:0 1 auto}
.math{unicode-bidi:isolate;white-space:nowrap}
.fig{border:1px dashed #4A5B78;color:var(--muted);border-radius:6px;padding:.8em 1.1em;margin:.7em 0;font-size:.85em}
.quote{color:var(--muted);font-style:italic}
.more{margin-top:1.2em;color:var(--accent);font-size:.85em;border-bottom:1px solid currentColor;padding-bottom:1px}
.more:disabled{opacity:.35;cursor:default}
.body sup,.body sub,.sbody sup,.sbody sub{font-size:.7em;line-height:0}

/* slides */
.card.slide{max-width:min(1200px,100%)}
.slide h1{font-size:1.9em;margin-bottom:.55em}
.sbody{font-size:1.2em;font-weight:300}
.sbody strong{font-weight:500}
.sbody p{margin:.35em 0}
.sbody.split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:0 2.5em;align-items:center}
.sbody .bullet.l1{padding-inline-start:1.5em;font-size:.9em;color:var(--soft)}
.sbody .bullet.l1 .dot{background:var(--muted);width:.25em;height:.25em}
.sbody .figrow img{background:none;padding:0;max-height:15em}
.sbody .figrow img.card{background:#fff;padding:.5em}
.mcol .figrow{margin:.3em 0}
.mcol .figrow img{max-height:19em}
.mcol:has(.figrow + .figrow) .figrow img{max-height:9em}
.mcol:has(.figrow + .figrow + .figrow) .figrow img{max-height:6em}
.sbody:not(.split):has(.figrow + .figrow) .figrow img{max-height:9em}
.figrow figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:.3em;flex:1 1 0;min-width:0}
.figrow figcaption{color:var(--muted);font-size:.7em}
.sbody .figrow img[alt="qr"]{width:11em;max-height:none}
.title-slide{padding-top:0}
.title-slide .big{font-size:3em;text-align:start;margin:0 0 .3em;padding-bottom:.35em;border-bottom:2px solid var(--accent);display:inline-block}
.title-slide p{color:var(--muted);margin:.2em 0}
.big{font-size:2.2em;font-weight:700;line-height:1.2;text-align:center;margin:.5em 0}
.box{border-inline-start:2px solid var(--teal);padding:.15em 1em;margin:.8em 0;color:var(--soft)}
.box strong{color:var(--ink)}
.code{background:#121B2A;border-radius:8px;padding:.8em 1.1em;margin:.7em 0;font-size:.62em}
.crow{display:grid;grid-template-columns:auto;align-items:baseline}
.code.withnotes .crow{grid-template-columns:minmax(0,max-content) 1fr;gap:0 2em;direction:ltr}
.code pre{margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.6;text-align:left;white-space:pre}
.cnote{color:var(--muted);font-size:1.15em;font-family:Heebo,Arial,sans-serif;direction:rtl;text-align:right}
.cnote.on{color:#F2B441}
.code.long{font-size:.52em}
.tablewrap{margin:.7em 0}
.sbody table{border-collapse:collapse;font-size:.8em;margin:0 auto}
.sbody th,.sbody td{padding:.32em .9em;text-align:center;unicode-bidi:plaintext;border-bottom:1px solid var(--line)}
.sbody th{font-weight:500;color:var(--muted);border-bottom:1px solid #4A5B78}
.sbody tr:last-child td{border-bottom:0}
.sbody tr{transition:opacity .25s,filter .25s}
.mermaid-box,.svgbox{display:flex;justify-content:center;margin:.6em 0}
/* svg em differs (mermaid sets its own font-size), so size the box and let the svg inherit the px value */
.mermaid-box,.svgbox{max-height:22em}
.sbody:has(.bullet,p,.box,table) .svgbox,.sbody:has(.bullet,p,.box,table) .mermaid-box{max-height:15em}
.mcol .mermaid-box{max-height:26em}
.mermaid-box svg,.svgbox svg{width:100%!important;max-width:100%!important;height:auto;max-height:inherit}
.sbody.split:has(.mermaid-box){grid-template-columns:minmax(0,.6fr) minmax(0,1.4fr)}
.tex{margin:.5em 0}
.tex .katex-display{margin:0}

/* timer */
aside{grid-area:side;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.ring{position:relative;width:200px;height:200px;border-radius:50%}
.ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.ring .track{fill:none;stroke:var(--line);stroke-width:6}
.ring .arc{fill:none;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset 1s linear}
.ring .time{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:2.6em;font-weight:700;font-variant-numeric:tabular-nums;direction:ltr}
.ring .mhint{position:absolute;left:0;right:0;bottom:14%;text-align:center;color:var(--muted);font-size:.5em;opacity:.7}
.ring .hint{position:absolute;left:0;right:0;bottom:24%;text-align:center;color:var(--muted);font-size:.7em}
.ring.done .time{animation:blink 1s step-end 4}
@keyframes blink{50%{opacity:.25}}
.presets{display:flex;gap:4px}
.presets button{width:38px;height:32px;border-radius:6px;font-weight:500;font-size:.85em;color:var(--muted)}
.presets button.on{color:var(--accent);background:var(--panel)}
.minitimer{display:none;font-variant-numeric:tabular-nums;font-weight:500;color:var(--muted);direction:ltr;
  border:1px solid var(--line);border-radius:999px;padding:.1em .8em;font-size:.85em}
.minitimer.done{animation:blink 1s step-end 4}

@media (max-width:760px), (max-height:520px){
  .app{font-size:15px}
  .stage,.stage.deckmode{grid-template-columns:1fr;grid-template-areas:"head" "bar" "main";padding:10px 14px 12px}
  aside{display:none}
  .minitimer{display:inline-block}
}
@media (max-width:760px){
  .sbody.split{grid-template-columns:1fr}
  .sbody.split .mcol{order:2}
  .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .menu h1{font-size:2em}
}
@media (prefers-reduced-motion:reduce){.app.flash,.ring.done .time,.minitimer.done{animation:none}}
`;
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
