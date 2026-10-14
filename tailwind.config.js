/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      /**
       * Aventas palette: layered surfaces with a single accent.
       *
       * The colours resolve to CSS variables (see `src/index.css`) instead of
       * hard-coded hex, which is what lets a theme preset repaint the whole UI
       * without a rebuild. The `<alpha-value>` placeholder keeps Tailwind's
       * opacity modifiers (`bg-accent/15`, `border-accent/30`) working.
       */
      colors: {
        app: 'rgb(var(--color-app) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
