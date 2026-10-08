import { products } from "/data/products.js";
import { saveBrowseState, restoreBrowseState } from "/js/navigation.js";

const categories = [
  { slug: "all", label: "All" },
  { slug: "earrings", label: "Earrings" },
  { slug: "bracelets", label: "Bracelets" },
  { slug: "necklaces", label: "Necklaces" },
  { slug: "headbands", label: "Headbands" },
  { slug: "scrunchies", label: "Scrunchies" },
  { slug: "rings", label: "Rings" },
  { slug: "lip-gloss", label: "Lip Gloss" }
];

const nav = document.querySelector(".category-nav");
const grid = document.querySelector(".product-grid");
const emptyState = document.querySelector(".empty-state");

function money(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

function renderCategories(active) {
  nav.innerHTML = categories.map(category => `
    <button class="category-button"
      type="button"
      data-category="${category.slug}"
      aria-current="${category.slug === active}">
      ${category.label}
    </button>
  `).join("");
}

function renderProducts(category) {
  const visible = category === "all"
    ? products
    : products.filter(product => product.category === category);

  emptyState.hidden = visible.length > 0;
  grid.innerHTML = visible.map(product => {
    const firstImage = product.images[0];
    const variantText = product.variants?.length
      ? `${product.variants.length} options`
      : "";

    return `
      <a class="product-card"
        href="/products/${product.slug}/"
        data-product-id="${product.id}">
        <div class="product-card__image">
          <img src="${firstImage}" alt="${product.name}" loading="lazy" width="800" height="1000">
        </div>
        <div class="product-card__meta">
          <p class="product-card__name">${product.name}</p>
          <p class="product-card__price">${money(product.price)}</p>
          ${variantText ? `<p class="product-card__variant">${variantText}</p>` : ""}
        </div>
      </a>
    `;
  }).join("");
}

function setCategory(category, push = true) {
  const valid = categories.some(item => item.slug === category);
  const active = valid ? category : "all";
  renderCategories(active);
  renderProducts(active);

  if (push) {
    const url = new URL(window.location.href);
    if (active === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", active);
    history.pushState({ category: active }, "", url);
  }
}

nav.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  saveBrowseState({ category: button.dataset.category });
  setCategory(button.dataset.category);
});

grid.addEventListener("click", event => {
  const card = event.target.closest(".product-card");
  if (!card) return;
  const category = new URLSearchParams(window.location.search).get("category") || "all";
  saveBrowseState({ category });
});

window.addEventListener("popstate", () => {
  setCategory(new URLSearchParams(window.location.search).get("category") || "all", false);
});

const initialCategory = new URLSearchParams(window.location.search).get("category") || "all";
setCategory(initialCategory, false);
restoreBrowseState();
