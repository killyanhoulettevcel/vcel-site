import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['DM Serif Display', 'serif'],
      },
      colors: {
        navy: {
          50:  '#E8EEF4',
          100: '#C5D4E3',
          200: '#9FB7CF',
          300: '#7899BA',
          400: '#5A82AA',
          500: '#3D6B99',
          600: '#2C4A6E',
          700: '#1A2E45',
          800: '#0D1B2A',
          900: '#070F17',
          950: '#030810',
        },
        cyan: {
          50:  '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#4FC3F7',
          600: '#0288D1',
          700: '#0277BD',
          800: '#01579B',
          900: '#003F7F',
        },
        cream: {
          50:  '#FAFAF7',
          100: '#F5F4F0',
          200: '#EFEEE9',
          300: '#E5E3DC',
          400: '#D4D1C7',
        },
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #0D1B2A 0%, #1A2E45 100%)',
        'gradient-cyan':  'linear-gradient(135deg, #0288D1 0%, #4FC3F7 100%)',
        'gradient-cream': 'linear-gradient(180deg, #F5F4F0 0%, #EFEEE9 100%)',
      },
      boxShadow: {
        'sm-navy':  '0 1px 3px rgba(13,27,42,0.06)',
        'md-navy':  '0 4px 16px rgba(13,27,42,0.08)',
        'lg-navy':  '0 8px 32px rgba(13,27,42,0.10)',
        'xl-navy':  '0 20px 60px rgba(13,27,42,0.12)',
        'glow-cyan':'0 4px 24px rgba(79,195,247,0.25)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
