/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",                // quét index.html
    "./src/**/*.{js,jsx,ts,tsx}",  // quét tất cả file JS/TS/JSX/TSX trong src
  ],
  theme: {
    extend: {
      borderRadius: {
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
