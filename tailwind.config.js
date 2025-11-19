/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",                // quét index.html
    "./src/**/*.{js,jsx,ts,tsx}",  // quét tất cả file JS/TS/JSX/TSX trong src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
