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
      },
      screens: {
        'xs': '475px',
        // Tailwind defaults: sm: '640px', md: '768px', lg: '1024px', xl: '1280px', 2xl: '1536px'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
