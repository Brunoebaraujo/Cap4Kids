/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["'Courier New'", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0 #1f2937",
      },
    },
  },
  plugins: [],
};
