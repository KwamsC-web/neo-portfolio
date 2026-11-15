# Neo Legaspi - Portfolio Website

Live site: https://kwamsc-web.vercel.app

Personal resume and portfolio website. A single-page static site built with HTML, CSS and JavaScript (no framework, no build step).

## Files

- `index.html` - page content and structure, including the case-study dialogs
- `css/style.css` - all styling and responsive rules (dark graphite theme, one blue accent)
- `js/script.js` - mobile menu, active nav link, reveal animations, case-study dialogs, copy-email button
- `assets/` - resume PDF, favicon, demo videos
- `assets/img/` - project preview images (`capstone.webp`, `thesara.webp`) and the social share image (`og-image.png`)

## Run locally

Open `index.html` in a browser, or use the Live Server extension in VS Code.

## Deploy

Hosted on Vercel as a static site. Framework preset: Other. No build command.

## Notes

- Case studies open from the project cards. A link such as `index.html#case-capstone` opens one directly.
  Available ids: `capstone`, `thesara`, `petclinic`, `puzzle`, `battle`.
- Demo videos use `preload="none"`, so they only download when a visitor presses play.
- If a preview image is missing, the card falls back to a plain labelled placeholder.
