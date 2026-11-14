/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stadium: {
          dark:  '#0a0a1a',
          card:  '#12122a',
          border:'#1e1e3f',
          gold:  '#f9cd05',
          accent:'#ff6b35'
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-gold': 'pulseGold 1s ease-in-out infinite',
        'bounce-in':  'bounceIn 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)',
        'slide-up':   'slideUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'spin-slow':  'spin 3s linear infinite',
        'shake':      'shake 0.5s ease-in-out',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'firework':   'firework 1s ease-out forwards'
      },
      keyframes: {
        pulseGold: {
          '0%,100%': { boxShadow: '0 0 10px #f9cd05' },
          '50%':     { boxShadow: '0 0 30px #f9cd05, 0 0 60px #f9cd05' }
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '50%':  { opacity: '1', transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' }
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' }
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-10px)' },
          '40%':     { transform: 'translateX(10px)' },
          '60%':     { transform: 'translateX(-5px)' },
          '80%':     { transform: 'translateX(5px)' }
        },
        glow: {
          '0%':   { filter: 'drop-shadow(0 0 5px currentColor)' },
          '100%': { filter: 'drop-shadow(0 0 20px currentColor)' }
        },
        firework: {
          '0%':   { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1.5) rotate(180deg)', opacity: '0' }
        }
      }
    }
  },
  plugins: []
};
