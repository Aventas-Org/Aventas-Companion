/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      /**
       * Aventas palette: layered desaturated charcoals with a single accent.
       * True black never appears next to the panels, so elevation reads cleanly.
       */
      colors: {
        app: '#0B0C0E',
        panel: '#16181C',
        line: '#24272D',
        ink: {
          DEFAULT: '#F3F4F6',
          muted: '#9CA3AF',
        },
        accent: '#FF4655',
      },
    },
  },
  plugins: [],
};
