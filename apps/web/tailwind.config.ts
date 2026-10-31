import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        slate: {
          850: '#111827',
          900: '#0f172a',
          925: '#0b1120',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(234, 88, 12, 0.35)',
        'glow-sm': '0 0 10px -2px rgba(234, 88, 12, 0.25)',
        'glow-orange': '0 10px 30px -5px rgba(234, 88, 12, 0.35)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
