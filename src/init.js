const fs = require("fs");
const path = require("path");
const crossSpawn = require("cross-spawn");
const { Select, Input, Confirm } = require("enquirer");
const chalk = require("chalk");
const ora = require("ora");
const boxen = require("boxen");

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PURGE_IGNORE = [
  "node_modules",
  ".git",
  ".nuxt",
  ".next",
  ".output",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".vite",
];

const COLOUR_PRESETS = {
  primary: [
    { value: "custom", label: "Enter your own hex" },
    { value: "#DB2777", label: "Emily Pink" },
    { value: "#2563EB", label: "Blue" },
    { value: "#028090", label: "Teal" },
    { value: "#114B5F", label: "Deep Teal" },
    { value: "#15803D", label: "Green" },
    { value: "#7C3AED", label: "Purple" },
    { value: "#E05C00", label: "Burnt Orange" },
  ],
  secondary: [
    { value: "custom", label: "Enter your own hex" },
    { value: "#2563EB", label: "Blue" },
    { value: "#028090", label: "Teal" },
    { value: "#7C3AED", label: "Purple" },
    { value: "#DB2777", label: "Emily Pink" },
    { value: "#F59E0B", label: "Amber" },
    { value: "#57534E", label: "Warm Grey" },
  ],
  success: [
    { value: "#017F65", label: "Accessible Green (recommended)" },
    { value: "#15803D", label: "Forest Green" },
    { value: "custom", label: "Enter your own hex" },
  ],
  warning: [
    { value: "#FFC107", label: "Amber (recommended)" },
    { value: "#F59E0B", label: "Orange Amber" },
    { value: "custom", label: "Enter your own hex" },
  ],
  error: [
    { value: "#B20000", label: "Accessible Red (recommended)" },
    { value: "#DC2626", label: "Red" },
    { value: "custom", label: "Enter your own hex" },
  ],
};

const FONT_OPTIONS = [
  { name: "lexend", message: "Lexend (clear, accessible - recommended)" },
  { name: "inter", message: "Inter (clean, widely used)" },
  { name: "dm-sans", message: "DM Sans (modern, geometric)" },
  { name: "nunito", message: "Nunito (friendly, rounded)" },
  { name: "atkinson", message: "Atkinson Hyperlegible (maximum legibility)" },
  { name: "system", message: "System sans-serif (no download required)" },
];

const PURGE_EXTENSIONS = [
  ".html",
  ".htm",
  ".twig",
  ".njk",
  ".liquid",
  ".hbs",
  ".jsx",
  ".tsx",
  ".vue",
  ".php",
  ".astro",
  ".svelte",
  ".blade.php",
  ".jinja",
  ".jinja2",
  ".j2",
  ".md",
];

// ============================================================================
// HELPERS
// ============================================================================

function isValidHex(hex) {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

function colourSwatch(hex) {
  return chalk.hex(hex)("■");
}

async function askHex(promptName, message, initial) {
  const value = await new Input({
    name: promptName,
    message,
    initial: initial || "#000000",
    validate(value) {
      return isValidHex(value) ? true : "Enter a valid hex colour, e.g. #0077B6";
    },
  }).run();
  return value.toUpperCase();
}

async function askColourFromPresets(label, presets, defaultHex) {
  const choices = presets.map(function(opt) {
    if (opt.value === "custom") {
      return { name: "custom", message: "Enter your own hex" };
    }
    return {
      name: opt.value,
      message: colourSwatch(opt.value) + " " + opt.label + " " + chalk.gray(opt.value),
    };
  });

  const selected = await new Select({
    name: label,
    message: label + " colour",
    choices: choices,
  }).run();

  if (selected !== "custom") return selected.toUpperCase();
  return askHex(label + "Custom", "Enter " + label + " hex", defaultHex);
}

async function askBtnColour(label, matchLabel, matchHex, presets) {
  const sameChoice = {
    name: matchHex,
    message: colourSwatch(matchHex) + " Same as " + matchLabel + " " + chalk.gray(matchHex),
  };

  const otherChoices = presets
    .filter(function(opt) { return opt.value !== matchHex; })
    .map(function(opt) {
      if (opt.value === "custom") {
        return { name: "custom", message: "Enter your own hex" };
      }
      return {
        name: opt.value,
        message: colourSwatch(opt.value) + " " + opt.label + " " + chalk.gray(opt.value),
      };
    });

  const selected = await new Select({
    name: label,
    message: label + " colour",
    choices: [sameChoice].concat(otherChoices),
  }).run();

  if (selected !== "custom") return selected.toUpperCase();
  return askHex(label + "Custom", "Enter " + label + " hex", matchHex);
}

function hasFile(fileName) {
  return fs.existsSync(path.join(process.cwd(), fileName));
}

function readPackageJson() {
  const packagePath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packagePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(packagePath, "utf8"));
  } catch {
    return null;
  }
}

