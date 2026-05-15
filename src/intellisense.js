function toIntellisenseUtility(utility) {
  return {
    class: utility.class || null,
    category: utility.category || null,
    property: utility.property || null,
    value: utility.value || null,
    token: utility.token || null,
    variants: Array.isArray(utility.variants) ? utility.variants : [],
  };
}

function generateIntellisense(manifest) {
  const utilities = Array.isArray(manifest && manifest.utilities)
    ? manifest.utilities
    : [];

  return {
    version: "1",
    generatedAt:
      (manifest && manifest.generatedAt) || new Date().toISOString(),
    utilities: utilities.map(toIntellisenseUtility),
  };
}

module.exports = {
  generateIntellisense,
};
