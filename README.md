# alli-site

Website for Alli Pfaff, RP, MTA — Registered Psychotherapist | Music Psychotherapist (Peterborough, ON).

Static HTML/CSS/JS, no framework. A small Node script assembles the pages and generates responsive WebP photos.

## Commands

```bash
npm install        # once (installs sharp, used for images)
npm run build      # builds into dist/
npm run preview    # builds and serves dist/ locally
```

To publish, upload the **contents** of `dist/` to the host's `public_html`.

## Structure

```
src/
  pages/      one file per page; first line is JSON front matter (title, description, section)
  partials/   layout, header (stripe menu), footer
  assets/     css, js, logo SVGs
  photos/     original photos -> resized to WebP at build time
content/      original copy brief from Alli
build.mjs     the build script
```

Inside pages:

- `{{photo name="alli-portrait" alt="..." sizes="..." loading="eager"}}` inserts a responsive image from `src/photos/`.
- Each stripe sets its colours with `style="--c0:#...;--c1:#..."`. On hover the gradient (twice the stripe's height) slides up and back down, creating the wave effect.

## Still pending

- Contact form backend (the form only shows a notice until an `action` is set in `contact.html`)
- Email and phone in the contact details
- Real articles for Resources (PDA and Grief are placeholders marked "Coming soon")
