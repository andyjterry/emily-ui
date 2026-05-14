function pushListSection(lines, title, items, limit = 20) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  lines.push('', `${title}:`);
  items.slice(0, limit).forEach((item) => {
    lines.push(`  - ${item}`);
  });

  if (items.length > limit) {
    lines.push(`  ...and ${items.length - limit} more`);
  }
}

function formatMigrationReport(report, options = {}) {
  const importColours = options.importColours === true;
  const lines = [
    '',
    'EmilyCSS migration report',
    `  Files scanned: ${report.files.length}`,
    `  Total classes found: ${report.found.length}`,
    `  Supported EmilyCSS classes: ${report.supported.length}`,
    `  Known Tailwind classes: ${report.knownTailwind.length}`,
    `  Suggested replacements: ${report.replacements.length}`,
    `  Unsupported classes: ${report.unsupported.length}`,
  ];

  if (importColours) {
    lines.push(`  Migration mode: imported-palettes`);
    lines.push(`  Imported palettes detected: ${report.importedPalettes.length}`);
  } else {
    lines.push(`  Migration mode: semantic`);
  }

  pushListSection(
    lines,
    'Suggested replacements',
    report.replacements.map((entry) => `${entry.from} -> ${entry.to}`),
  );

  pushListSection(lines, 'Unsupported classes', report.unsupported);
  pushListSection(lines, 'Unsupported arbitrary value utilities detected', report.arbitraryValueUtilities);

  if (report.warnings.length > 0) {
    lines.push('', 'Warnings:');
    report.warnings.forEach((warning) => {
      lines.push(`  - ${warning}`);
    });
  }

  if (importColours) {
    pushListSection(
      lines,
      'Imported palette colour mappings',
      report.importedPaletteMappings.map((entry) => `${entry.from} -> ${entry.to}`),
    );

    if (report.importedPalettesConfig) {
      lines.push('', 'Suggested importedPalettes config:');
      lines.push(report.importedPalettesConfig);
    }
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  formatMigrationReport,
};
