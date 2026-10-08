const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

function cleanDist() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function loadProducts() {
  const file = fs.readFileSync(path.join(src, "data/products.js"), "utf8");
  const match = file.match(/export const products = (\[[\s\S]*\]);/);
  if (!match) throw new Error("Could not parse products.js");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`products = ${match[1]}`, sandbox);
  return sandbox.products;
}

const allowedCategories = new Set([
  "earrings", "bracelets", "necklaces", "headbands",
  "scrunchies", "rings", "lip-gloss"
]);

function validate(products) {
  const ids = new Set();
  const errors = [];

  for (const product of products) {
    if (!product.id || typeof product.id !== "string") errors.push("Missing/invalid product ID");
    if (ids.has(product.id)) errors.push(`Duplicate product ID: ${product.id}`);
    ids.add(product.id);

    if (!product.name || typeof product.name !== "string") errors.push(`${product.id}: missing name`);
    if (!allowedCategories.has(product.category)) errors.push(`${product.id}: invalid category`);
    if (!Number.isFinite(product.price) || product.price < 0) errors.push(`${product.id}: invalid price`);
    if (!Array.isArray(product.images) || product.images.length < 1 || product.images.length > 20) {
      errors.push(`${product.id}: images must contain 1–20 items`);
    }

    for (const image of product.images || []) {
      if (typeof image !== "string" || !image.startsWith("/assets/products/")) {
        errors.push(`${product.id}: invalid image path ${image}`);
      } else {
        const filePath = path.join(src, image.replace(/^\//, ""));
        if (!fs.existsSync(filePath)) errors.push(`${product.id}: missing image ${image}`);
      }
    }

    if (product.variants !== undefined) {
      if (!Array.isArray(product.variants)) errors.push(`${product.id}: variants must be an array`);
      else {
        for (const variant of product.variants) {
          if (!variant || typeof variant.name !== "string" || !variant.name.trim()) {
            errors.push(`${product.id}: malformed variant`);
          }
          if (variant.price !== undefined && (!Number.isFinite(variant.price) || variant.price < 0)) {
            errors.push(`${product.id}: invalid variant price`);
          }
        }
      }
    }
  }

  if (errors.length) throw new Error("Validation failed:\\n" + errors.join("\\n"));
}

function slugify(name) {
  return name.toLowerCase()
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const categoryLabels = {
  earrings: "Earrings", bracelets: "Bracelets", necklaces: "Necklaces",
  headbands: "Headbands", scrunchies: "Scrunchies", rings: "Rings", "lip-gloss": "Lip Gloss"
};

function money(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

function buildProductPage(template, product, allProducts) {
  const slug = `${slugify(product.name)}-${product.id}`;
  const canonical = `https://example.com/products/${slug}/`;
  const meta = `${product.name} — ${money(product.price)} at I&A Jewels. Explore the product and enquire on WhatsApp.`;
  const image = `https://example.com${product.images[0]}`;

  const gallery = `
    <div class="product-gallery__hero">
      <img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" width="1200" height="1500">
    </div>`;

  const moreImages = product.images.length > 1 ? `
    <section class="more-images">
      <h2>More images</h2>
      <div class="more-images__grid">
        ${product.images.slice(1).map((src, i) => `
          <img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)} — image ${i + 2}" loading="lazy" width="800" height="1000">
        `).join("")}
      </div>
    </section>` : "";

  const variants = product.variants?.length ? `
    <fieldset class="variant-group" id="variants">
      <legend>Choose an option</legend>
      <div class="variant-options">
        ${product.variants.map(v => `
          <button class="variant-option" type="button" data-variant="${escapeHtml(v.name)}" aria-pressed="false">
            ${escapeHtml(v.name)}${v.price !== undefined ? ` — ${money(v.price)}` : ""}
          </button>
        `).join("")}
      </div>
    </fieldset>` : "";

  const description = product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : "";

  const related = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const relatedSection = related.length ? `
    <section class="related">
      <h2>You may also like</h2>
      <div class="related__grid">
        ${related.map(p => {
          const pslug = `${slugify(p.name)}-${p.id}`;
          return `
            <a class="related-card" href="/products/${pslug}/">
              <img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.name)}" loading="lazy" width="800" height="1000">
              <p>${escapeHtml(p.name)}</p>
              <span>${money(p.price)}</span>
            </a>`;
        }).join("")}
      </div>
    </section>` : "";

  const structured = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map(x => `https://example.com${x}`),
    description: product.description || `${product.name} from I&A Jewels.`,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: canonical
    }
  }).replaceAll("<", "\\u003c");

  let output = template
    .replaceAll("{{TITLE}}", `${escapeHtml(product.name)} | I&A Jewels`)
    .replaceAll("{{NAME}}", escapeHtml(product.name))
    .replaceAll("{{PRICE}}", money(product.price))
    .replaceAll("{{CATEGORY_LABEL}}", categoryLabels[product.category])
    .replaceAll("{{GALLERY}}", gallery)
    .replaceAll("{{VARIANTS}}", variants)
    .replaceAll("{{DESCRIPTION}}", description)
    .replaceAll("{{MORE_IMAGES}}", moreImages)
    .replaceAll("{{RELATED}}", relatedSection)
    .replaceAll("{{META_DESCRIPTION}}", escapeHtml(meta))
    .replaceAll("{{CANONICAL_URL}}", canonical)
    .replaceAll("{{OG_TITLE}}", `${escapeHtml(product.name)} | I&A Jewels`)
    .replaceAll("{{OG_IMAGE}}", image)
    .replaceAll("{{STRUCTURED_DATA}}", structured)
    .replaceAll("{{WHATSAPP_URL}}", "#");

  output = output.replace(
    '<script type="module" src="/js/product.js"></script>',
    `<script>window.__PRODUCT_ID__ = ${JSON.stringify(product.id)};</script>\n  <script type="module" src="/js/product.js"></script>`
  );

  const target = path.join(dist, "products", slug, "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output);
  return { slug, canonical };
}

function main() {
  cleanDist();

  // Copy maintained static assets and CSS/JS/data into production output.
  copyDir(path.join(src, "assets"), path.join(dist, "assets"));
  copyDir(path.join(src, "css"), path.join(dist, "css"));
  copyDir(path.join(src, "js"), path.join(dist, "js"));
  copyDir(path.join(src, "data"), path.join(dist, "data"));

  // Copy landing and catalogue pages.
  fs.copyFileSync(path.join(src, "index.html"), path.join(dist, "index.html"));
  fs.mkdirSync(path.join(dist, "catalogue"), { recursive: true });
  fs.copyFileSync(path.join(src, "catalogue/index.html"), path.join(dist, "catalogue/index.html"));

  const products = loadProducts();
  validate(products);

  const template = fs.readFileSync(path.join(src, "templates/product.html"), "utf8");
  const pages = products.map(p => buildProductPage(template, p, products));

  const sitemapUrls = [
    "https://example.com/",
    "https://example.com/catalogue/",
    ...pages.map(p => p.canonical)
  ];

  fs.writeFileSync(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`);

  fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
`);

  console.log(`Build successful: ${products.length} products, ${pages.length} product pages.`);
}

main();
