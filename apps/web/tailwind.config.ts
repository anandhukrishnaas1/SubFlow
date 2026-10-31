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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0b1938',
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
        glow: '0 0 20px -5px rgba(37, 99, 235, 0.35)',
        'glow-sm': '0 0 10px -2px rgba(37, 99, 235, 0.25)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
