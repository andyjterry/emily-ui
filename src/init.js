const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function for prompts
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Validate hex colour
function isValidHex(hex) {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

// Default colours
const defaultColours = {
  primary: '#0077b6',
  secondary: '#006d9e',
  success: '#017F65',
  warning: '#ffc107',
  error: '#b20000',
  neutral: '#6b7280'
};

// Default config template - matches emily.config.json structure
function createDefaultConfig(name, colours, fonts, baseUnit) {
  return {
    name,
    description: `${name} design system`,
    baseUnit: `${baseUnit}px`,
    baseFontSize: '16px',
    fontFamily: 'system-ui',
    customFonts: [],
    colours,
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
        'px': '1px',
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
        'none': '0',
        'sm': '4px',
        'base': '8px',
        'md': '12px',
        'lg': '16px',
        'full': '9999px'
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

async function init() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  EmilyUI Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Project name
    const name = await prompt('Project name: ');
    if (!name.trim()) {
      console.log('❌ Project name is required');
      rl.close();
      return;
    }

    // 2. Brand colours
    console.log('\nBrand colours (hex format, e.g., #0077b6):');

    const colours = {};
    const colourNames = ['primary', 'secondary', 'success', 'warning', 'error', 'neutral'];

    for (const colourName of colourNames) {
      let colour;
      let valid = false;

      while (!valid) {
        colour = await prompt(`  ${colourName} [${defaultColours[colourName]}]: `);
        colour = colour || defaultColours[colourName];

        if (isValidHex(colour)) {
          colours[colourName] = colour;
          valid = true;
        } else {
          console.log(`    ❌ Invalid hex colour. Use format: #0077b6`);
        }
      }
    }

    // 3. Fonts
    console.log('\nFont families (optional, press Enter to skip):');

    const fonts = {
      sans: await prompt('  Sans-serif font: ') || 'system-ui, -apple-system, sans-serif',
      serif: await prompt('  Serif font: ') || 'Georgia, serif',
      mono: await prompt('  Monospace font: ') || 'Menlo, Monaco, monospace'
    };

    // 4. Base unit
    let baseUnit = 8;
    const baseUnitInput = await prompt('\nBase spacing unit (px) [8]: ');
    if (baseUnitInput.trim()) {
      const parsed = parseInt(baseUnitInput);
      if (!isNaN(parsed) && parsed > 0) {
        baseUnit = parsed;
      } else {
        console.log('  ⚠️  Invalid number, using default: 8px');
      }
    }

    // 5. Create config
    const config = createDefaultConfig(name, colours, fonts, baseUnit);

    // 6. Write config file to the user's project directory
    const configPath = path.join(process.cwd(), 'emily.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('\n✅ Configuration created!');
    console.log(`   Project: ${name}`);
    console.log(`   Primary colour: ${colours.primary}`);
    console.log(`   Base unit: ${baseUnit}px`);
    console.log(`\n📝 Config saved: ${configPath}`);

    // 7. Run build
    console.log('\n🔨 Building CSS...\n');
    rl.close();

    // Spawn build process
    const { spawn } = require('child_process');
    const build = spawn('npx', ['emily-ui', 'build'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    build.on('close', code => {
      if (code === 0) {
        console.log('\n✅ Setup complete!');
        console.log('\n💡 Next steps:');
        console.log('   1. Open showcase.html in your browser to see components');
        console.log('   2. Copy component code into your project');
        console.log('   3. Update emily.config.json to customize colours/fonts');
        console.log('   4. Run: npm run build -- --purge ./src (to reduce CSS size)');
      } else {
        console.log('\n❌ Build failed');
      }
    });

  } catch (err) {
    console.log(`\n❌ Error: ${err.message}`);
    rl.close();
  }
}

init();
