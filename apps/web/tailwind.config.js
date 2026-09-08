import { tailwindThemeConfig } from '@finance/shared-ui-tokens';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    ...tailwindThemeConfig,
  },
  plugins: [],
};
