// new version

const fs = require('fs');
const path = require('path');

function getAllFiles(dir, extensions = ['.html', '.htm', '.twig', '.njk', '.liquid', '.hbs', '.jsx', '.tsx', '.vue', '.php', '.astro', '.svelte', '.blade.php', '.jinja', '.jinja2', '.j2', '.md']) {
  let files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
  }

  return files;
}

function extractClassNames(content) {
  const classNames = new Set();
  const classRegex = /class\s*=\s*["']([^"']+)["']/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    const classes = match[1].split(/\s+/);
    classes.forEach(cls => {
      if (cls.trim()) classNames.add(cls.trim());
    });
  }

  const vueRegex = /(?::class|class\.|v-bind:class)\s*=\s*["'{]([^"'}]+)["'}]/g;
  while ((match = vueRegex.exec(content)) !== null) {
    const classes = match[1].split(/[\s,]+/);
    classes.forEach(cls => {
      const cleaned = cls.replace(/['"`{}"]/g, '').trim();
      if (cleaned) classNames.add(cleaned);
    });
  }

  return classNames;
}

function extractBlocks(css) {
  const blocks = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < css.length; i++) {
    current += css[i];
    if (css[i] === '{') {
      depth++;
    } else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        blocks.push(current.trim());
        current = '';
      }
    }
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

function purgeBlock(block, usedClasses) {
  if (
    block.startsWith(':root') || 
    block.startsWith('*,') || 
    block.startsWith('html') || 
    block.startsWith('body') ||
    block.startsWith('@layer theme,') // Keep layer definition
  ) {
    return block;
  }

  if (block.startsWith('@') && block.includes('{')) {
    const firstBrace = block.indexOf('{');
    const lastBrace = block.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) return block;

    const wrapperSignature = block.substring(0, firstBrace + 1);
    const innerContent = block.substring(firstBrace + 1, lastBrace);

    const innerBlocks = extractBlocks(innerContent);
    const purgedInner = innerBlocks
      .map(b => purgeBlock(b, usedClasses))
      .filter(b => b.trim() !== '')
      .join('\n  ');

    if (!purgedInner.trim()) return '';

    return `${wrapperSignature}\n  ${purgedInner}\n}`;
  }

  const selectorPart = block.split('{')[0];
  if (!selectorPart) return '';

  const cleanSelectorPart = selectorPart.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const selectors = cleanSelectorPart.split(',').map(s => s.trim());

  const isUsed = selectors.some(selector => {
    if (!selector.includes('.')) return true;

    for (const used of usedClasses) {
      const escapedUsed = used.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:/g, '\\\\:');
      const boundaryRegex = new RegExp(`\\.${escapedUsed}(?::[\\w\\-]+|[\\s,>+~]|$)`);
      if (boundaryRegex.test(selector)) return true;
    }
    return false;
  });

  return isUsed ? block : '';
}

function purgeCSS(css, scanDir, config) {
  const extensions = config && config.purge && config.purge.extensions
    ? config.purge.extensions
    : ['.html', '.htm', '.njk', '.liquid', '.hbs', '.jsx', '.tsx', '.vue', '.php', '.astro', '.svelte', '.blade.php'];

  console.log(`\n🔍 Scanning for files in: ${scanDir}`);
  console.log(`   Extensions: ${extensions.join(', ')}`);

  const files = getAllFiles(scanDir, extensions);

  // Show per-extension breakdown so missing extensions are immediately obvious
  const countsByExt = {};
  for (const ext of extensions) countsByExt[ext] = 0;
  for (const file of files) {
    const ext = extensions.find(e => file.endsWith(e)) || 'other';
    countsByExt[ext] = (countsByExt[ext] || 0) + 1;
  }
  const extSummary = Object.entries(countsByExt)
    .filter(([, count]) => count > 0)
    .map(([ext, count]) => `${count} ${ext}`)
    .join(', ');
  console.log(`   Found: ${files.length === 0 ? 'no files' : extSummary}`);

  if (files.length === 0) {
    console.warn('   ⚠️  No template files found. Check that --purge points to the right directory and extensions are configured.');
    console.warn(`   Expected extensions: ${extensions.join(', ')}`);
    return css;
  }

  const usedClasses = new Set();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const classes = extractClassNames(content);
      classes.forEach(cls => usedClasses.add(cls));
    } catch (err) {
      console.warn(`   ⚠️  Could not read ${file}: ${err.message}`);
    }
  }

  console.log(`   Extracted ${usedClasses.size} unique class names from HTML`);

  const blocks = extractBlocks(css);
  const purgedBlocks = blocks
    .map(block => purgeBlock(block, usedClasses))
    .filter(block => block.trim() !== '');

  const purgedCss = purgedBlocks.join('\n\n');
  
  const beforeSize = (css.length / 1024).toFixed(2);
  const afterSize = (purgedCss.length / 1024).toFixed(2);
  const reduction = (((css.length - purgedCss.length) / css.length) * 100).toFixed(1);

  console.log(`\n📦 Purge results:`);
  console.log(`   Before: ${beforeSize} KB`);
  console.log(`   After:  ${afterSize} KB`);
  console.log(`   Reduction: ${reduction}%`);

  return purgedCss;
}

module.exports = { purgeCSS, getAllFiles, extractClassNames };