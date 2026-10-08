import { products } from "/data/products.js";
import { siteConfig } from "/data/config.js";
import { createWhatsAppUrl, generateWhatsAppMessage } from "/js/whatsapp.js";

const product = products.find(item => item.id === window.__PRODUCT_ID__);

if (!product) {
  window.location.href = "/catalogue/";
} else {
  const button = document.querySelector("[data-whatsapp]");
  let selectedVariant = null;

  function updateButton() {
    const needsVariant = Array.isArray(product.variants) && product.variants.length > 0;
    if (needsVariant && !selectedVariant) {
      button.setAttribute("aria-disabled", "true");
      button.textContent = "Select an option";
      button.href = "#variants";
      return;
    }
    button.removeAttribute("aria-disabled");
    button.textContent = "Enquire / Order";
    button.href = createWhatsAppUrl(
      siteConfig.whatsappNumber,
      generateWhatsAppMessage(product, selectedVariant)
    );
  }

  document.querySelectorAll("[data-variant]").forEach(option => {
    option.addEventListener("click", () => {
      selectedVariant = product.variants.find(v => v.name === option.dataset.variant) || null;
      document.querySelectorAll("[data-variant]").forEach(item => {
        item.setAttribute("aria-pressed", String(item === option));
      });
      updateButton();
    });
  });

  updateButton();
}
