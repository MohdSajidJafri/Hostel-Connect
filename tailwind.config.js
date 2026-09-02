/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EAEAEA',
          300: '#DCDCDC',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.03)',
        'dropdown': '0 4px 20px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}
