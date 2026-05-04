import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f3faf4",
          100: "#dbf2df",
          500: "#3fa658",
          600: "#2f8a48",
          700: "#266e3a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
