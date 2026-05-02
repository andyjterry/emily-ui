const fs = require('fs');
const path = require('path');
const crossSpawn = require('cross-spawn');
const { Form, Select, Input } = require('enquirer');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PURGE_IGNORE = [
  'node_modules',
  '.git',
  '.nuxt',
  '.next',
  '.output',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.vite'
];

const DEFAULT_COLOURS = {
  primary: '#DB2777',
  secondary: '#2563EB',
  success: '#017F65',
  warning: '#FFC107',
  error: '#B20000',
  neutral: '#57534E'
};

const COLOUR_PRESETS = {
  primary: [
    { value: '#DB2777', label: 'Emily Pink' },
    { value: '#114B5F', label: 'Deep Teal' },
    { value: '#2563EB', label: 'Blue' },
    { value: '#017F65', label: 'Green' },
    { value: 'custom', label: 'Custom hex' }
  ],
  secondary: [
    { value: '#2563EB', label: 'Blue' },
    { value: '#028090', label: 'Teal' },
    { value: '#7C3AED', label: 'Purple' },
    { value: '#DB2777', label: 'Emily Pink' },
    { value: 'custom', label: 'Custom hex' }
  ],
  success: [
    { value: '#017F65', label: 'Accessible Green' },
    { value: '#15803D', label: 'Forest Green' },
    { value: '#50C878', label: 'Emerald' },
    { value: 'custom', label: 'Custom hex' }
  ],
  warning: [
    { value: '#FFC107', label: 'Amber' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#FFBF00', label: 'Yellow' },
    { value: 'custom', label: 'Custom hex' }
  ],
  error: [
    { value: '#B20000', label: 'Accessible Red' },
    { value: '#DC2626', label: 'Red' },
    { value: '#F45B69', label: 'Coral' },
    { value: 'custom', label: 'Custom hex' }
  ],
  neutral: [
    { value: '#57534E', label: 'Warm Grey' },
    { value: '#334155', label: 'Slate' },
    { value: '#111827', label: 'Near Black' },
    { value: 'custom', label: 'Custom hex' }
  ]
};

const FONT_OPTIONS = [
  { name: 'lexend', message: 'Lexend' },
  { name: 'inter', message: 'Inter' },
  { name: 'system', message: 'System sans' },
  { name: 'georgia', message: 'Georgia' },
  { name: 'mono', message: 'Monospace' }
];

const PURGE_EXTENSIONS = [
  '.html',
  '.htm',
  '.twig',
  '.njk',
  '.liquid',
  '.hbs',
  '.jsx',
  '.tsx',
  '.vue',
  '.php',
  '.astro',
  '.svelte',
  '.blade.php',
  '.jinja',
  '.jinja2',
  '.j2',
  '.md'
];

// ============================================================================
// HELPERS
// ============================================================================

function isValidHex(hex) {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

function colourChoice(hex, label) {
  if (hex === 'custom') {
    return {
      name: 'custom',
      message: 'Custom hex'
    };
  }

  return {
    name: hex,
    message: `${chalk.hex(hex)('■')} ${label} ${chalk.gray(hex)}`
  };
}

async function askColour(colourName) {
  const choices = COLOUR_PRESETS[colourName].map(option =>
    colourChoice(option.value, option.label)
  );

  const selected = await new Select({
    name: colourName,
    message: `${colourName} colour`,
    choices
  }).run();

  if (selected !== 'custom') {
    return selected.toUpperCase();
  }

  const custom = await new Input({
    name: `${colourName}Custom`,
    message: `Enter custom ${colourName} hex`,
    initial: DEFAULT_COLOURS[colourName],
    validate(value) {
      return isValidHex(value)
        ? true
        : 'Enter a valid hex colour, for example #0077B6';
    }
  }).run();

  return custom.toUpperCase();
}

function hasFile(fileName) {
  return fs.existsSync(path.join(process.cwd(), fileName));
}

function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    return null;
  }
}

function hasDependency(packageJson, dependencyName) {
  if (!packageJson) return false;

  return Boolean(
    packageJson.dependencies?.[dependencyName] ||
    packageJson.devDependencies?.[dependencyName]
  );
}

// ============================================================================
// PROJECT DETECTION
// ============================================================================

