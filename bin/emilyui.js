#!/usr/bin/env node

const path = require("path");

const command = process.argv[2];
const packageJson = require(path.join(__dirname, "..", "package.json"));
const usageText = `
  emily-css — Config-driven CSS framework generator

  Usage:
    emily-css init        Set up a new project
    emily-css build       Generate production CSS to the configured output path
    emily-css watch       Dev mode: rebuild on changes
    emily-css doctor      Scan project files for unknown EmilyCSS classes
    emily-css migrate     Generate a Tailwind-to-EmilyCSS migration report
      --import-colours    Detect Tailwind colour palettes and suggest importedPalettes config
    emily-css showcase    Browse components in your browser
    emily-css help        Full command reference

  Run emily-css help for more detail.
`;

if (command === "init") {
  require("../src/init.js");
} else if (command === "build") {
  const { build } = require("../src/index.js");
  build({ keepFull: process.argv.includes("--keep-full") });
} else if (command === "watch") {
  require("../src/watch.js");
} else if (command === "showcase") {
  require("../src/showcase.js");
} else if (command === "doctor") {
  const { doctor } = require("../src/doctor.js");
  const result = doctor();
  process.exitCode = result.exitCode;
} else if (command === "migrate") {
  const { generateMigrationReport } = require("../src/migrate.js");
  const { formatMigrationReport } = require("../src/reporters/migrationReporter.js");
  const importColours = process.argv.includes("--import-colours");
  const report = generateMigrationReport({ importColours });
  console.log(formatMigrationReport(report, { importColours }));
} else if (command === "version" || command === "--version" || command === "-v") {
  console.log(packageJson.version);
} else if (command === "help") {
  console.log(`
  emily-css — Config-driven CSS framework generator
  
  Commands:
    emily-css init        Set up a new project (interactive wizard)
    emily-css build       Generate production CSS to the configured output path
    emily-css watch       Dev mode: watch for changes and rebuild
    emily-css doctor      Scan project files for unknown EmilyCSS classes
    emily-css migrate     Generate a Tailwind-to-EmilyCSS migration report
      --import-colours    Detect Tailwind colour palettes and suggest importedPalettes config
    emily-css showcase    Launch the component showcase in your browser
    emily-css version     Show installed version
    emily-css help        Show this help text
  
  npm scripts (added by init):
    npm run emily:build      Same as emily-css build
    npm run emily:watch      Same as emily-css watch
    npm run emily:showcase   Same as emily-css showcase
    npm run emily:help       Same as emily-css help
  
  Docs: https://emilyui.dev
`);
} else {
  if (!command) {
    console.log(usageText);
  } else {
    console.error(`Unknown command: ${command}`);
    console.log(usageText);
    process.exitCode = 1;
  }
}