function hasDependency(packageJson, dependencyName) {
  if (!packageJson) return false;
  return Boolean(
    packageJson.dependencies?.[dependencyName] ||
    packageJson.devDependencies?.[dependencyName],
  );
}

function addEmilyScriptsToPackageJson() {
  const packagePath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packagePath)) return false;
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    packageJson.scripts = packageJson.scripts || {};
    let changed = false;
    const scripts = {
      "emily:build": "emily-css build",
      "emily:watch": "emily-css watch",
      "emily:help": "emily-css help",
      "emily:showcase": "emily-css showcase",
    };
    for (const [key, val] of Object.entries(scripts)) {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = val;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
    }
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// PROJECT DETECTION
// ============================================================================

function detectProject() {
  const packageJson = readPackageJson();

  if (
    hasFile("nuxt.config.ts") ||
    hasFile("nuxt.config.js") ||
    hasDependency(packageJson, "nuxt")
  ) {
    return {
      name: "Nuxt",
      sourceDir: ".",
      sourceGlobs: [
        "./components/**/*.{vue,js,ts}",
        "./pages/**/*.vue",
        "./layouts/**/*.vue",
        "./app.vue",
      ],
    };
  }

  if (hasDependency(packageJson, "next")) {
    return {
      name: "Next.js",
      sourceDir: ".",
      sourceGlobs: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./pages/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
      ],
    };
  }

  if (hasDependency(packageJson, "react")) {
    return {
      name: "React",
      sourceDir: "./src",
      sourceGlobs: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
      ],
    };
  }

  if (
    hasDependency(packageJson, "vue") ||
    hasFile("vite.config.ts") ||
    hasFile("vite.config.js")
  ) {
    return {
      name: "Vue/Vite",
      sourceDir: "./src",
      sourceGlobs: ["./src/**/*.{vue,js,ts}"],
    };
  }

  if (hasDependency(packageJson, "astro") || hasFile("astro.config.mjs")) {
    return {
      name: "Astro",
      sourceDir: "./src",
      sourceGlobs: ["./src/**/*.{astro,html,js,ts,vue,jsx,tsx,svelte}"],
    };
  }

  const rootFiles = fs.readdirSync(process.cwd());
  const hasDrupalInfoFile = rootFiles.some((file) =>
    file.endsWith(".info.yml"),
  );

  if (
    hasDrupalInfoFile ||
    fs.existsSync(path.join(process.cwd(), "web/core"))
  ) {
    return {
      name: "Drupal",
      sourceDir: ".",
      sourceGlobs: [
        "./web/themes/custom/**/*.{twig,js,ts}",
        "./templates/**/*.html.twig",
        "./components/**/*.twig",
        "./**/*.theme",
      ],
    };
  }

  return {
    name: "Static/Generic",
    sourceDir: ".",
    sourceGlobs: [
      "./**/*.{html,htm,twig,njk,liquid,hbs,php,astro,svelte,vue,js,ts}",
    ],
  };
}

// ============================================================================
// CONFIG BUILDER
// ============================================================================

