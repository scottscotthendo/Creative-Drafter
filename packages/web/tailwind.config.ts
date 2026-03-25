import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        retro: {
          black: "#0a0a0f",
          dark: "#12121a",
          panel: "#1a1a2e",
          border: "#2a2a3e",
          muted: "#4a4a6a",
          text: "#c8c8e0",
          bright: "#e8e8ff",
          green: "#39ff14",
          cyan: "#00fff5",
          magenta: "#ff00ff",
          yellow: "#ffe600",
          orange: "#ff6600",
          red: "#ff2255",
          blue: "#4466ff",
        },
      },
      boxShadow: {
        pixel: "4px 4px 0px 0px rgba(0, 255, 245, 0.2)",
        "pixel-sm": "2px 2px 0px 0px rgba(0, 255, 245, 0.15)",
        "pixel-glow": "0 0 20px rgba(0, 255, 245, 0.1), 0 0 40px rgba(0, 255, 245, 0.05)",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        scanline: "scanline 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
