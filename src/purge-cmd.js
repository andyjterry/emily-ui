const fs = require('fs');
const path = require('path');

function runPurge() {
  const configPath = path.join(process.cwd(), 'emily.config.json');

  if (!fs.existsSync(configPath)) {
    console.error('\n  emily-css: No config found. Run "emily-css init" first.\n');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const sourceDir = config.purge && config.purge.sourceDir;

  if (!sourceDir) {
    console.error('\n  emily-css: No purge sourceDir in emily.config.json.');
    console.error('  Add: "purge": { "sourceDir": "./src" }\n');
    process.exit(1);
  }

  const cssPath = path.join(process.cwd(), 'dist/emily.css');

  if (!fs.existsSync(cssPath)) {
    console.error('\n  emily-css: No CSS found. Run "emily-css build" first.\n');
    process.exit(1);
  }

  const { purgeCSS } = require('./purge.js');

  console.log('\nPurging unused utilities from ' + sourceDir + '...');

  const css = fs.readFileSync(cssPath, 'utf8');
  const purged = purgeCSS(css, sourceDir, config);
  const minified = purged
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s?\{/g, '{')
    .replace(/\s?\}/g, '}')
    .replace(/;\s/g, ';')
    .trim();

  fs.writeFileSync(path.join(process.cwd(), 'dist/emily.purged.css'), purged);
  fs.writeFileSync(path.join(process.cwd(), 'dist/emily.purged.min.css'), minified);

  const original = Buffer.byteLength(css, 'utf8');
  const purgedSize = Buffer.byteLength(purged, 'utf8');
  const reduction = Math.round((1 - purgedSize / original) * 100);

  console.log('\n\u2713 Purged CSS written:');
  console.log('  dist/emily.purged.css');
  console.log('  dist/emily.purged.min.css');
  console.log('\n  ' + Math.round(original / 1024) + 'KB -> ' + Math.round(purgedSize / 1024) + 'KB (' + reduction + '% reduction)\n');
}

runPurge();