function detectProject() {
  const packageJson = readPackageJson();

  if (
    hasFile('nuxt.config.ts') ||
    hasFile('nuxt.config.js') ||
    hasDependency(packageJson, 'nuxt')
  ) {
    return {
      name: 'Nuxt',
      sourceDir: '.',
      sourceGlobs: [
        './components/**/*.{vue,js,ts}',
        './pages/**/*.vue',
        './layouts/**/*.vue',
        './app.vue'
      ]
    };
  }

  if (hasDependency(packageJson, 'next')) {
    return {
      name: 'Next.js',
      sourceDir: '.',
      sourceGlobs: [
        './app/**/*.{js,jsx,ts,tsx}',
        './pages/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}'
      ]
    };
  }

  if (hasDependency(packageJson, 'react')) {
    return {
      name: 'React',
      sourceDir: './src',
      sourceGlobs: [
        './src/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}'
      ]
    };
  }

  if (
    hasDependency(packageJson, 'vue') ||
    hasFile('vite.config.ts') ||
    hasFile('vite.config.js')
  ) {
    return {
      name: 'Vue/Vite',
      sourceDir: './src',
      sourceGlobs: [
        './src/**/*.{vue,js,ts}'
      ]
    };
  }

  if (hasDependency(packageJson, 'astro') || hasFile('astro.config.mjs')) {
    return {
      name: 'Astro',
      sourceDir: './src',
      sourceGlobs: [
        './src/**/*.{astro,html,js,ts,vue,jsx,tsx,svelte}'
      ]
    };
  }

  const rootFiles = fs.readdirSync(process.cwd());
  const hasDrupalInfoFile = rootFiles.some(file => file.endsWith('.info.yml'));

  if (hasDrupalInfoFile || fs.existsSync(path.join(process.cwd(), 'web/core'))) {
    return {
      name: 'Drupal',
      sourceDir: '.',
      sourceGlobs: [
        './web/themes/custom/**/*.{twig,js,ts}',
        './templates/**/*.html.twig',
        './components/**/*.twig',
        './**/*.theme'
      ]
    };
  }

  return {
    name: 'Static/Generic',
    sourceDir: '.',
    sourceGlobs: [
      './**/*.{html,htm,twig,njk,liquid,hbs,php,astro,svelte,vue,js,ts}'
    ]
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
  monoFont,
  baseUnit,
  detectedProject,
  sourceDir
}) {
  return {
    name,
    description: `${name} design system`,

    baseUnit: `${baseUnit}px`,
    baseFontSize: '16px',

    fontFamily: {
      heading: headingFont,
      body: bodyFont,
      mono: monoFont
    },

    customFonts: [],

    colours,

    purge: {
      projectType: detectedProject.name,
      sourceDir,
      sourceGlobs: detectedProject.sourceGlobs,
      ignore: DEFAULT_PURGE_IGNORE,
      extensions: PURGE_EXTENSIONS
    },

    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },

    spacing: {
      scale: {
        '0': '0px',
        px: '1px',
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '2.5': '0.625rem',
        '3': '0.75rem',
        '3.5': '0.875rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '9': '2.25rem',
        '10': '2.5rem',
        '11': '2.75rem',
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '28': '7rem',
        '32': '8rem',
        '36': '9rem',
        '40': '10rem',
        '44': '11rem',
        '48': '12rem',
        '52': '13rem',
        '56': '14rem',
        '60': '15rem',
        '64': '16rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem'
      },

      borderWidths: [0, 2, 4, 8],

      borderRadius: {
        none: '0',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px'
      }
    },

    typography: {
      lineHeightRatio: 1.5,

      fontWeights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },

      fontSizes: [
        { name: 'xs', value: '12px', lineHeight: 1.5 },
        { name: 'sm', value: '14px', lineHeight: 1.5 },
        { name: 'base', value: '16px', lineHeight: 1.6 },
        { name: 'lg', value: '18px', lineHeight: 1.6 },
        { name: 'xl', value: '20px', lineHeight: 1.6 },
        { name: '2xl', value: '24px', lineHeight: 1.4 },
        { name: '3xl', value: '30px', lineHeight: 1.4 },
        { name: '4xl', value: '36px', lineHeight: 1.3 }
      ]
    },

    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      base: '0 4px 6px rgba(0, 0, 0, 0.1)',
      md: '0 10px 15px rgba(0, 0, 0, 0.1)',
      lg: '0 20px 25px rgba(0, 0, 0, 0.15)',
      none: 'none'
    },

    transitions: {
      fast: '100ms',
      base: '200ms',
      slow: '300ms',
      timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },

    zIndex: {
      auto: 'auto',
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
      dropdown: '1000',
      sticky: '1020',
      fixed: '1030',
      modal: '1040',
      popover: '1060',
      tooltip: '1070'
    },

    opacity: [0, 5, 10, 25, 50, 75, 90, 95, 100]
  };
}

// ============================================================================
// INIT
// ============================================================================

