export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#071025',
        cyan: '#00e5ff',
        aurora: '#8bffb0',
        ember: '#ff9d4d'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,229,255,.3), 0 12px 40px rgba(0,0,0,.35)'
      },
      fontFamily: {
        display: ['Space Grotesk', 'Segoe UI', 'sans-serif'],
        body: ['IBM Plex Sans', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
