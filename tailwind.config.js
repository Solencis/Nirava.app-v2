/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette sumi-e minimaliste
        sand: '#F9FAFB',
        pearl: '#F3F4F6',
        stone: '#6B7280',
        ink: '#1F2937',
        jade: '#059669',
        forest: '#047857',
        vermilion: '#E60026',
        sunset: '#DC2626',
        // Nouvelles couleurs pour l'app
        wasabi: '#8BA98E',
      },
      fontFamily: {
        'shippori': ['Shippori Mincho', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        breathe: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.6',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.8',
          },
        },
      },
      boxShadow: {
        'soft': '0 4px 16px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}