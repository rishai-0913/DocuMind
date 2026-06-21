import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4F6AF5',
          700: '#4338ca',
        },
        surface: '#F8F9FC',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
