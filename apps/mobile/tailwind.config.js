/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2554EE',
          'primary-soft': '#DCE7FF',
          'navy-start': '#0B1B3A',
          'navy-end': '#132A5C',
        },
        semantic: {
          success: '#1F9D55',
          'success-bg': '#DFF5E6',
          danger: '#E23D3D',
          'danger-bg': '#FDE7E7',
          investment: '#7C4DE0',
          'investment-bg': '#EFE7FB',
          transfer: '#2554EE',
          'transfer-bg': '#E3ECFF',
          warning: '#E68A2E',
          'warning-bg': '#FCEFD9',
        },
        surface: '#FFFFFF',
        pageBackground: '#F3F6FC',
        borderDefault: '#E7ECF5',
        textDefault: '#101828',
        textMuted: '#667085',
      },
      borderRadius: {
        card: '18px',
        modal: '20px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
