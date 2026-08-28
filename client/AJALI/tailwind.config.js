/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#22222e',
        },
        crimson: {
          500: '#f0264f',
          600: '#d81f43',
        },
      },
      fontFamily: {
        body: ['ui-serif', 'Georgia', 'serif'], // placeholder — swap for your real font
      },
      boxShadow: {
        glow: '0 0 20px rgba(240, 38, 79, 0.35)',
        card: '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}