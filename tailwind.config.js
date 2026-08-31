/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:     '#101A2B',
        muted:   '#5D6C85',
        line:    '#D9E0EA',
        canvas:  '#EDF1F6',
        surface: '#FFFFFF',
        brand:   '#1F4FD8',
        brandsoft:'#E4EBFC',
        saffron: '#F2B705',
        good:    '#1B7F5A',
        bad:     '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        cond: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,26,43,.06), 0 8px 24px -16px rgba(16,26,43,.35)',
      },
    },
  },
  plugins: [],
}
