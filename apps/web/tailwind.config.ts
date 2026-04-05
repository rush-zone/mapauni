import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        slate: {
          950: '#020617',
        },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        hover: '0 4px 16px rgba(0,0,0,0.08)',
        lg:    '0 10px 40px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        lg:  '10px',
        xl:  '14px',
        '2xl': '18px',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight:   '-0.02em',
        snug:    '-0.01em',
      },
    },
  },
  plugins: [],
}

export default config
