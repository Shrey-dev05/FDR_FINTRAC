/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#14243A', // Midnight Navy
          800: '#1D3048', // Deep Ink
          700: '#2A4365',
          600: '#52677F', // Muted Blue
        },
        teal: {
          primary: '#147D78', // Institutional Teal
          soft: '#E3F3F0',
          hover: '#0E625E',
        },
        surface: {
          warm: '#F6F5F0', // Warm Ivory application background
          pure: '#FFFFFF',
          secondary: '#EEF1F3',
          border: '#E2E5E8',
        },
        ink: {
          primary: '#202B38',
          secondary: '#687586',
          muted: '#9AA5B5',
        },
        status: {
          verified: '#18794E',
          verifiedBg: '#E8F5ED',
          pending: '#946200',
          pendingBg: '#FFF4D6',
          deadline: '#C47A13',
          critical: '#C44242',
          criticalBg: '#FDECEC',
          info: '#315FC4',
          infoBg: '#EAF0FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        panel: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
