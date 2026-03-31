/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: defaultTheme.colors.gray ?? defaultTheme.colors.slate
      }
    }
  },
  plugins: []
};
