# alli-site

Website for Alli Pfaff, RP, MTA — Registered Psychotherapist | Music Psychotherapist (Peterborough, ON).

Plain static HTML/CSS/JS — no build step, no Node.

To publish, upload everything except `content/` and `README.md` to the host's `public_html` (keep the folder structure).

## Structure

Clean URLs: each page is a folder with an `index.html` (`/about/`, `/who-i-help/children/`). Links and asset paths are root-relative (`/assets/...`), so preview with Live Server from this folder (or any static server), not by opening files directly.

```
index.html                     home (piano hero)
about/  contact/  fees/  my-approach/  resources/
who-i-help/                    + children/  teens/  adults/  parents/
assets/css/style.css           all styles
assets/js/main.js              piano hero (sound, glissando), menu, reveal, filters, contact form submit
assets/img/                    logo SVGs + photos/ (WebP crops; "-full" = uncropped, used in the About gallery)
assets/audio/                  piano samples for the home hero
functions/api/contact.js       Cloudflare Pages Function: emails the contact form via Resend
content/                       copy brief and original photos (not published)
```

Notes:

- Header/footer changes must be made in every page.
- CSS/JS links carry a version (`style.css?v=16`). Bump it in every page after changing them so browsers drop the cached copy.
- Each stripe sets its colours with `style="--c0:#...;--c1:#..."`. On hover the gradient (twice the stripe's height) slides up and back down, creating the wave effect.
- The active menu item uses `aria-current="page"` (and `aria-current="true"` on "Who I Help" for its sub-pages).

## Contact form

The form posts to `/api/contact`, a Cloudflare Pages Function (`functions/api/contact.js`) that sends the message through [Resend](https://resend.com). It only runs on Cloudflare, not in Live Server. Set these in Cloudflare (Pages project > Settings > Variables and Secrets):

- `RESEND_API_KEY` (secret): API key from Resend
- `CONTACT_TO`: inbox that receives the messages (comma-separate several)
- `CONTACT_FROM` (optional): sender on a domain verified in Resend; defaults to `Alli Pfaff Website <website@allipfaff.ca>`

The visitor's address goes in Reply-To, so replying answers them directly. A hidden `website` field catches bots.

## Credits

- Piano samples in `assets/audio/`: Salamander Grand Piano by Alexander Holm, licensed CC BY 3.0. The hero sound needs the site served over http (Live Server or the host). It does not work when the file is opened directly.

## Still pending

- Email and phone in the contact details
- Real articles for Resources (PDA and Grief are placeholders marked "Coming soon")
