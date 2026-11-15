# Neo Legaspi - Portfolio Website

Live site: https://kwamsc-web.vercel.app

Personal resume and portfolio website. A single-page static site built with HTML, CSS and JavaScript (no framework, no build step).

## Files

- `index.html` - page content and structure, including the case-study dialogs
- `css/style.css` - all styling and responsive rules (dark graphite theme, one blue accent)
- `js/script.js` - scroll controller (progress bar, hero and parallax motion, pinned project showcase, timeline), reveal animations, mobile menu, active nav indicator, case-study dialogs, copy-email button
- `assets/` - resume PDF and favicon
- `assets/img/` - project preview images (`capstone.webp`, `thesara.webp`) and the social share image (`og-image.png`)
- `_archive/` - local-only copy of the old demo videos. Ignored by git (`.gitignore`) and by Vercel (`.vercelignore`), so it is never deployed.

## Run locally

Open `index.html` in a browser, or use the Live Server extension in VS Code.

## Deploy

Hosted on Vercel as a static site. Framework preset: Other. No build command.

## Notes

- Case studies open from the project cards. A link such as `index.html#case-capstone` opens one directly.
  Available ids: `capstone`, `thesara`, `petclinic`, `puzzle`, `battle`.
- Demo videos were removed to keep the site fast (the page was shipping about 89 MB of video).
- Animation is plain CSS plus one small script (no animation library). On screens at least 1021px wide and 640px tall, the two featured projects pin and change as you scroll. On smaller screens they are a normal vertical list.
- `prefers-reduced-motion` turns off pinning, parallax and reveal movement. If the script fails, the page falls back to fully visible static content.
- If a preview image is missing, the card falls back to a plain labelled placeholder.
