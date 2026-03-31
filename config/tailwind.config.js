/** @type {import('tailwindcss').Config} */
export default {
  // Paths are resolved from project root (CWD), not from this file's location
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          primary: '#08120D',
          secondary: '#101F17',
          panel: 'rgba(12, 24, 18, 0.86)',
        },
        accent: {
          DEFAULT: '#14C96B',
          hover: '#0FAE5C',
          glow: 'rgba(20, 201, 107, 0.35)',
        },
        txt: {
          primary: '#F5F7F5',
          secondary: '#93AB9D',
        },
      },
    },
  },
  plugins: [],
};
