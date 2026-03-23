import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102438",
        mist: "#eef3f7",
        panel: "#fbfcfd",
        line: "#d6e0e8",
        accent: "#245a7a",
        accentSoft: "#dceaf2"
      },
      boxShadow: {
        card: "0 18px 50px rgba(16, 36, 56, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"]
      }
    }
  },
  plugins: []
};

export default config;