function createDefaultConfig({
  name,
  colours,
  headingFont,
  bodyFont,
  baseUnit,
  detectedProject,
  sourceDir,
}) {
  return {
    name,
    description: name + " design system",

    baseUnit: baseUnit + "px",
    baseFontSize: "16px",

    fontFamily: {
      heading: headingFont,
      body: bodyFont,
    },

    customFonts: [],

    colours,

    purge: {
      projectType: detectedProject.name,
      sourceDir,
      sourceGlobs: detectedProject.sourceGlobs,
      ignore: DEFAULT_PURGE_IGNORE,
      extensions: PURGE_EXTENSIONS,
    },

    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    spacing: {
      scale: {
        0: "0px",
        px: "1px",
        0.5: "0.125rem",
        1: "0.25rem",
        1.5: "0.375rem",
        2: "0.5rem",
        2.5: "0.625rem",
        3: "0.75rem",
        3.5: "0.875rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        7: "1.75rem",
        8: "2rem",
        9: "2.25rem",
        10: "2.5rem",
        11: "2.75rem",
        12: "3rem",
        14: "3.5rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
        28: "7rem",
        32: "8rem",
        36: "9rem",
        40: "10rem",
        44: "11rem",
        48: "12rem",
        52: "13rem",
        56: "14rem",
        60: "15rem",
        64: "16rem",
        72: "18rem",
        80: "20rem",
        96: "24rem",
      },

      borderWidths: [0, 2, 4, 8],

      borderRadius: {
        none: "0",
        sm: "4px",
        base: "8px",
        md: "12px",
        lg: "16px",
        full: "9999px",
      },
    },

    typography: {
      lineHeightRatio: 1.5,

      fontWeights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },

      fontSizes: [
        { name: "xs", value: "12px", lineHeight: 1.5 },
        { name: "sm", value: "14px", lineHeight: 1.5 },
        { name: "base", value: "16px", lineHeight: 1.6 },
        { name: "lg", value: "18px", lineHeight: 1.6 },
        { name: "xl", value: "20px", lineHeight: 1.6 },
        { name: "2xl", value: "24px", lineHeight: 1.4 },
        { name: "3xl", value: "30px", lineHeight: 1.4 },
        { name: "4xl", value: "36px", lineHeight: 1.3 },
      ],
    },

    shadows: {
      sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
      base: "0 4px 6px rgba(0, 0, 0, 0.1)",
      md: "0 10px 15px rgba(0, 0, 0, 0.1)",
      lg: "0 20px 25px rgba(0, 0, 0, 0.15)",
      none: "none",
    },

    transitions: {
      fast: "100ms",
      base: "200ms",
      slow: "300ms",
      timing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },

    zIndex: {
      auto: "auto",
      0: "0",
      10: "10",
      20: "20",
      30: "30",
      40: "40",
      50: "50",
      dropdown: "1000",
      sticky: "1020",
      fixed: "1030",
      modal: "1040",
      popover: "1060",
      tooltip: "1070",
    },

    opacity: [0, 5, 10, 25, 50, 75, 90, 95, 100],
  };
}

// ============================================================================
// INIT
// ============================================================================

