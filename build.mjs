// Static site build: assembles pages from partials and generates responsive photos.
// Usage: npm run build  ->  output in dist/ (upload its contents to the host's public_html)
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'src';
const OUT = 'dist';
const PHOTO_WIDTHS = [720, 1400];

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(path.join(OUT, 'assets/img/photos'), { recursive: true });
await fs.cp(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });

// --- Photos -> webp at a couple of widths -------------------------------
const photos = {};
for (const file of await fs.readdir(path.join(SRC, 'photos'))) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const name = file.replace(/\.[^.]+$/, '');
  const input = path.join(SRC, 'photos', file);
  const meta = await sharp(input).metadata();
  const widths = [...new Set(PHOTO_WIDTHS.map((w) => Math.min(w, meta.width)))];
  for (const w of widths) {
    await sharp(input).resize({ width: w }).webp({ quality: 78 }).toFile(path.join(OUT, `assets/img/photos/${name}-${w}.webp`));
  }
  photos[name] = { widths, ratio: meta.height / meta.width };
}

function photoTag(attrs) {
  const p = photos[attrs.name];
  if (!p) throw new Error(`Unknown photo: ${attrs.name}`);
  const largest = p.widths[p.widths.length - 1];
  const srcset = p.widths.map((w) => `assets/img/photos/${attrs.name}-${w}.webp ${w}w`).join(', ');
  const eager = attrs.loading === 'eager';
  return `<img src="assets/img/photos/${attrs.name}-${largest}.webp" srcset="${srcset}" sizes="${attrs.sizes || '(min-width: 900px) 50vw, 100vw'}" width="${largest}" height="${Math.round(largest * p.ratio)}" alt="${attrs.alt || ''}"${attrs.class ? ` class="${attrs.class}"` : ''} loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} decoding="async">`;
}

// --- Pages ----------------------------------------------------------------
const partials = {};
for (const file of await fs.readdir(path.join(SRC, 'partials'))) {
  partials[file.replace(/\.html$/, '')] = await fs.readFile(path.join(SRC, 'partials', file), 'utf8');
}

const parseAttrs = (s) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

for (const file of await fs.readdir(path.join(SRC, 'pages'))) {
  if (!file.endsWith('.html')) continue;
  let src = await fs.readFile(path.join(SRC, 'pages', file), 'utf8');

  // Front matter: <!--- { json } ---> on the first line
  let data = {};
  src = src.replace(/^<!---([\s\S]*?)--->\s*/, (_, json) => { data = JSON.parse(json); return ''; });
  data.page = file;
  data.body = src;

  let html = partials.layout;
  for (let i = 0; i < 5 && /\{\{>\s*\w+\s*\}\}/.test(html); i++) {
    html = html.replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, name) => {
      if (name === 'body') return data.body;
      if (!(name in partials)) throw new Error(`Unknown partial: ${name}`);
      return partials[name];
    });
  }
  html = html.replace(/\{\{photo ([^}]*)\}\}/g, (_, a) => photoTag(parseAttrs(a)));
  html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? '');

  // Active navigation
  html = html.replaceAll(`href="${file}" data-nav`, `href="${file}" data-nav aria-current="page"`);
  if (data.section) html = html.replaceAll(`href="${data.section}" data-nav`, `href="${data.section}" data-nav aria-current="true"`);

  await fs.writeFile(path.join(OUT, file), html);
  console.log('built', file);
}
