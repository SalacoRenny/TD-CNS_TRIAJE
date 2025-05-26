export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        cns: "#004640",
        cnsWhite: "#fefeff",
        pastelYellow: "#fff5b1",
        pastelGreen: "#dbf4e0",
        pastelBlue: "#d9e8ff",
        pastelPink: "#fddae3",
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },

  plugins: [],
}
