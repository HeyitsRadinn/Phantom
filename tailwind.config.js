/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue,html}'],
  theme: {
    extend: {
      colors: {
        'gray-850': '#18202f', // Add custom color for the header
      },
    },
  },
  plugins: [],
};
