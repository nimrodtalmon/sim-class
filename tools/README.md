# Build

Sources: `site.json`, `videos.md`, `labs.md`, `exercises.md` (+ `exercises/fig/`, `exercises/slides/`).
Everything else is generated; never hand-edit the HTML.

```
python3 tools/build.py        # exercises.md -> exercises/index.html  (needs node; fetches esbuild via npx)
python3 tools/build_site.py   # -> index.html, videos.html, labs.html
```

## exercises.md
- `## שיעור N — כותרת` starts a lesson; text before the first `###` is the intro slide.
- `### חימום` / `### שיפוט` / `### אתגר` — exercise tiers. `**N.M** text` starts a question; `א.`, `ב.` sub-parts are revealed with Enter.
- `### מצגת` (optionally `### מצגת — שם`) starts a slide deck inside the lesson; `#### כותרת` starts a slide.

## Slide syntax
- `- bullet`, `  - nested bullet`, `+ bullet revealed by Enter`
- `> box`, `!! big statement`, plain lines are paragraphs
- `![alt](slides/x.jpg)` image; goes to a side column when the slide also has text. Alt prefix `wide:` keeps it in the text flow, `card:` puts it on a white card.
- tables: `| a | b |` with a `|---|---|` header separator; rows starting `|+` are revealed by Enter
- fenced code: ```` ``` ```` … ```` ``` ````; `code  ## note` puts a note beside the line
- ```` ```mermaid ```` diagrams, ```` ```svg ```` inline SVG, `@svg path` inlines an SVG file
- a line `$$ LaTeX $$` is display math (KaTeX)
- inline: `**bold**`, `*italic*`, `$math$`, `` `code` ``, `[text](url)`, `^{sup}`, `_{sub}`

## Layout
Every slide is fitted to the screen (no scrolling): the `Fit` component in `app.jsx` shrinks the font scale
(and, as a last resort, scales the card) until the content fits, on desktop and phone. Sizes inside slides
are in `em` so they scale together. Phone: tap the left half for next (hidden parts first), the right half for previous.