async function init() {
  console.log(chalk.bold.magenta('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold.magenta('  EmilyUI Setup'));
  console.log(chalk.bold.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  try {
    const spinner = ora('Analysing project structure...').start();
    const detectedProject = detectProject();
    spinner.succeed(`Detected project: ${chalk.cyan(detectedProject.name)}`);

    const { projectName } = await new Form({
      name: 'project',
      message: 'Project details',
      choices: [
        {
          name: 'projectName',
          message: 'Project name',
          initial: 'My Design System'
        }
      ]
    }).run();

    if (!projectName || !projectName.trim()) {
      console.log(chalk.red('\nProject name is required.\n'));
      process.exit(1);
    }

    console.log(chalk.bold(`\n${chalk.magenta('→')} Brand colours`));

    const normalisedColours = {};

    for (const colourName of Object.keys(DEFAULT_COLOURS)) {
      normalisedColours[colourName] = await askColour(colourName);
    }

    console.log(chalk.bold(`\n${chalk.magenta('→')} Typography`));

    const headingFont = await new Select({
      name: 'headingFont',
      message: 'Heading font',
      choices: FONT_OPTIONS,
      initial: 0
    }).run();

    const bodyFont = await new Select({
      name: 'bodyFont',
      message: 'Body font',
      choices: FONT_OPTIONS,
      initial: 1
    }).run();

    const monoFont = await new Select({
      name: 'monoFont',
      message: 'Monospace font',
      choices: FONT_OPTIONS,
      initial: 4
    }).run();

    const { baseUnitInput } = await new Form({
      name: 'spacing',
      message: 'Spacing',
      choices: [
        {
          name: 'baseUnitInput',
          message: 'Base spacing unit in px',
          initial: '8'
        }
      ],
      validate(values) {
        const parsed = Number.parseInt(values.baseUnitInput, 10);

        if (Number.isNaN(parsed) || parsed <= 0) {
          return 'Base spacing unit must be a positive number.';
        }

        return true;
      }
    }).run();

    const baseUnit = Number.parseInt(baseUnitInput, 10);

    console.log(chalk.bold(`\n${chalk.magenta('→')} Purge settings`));

    const { sourceDir } = await new Form({
      name: 'paths',
      message: `Detected ${detectedProject.name} project`,
      choices: [
        {
          name: 'sourceDir',
          message: 'Scan directory',
          initial: detectedProject.sourceDir
        }
      ]
    }).run();

    const config = createDefaultConfig({
      name: projectName.trim(),
      colours: normalisedColours,
      headingFont,
      bodyFont,
      monoFont,
      baseUnit,
      detectedProject,
      sourceDir: sourceDir.trim() || detectedProject.sourceDir
    });

    const configPath = path.join(process.cwd(), 'emily.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('');
    const buildSpinner = ora('Building EmilyUI CSS...').start();

    const build = crossSpawn('npx', ['emily-css', 'build'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: process.platform === 'win32'
    });

    let stderr = '';

    build.stderr.on('data', data => {
      stderr += data.toString();
    });

    build.on('close', code => {
      if (code === 0) {
        buildSpinner.succeed('EmilyUI CSS built successfully.');

        console.log('\n' + boxen(
          chalk.green.bold('Setup complete') +
          `\n\nConfig: ${chalk.cyan('emily.config.json')}` +
          `\nOutput: ${chalk.cyan('dist/emily.css')}` +
          `\nProject: ${chalk.cyan(detectedProject.name)}` +
          `\nScan: ${chalk.cyan(config.purge.sourceDir)}` +
          `\n\nNext: add ${chalk.yellow('dist/emily.css')} to your project.`,
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'magenta'
          }
        ));
      } else {
        buildSpinner.fail('Automatic build failed.');

        console.log('\nYour config was created, but CSS was not built.');
        console.log('\nRun this manually:\n');
        console.log(chalk.cyan('  npx emily-css build'));

        if (stderr.trim()) {
          console.log(chalk.gray('\nBuild error:\n'));
          console.log(stderr.trim());
        }
      }

      process.exit(code === 0 ? 0 : 1);
    });

    build.on('error', error => {
      buildSpinner.fail('Automatic build failed.');

      console.log('\nYour config was created, but CSS was not built.');
      console.log(`Reason: ${error.message}`);
      console.log('\nRun this manually:\n');
      console.log(chalk.cyan('  npx emily-css build\n'));

      process.exit(1);
    });
  } catch (error) {
    console.log(chalk.red('\nSetup cancelled or failed.'));

    if (error && error.message) {
      console.log(chalk.gray(error.message));
    }

    process.exit(1);
  }
}

init();