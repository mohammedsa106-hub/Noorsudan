/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8ec',
          100: '#f8ecca',
          200: '#f0d894',
          300: '#e8c878',
          400: '#c8a849',
          500: '#b8953a',
          600: '#9a7a2a',
          700: '#7a5e1f',
          800: '#5a4515',
          900: '#3a2d0c',
        },
        ink: {
          50: '#1a1812',
          100: '#14120e',
          200: '#0f0d0a',
          300: '#0a0908',
          400: '#070605',
          500: '#050505',
          600: '#030303',
          700: '#020202',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeInUp 0.5s ease-out both',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200, 168, 73, 0.15)' },
          '50%': { boxShadow: '0 0 32px rgba(200, 168, 73, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};
