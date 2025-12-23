/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",                // quét index.html
    "./src/**/*.{js,jsx,ts,tsx}",  // quét tất cả file JS/TS/JSX/TSX trong src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
