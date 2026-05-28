/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3525cd', // Curated Deep Blue (from design system)
          light: '#4f46e5',   // Indigo
          dark: '#1e0f9b',
        },
        secondary: {
          DEFAULT: '#006c49', // Emerald/Mint Success (from design system)
          light: '#6ffbbe',
          dark: '#002113',
        },
        tertiary: {
          DEFAULT: '#7e3000', // Amber/Orange Warmth
          light: '#ffd2be',
          dark: '#351000',
        },
        darkbg: '#0F172A', // Deep Navy Slate
        surface: {
          DEFAULT: '#ffffff',
          dim: '#dcd8e5',
          bright: '#fcf8ff',
          container: '#f0ecf9',
          'container-high': '#eae6f4',
          'container-highest': '#e4e1ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.15)',
        'premium': '0 10px 30px -10px rgba(79, 70, 229, 0.15)',
      }
    },
  },
  plugins: [],
}
