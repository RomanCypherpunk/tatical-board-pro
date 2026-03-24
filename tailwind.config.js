/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          primary: '#0F1117',
          secondary: '#1A1D27',
          panel: 'rgba(26, 29, 39, 0.88)',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        txt: {
          primary: '#F1F3F5',
          secondary: '#8B92A5',
        },
      },
    },
  },
  plugins: [],
};
