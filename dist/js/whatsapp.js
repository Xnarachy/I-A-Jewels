export function generateWhatsAppMessage(product, selectedVariant = null) {
  const variantText = selectedVariant ? ` — ${selectedVariant.name}` : "";
  return `Hi, I'm interested in the ${product.name}${variantText}. Is it available?`;
}

export function createWhatsAppUrl(number, message) {
  const cleanNumber = String(number).replace(/[^\d]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