async function init() {
  console.log(chalk.bold.magenta("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.bold.magenta("  EmilyUI Setup"));
  console.log(chalk.bold.magenta("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  try {
    const spinner = ora("Analysing project structure...").start();
    const detectedProject = detectProject();
    spinner.succeed("Detected project: " + chalk.cyan(detectedProject.name));

    // Derive a sensible default name from package.json if available
    const packageJsonData = readPackageJson();
    const pkgName = packageJsonData && packageJsonData.name
      ? packageJsonData.name.replace(/-/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); })
      : "My Design System";

    const projectName = await new Input({
      name: "projectName",
      message: "Project name",
      initial: pkgName,
      validate: function(v) { return v.trim() ? true : "Project name is required"; },
    }).run();

    if (!projectName || !projectName.trim()) {
      console.log(chalk.red("\nProject name is required.\n"));
      process.exit(1);
    }

    // =========================================================================
    // COLOURS
    // =========================================================================

    console.log(chalk.bold("\n" + chalk.magenta("→") + " Brand colours"));

    const primary = await askColourFromPresets("primary", COLOUR_PRESETS.primary, "#DB2777");
    const secondary = await askColourFromPresets("secondary", COLOUR_PRESETS.secondary, "#2563EB");
    const btnPrimary = await askBtnColour("btn-primary", "primary", primary, COLOUR_PRESETS.primary);
    const btnSecondary = await askBtnColour("btn-secondary", "secondary", secondary, COLOUR_PRESETS.secondary);

    console.log(chalk.bold("\n" + chalk.magenta("→") + " Utility colours"));
    console.log(chalk.gray("  Defaults shown. Press enter to accept or pick an alternative.\n"));

    const success = await askColourFromPresets("success", COLOUR_PRESETS.success, "#017F65");
    const warning = await askColourFromPresets("warning", COLOUR_PRESETS.warning, "#FFC107");
    const error = await askColourFromPresets("error", COLOUR_PRESETS.error, "#B20000");

    const colours = {
      primary: primary,
      secondary: secondary,
      "btn-primary": btnPrimary,
      "btn-secondary": btnSecondary,
      success: success,
      warning: warning,
      error: error,
      neutral: "#57534E",
    };

    // Additional utility colours
    let addingMore = true;
    while (addingMore) {
      const wantsMore = await new Confirm({
        name: "addMore",
        message: "Add another utility colour?",
        initial: false,
      }).run();

      if (!wantsMore) {
        addingMore = false;
        break;
      }

      const customName = await new Input({
        name: "customName",
        message: "Colour name (e.g. accent, highlight, brand-dark)",
        validate: function(value) {
          const trimmed = value.trim();
          if (!trimmed) return "Name is required";
          if (!/^[a-z][a-z0-9-]*$/.test(trimmed)) return "Use lowercase letters, numbers, and hyphens only";
          if (colours[trimmed]) return '"' + trimmed + '" is already defined';
          return true;
        },
      }).run();

      colours[customName.trim()] = await askHex("hex-" + customName, "Hex for " + customName, "#000000");
    }

    // =========================================================================
    // TYPOGRAPHY
    // =========================================================================

    console.log(chalk.bold("\n" + chalk.magenta("→") + " Typography"));

    const headingFont = await new Select({
      name: "headingFont",
      message: "Heading font",
      choices: FONT_OPTIONS,
      initial: 0,
    }).run();

    const bodyFont = await new Select({
      name: "bodyFont",
      message: "Body font",
      choices: FONT_OPTIONS,
      initial: 1,
    }).run();

    // =========================================================================
    // SPACING
    // =========================================================================

    const baseUnitRaw = await new Input({
      name: "baseUnit",
      message: "Base spacing unit in px (18px = 1.125rem)",
      initial: "18",
      validate: function(value) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed <= 0) return "Must be a positive number.";
        return true;
      },
    }).run();

    const baseUnit = Number.parseInt(baseUnitRaw, 10);

    // =========================================================================
    // PURGE
    // =========================================================================

    console.log(chalk.bold("\n" + chalk.magenta("→") + " Purge settings"));

    const sourceDirRaw = await new Input({
      name: "sourceDir",
      message: "Detected " + detectedProject.name + " — scan directory",
      initial: detectedProject.sourceDir,
    }).run();

    // =========================================================================
    // BUILD
    // =========================================================================

    const config = createDefaultConfig({
      name: projectName.trim(),
      colours: colours,
      headingFont: headingFont,
      bodyFont: bodyFont,
      baseUnit: baseUnit,
      detectedProject: detectedProject,
      sourceDir: sourceDirRaw.trim() || detectedProject.sourceDir,
    });

    const configPath = path.join(process.cwd(), "emily.config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log("");
    const buildSpinner = ora("Building EmilyUI CSS...").start();

    const build = crossSpawn("npx", ["emily-css", "build"], {
      cwd: process.cwd(),
      stdio: "pipe",
      shell: process.platform === "win32",
    });

    let stderr = "";
    build.stderr.on("data", function(data) { stderr += data.toString(); });

    build.on("close", async function(code) {
      if (code === 0) {
        buildSpinner.succeed("EmilyUI CSS built successfully.");

        const scriptsAdded = addEmilyScriptsToPackageJson();

        console.log(
          "\n" +
          boxen(
            chalk.green.bold("Setup complete") +
            "\n\nConfig:   " + chalk.cyan("emily.config.json") +
            "\nOutput:   " + chalk.cyan("dist/emily.min.css") +
            "\nProject:  " + chalk.cyan(detectedProject.name) +
            "\nScan:     " + chalk.cyan(config.purge.sourceDir) +
            "\n\nNext: link " + chalk.yellow("dist/emily.min.css") + " in your project." +
            (scriptsAdded
              ? "\n\nScripts added:\n" +
                chalk.cyan("  npm run emily:build\n") +
                chalk.cyan("  npm run emily:watch\n") +
                chalk.cyan("  npm run emily:showcase\n") +
                chalk.cyan("  npm run emily:help")
              : ""),
            { padding: 1, margin: 1, borderStyle: "round", borderColor: "magenta" },
          ),
        );

        const startWatch = await new Confirm({
          name: "startWatch",
          message: "Start the file watcher now?",
          initial: true,
        }).run();

        if (startWatch) {
          console.log(chalk.cyan("\nStarting watcher — press Ctrl+C to stop.\n"));
          const watcher = crossSpawn("npx", ["emily-css", "watch"], {
            cwd: process.cwd(),
            stdio: "inherit",
            shell: process.platform === "win32",
          });
          watcher.on("close", function(c) { process.exit(c || 0); });
        } else {
          console.log(chalk.gray("\nRun the watcher any time with: npm run emily:watch\n"));
          process.exit(0);
        }
      } else {
        buildSpinner.fail("Automatic build failed.");
        console.log("\nYour config was created, but CSS was not built.");
        console.log("\nRun manually:\n");
        console.log(chalk.cyan("  npx emily-css build"));
        if (stderr.trim()) {
          console.log(chalk.gray("\nBuild error:\n"));
          console.log(stderr.trim());
        }
        process.exit(1);
      }
    });

    build.on("error", function(error) {
      buildSpinner.fail("Automatic build failed.");
      console.log("\nYour config was created, but CSS was not built.");
      console.log("Reason: " + error.message);
      console.log("\nRun manually:\n");
      console.log(chalk.cyan("  npx emily-css build\n"));
      process.exit(1);
    });

  } catch (error) {
    console.log(chalk.red("\nSetup cancelled or failed."));
    if (error && error.message) {
      console.log(chalk.gray(error.message));
    }
    process.exit(1);
  }
}

init();
