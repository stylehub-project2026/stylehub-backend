// backend/utils/slugify.js
// Converts a brand name (any language/format) into a URL-safe slug.
// Examples:
//   "Girl Fashionesta"  → "girlfashionesta"
//   "Salty & Co."       → "saltyco"
//   "Black-Closet"      → "blackcloset"
//   "Café Noir"         → "cafenoir"
//   "  Antika  "        → "antika"

const slugify = (str) => {
    if (!str) return '';
    return str
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')                  // separates accents (é → e + ´)
        .replace(/[\u0300-\u036f]/g, '')   // removes accent marks
        .replace(/[^a-z0-9]+/g, '');       // removes anything that's not a letter/number
};

module.exports = slugify;
