/** @type {import('tailwindcss').Config} */
export default {
  content: ["/popup-local.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        loadingDot: {
          "0%, 100%": { transform: "scaleY(1)", opacity: "0.5" },
          "50%": { transform: "scaleY(1.8)", opacity: "1" },
        },
        rotation: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        loadingDot: "loadingDot 1.4s ease-in-out infinite",
        spin: "rotation 1s linear infinite",
      },
    },
  },
  plugins: [],
};
