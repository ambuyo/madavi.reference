/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: '"Tiempos", serif',
        sans: '"DM Sans", sans-serif',
      },
      animation: {
        'hover-wiggle': 'hover-wiggle 0.8s ease-in-out infinite',
      },
      keyframes: {
        'hover-wiggle': {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'debris-fall': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(180deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
