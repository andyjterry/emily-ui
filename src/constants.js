const DEFAULT_EXTENSIONS = [
  '.html',
  '.htm',
  '.twig',
  '.njk',
  '.liquid',
  '.hbs',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.php',
  '.astro',
  '.svelte',
  '.blade.php',
  '.jinja',
  '.jinja2',
  '.j2',
  '.md',
];

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
  '.vite',
];

const DEFAULT_RESPONSIVE_VARIANTS = ['sm', 'md', 'lg', 'xl', '2xl'];

const BASE_VARIANTS = [
  'hover',
  'focus',
  'focus-within',
  'focus-visible',
  'active',
  'disabled',
  'motion-reduce',
  'motion-safe',
  'aria-expanded',
  'aria-selected',
  'aria-current',
  'aria-disabled',
  'data-open',
  'data-closed',
  'dark',
  'forced-colors',
];

const PURGE_EXTENSIONS = [...DEFAULT_EXTENSIONS];

module.exports = {
  DEFAULT_EXTENSIONS,
  DEFAULT_PURGE_IGNORE,
  DEFAULT_RESPONSIVE_VARIANTS,
  BASE_VARIANTS,
  PURGE_EXTENSIONS,
};
