# I&A Jewels Catalogue

Mobile-first static digital catalogue for I&A Jewels.

## Architecture

- HTML + CSS + modern JavaScript
- Product data in `src/data/products.js`
- Build-time product page generation with Node
- Static production output in `dist/`
- GitHub → Netlify deployment
- WhatsApp enquiry handoff
- No backend, database, accounts, checkout, payment or inventory system

## Development

Requirements:

- Node.js 18+ recommended
- Git

Install/verify:

```bash
node --version
npm --version
```

Build:

```bash
npm run build
```

The generated site is placed in `dist/`.

## Adding a product

1. Create a folder under `src/assets/products/`.
2. Add 1–20 production-ready images.
3. Add the product object to `src/data/products.js`.
4. Run `npm run build`.
5. Fix any validation errors.
6. Preview `dist/` locally.
7. Commit and push to GitHub.
8. Netlify builds and publishes `dist/`.

## Important configuration before production

Edit `src/data/config.js`:

- `siteUrl`
- `whatsappNumber`

Also replace the development logo and demo product imagery with I&A Jewels' approved production assets.

## Netlify

`netlify.toml` already defines:

- Build command: `npm run build`
- Publish directory: `dist`

Connect the GitHub repository to Netlify and use the repository root as the project directory.

## Development assets

The included SVG product images are temporary development assets only. Replace them before launch with approved I&A Jewels images.

## Brand

The current CSS values are development placeholders. Final colours and typography should be aligned with the supplied I&A Jewels logo/brand assets before production.
