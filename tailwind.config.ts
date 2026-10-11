import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#6366f1", dark: "#4f46e5" },
        income: "#10b981",
        expense: "#f43f5e",
      },
      keyframes: {
        pop: { "0%": { opacity: "0", transform: "translateY(8px) scale(.98)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: { pop: "pop .18s ease-out" },
    },
  },
  plugins: [],
};
export default config;
