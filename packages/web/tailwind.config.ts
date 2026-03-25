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
        // Raycast-inspired deep purples with retro accents
        surface: {
          0: "#0c0b12",
          1: "#13121c",
          2: "#1a1926",
          3: "#221f30",
          4: "#2a2740",
        },
        subtle: "#3d3a52",
        muted: "#6b6888",
        text: {
          secondary: "#9e9bb5",
          primary: "#e8e6f0",
          bright: "#f5f4fa",
        },
        accent: {
          cyan: "#00e5ff",
          green: "#39ff14",
          magenta: "#d946ef",
          yellow: "#facc15",
          orange: "#fb923c",
          red: "#f43f5e",
          purple: "#a78bfa",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 229, 255, 0.08)",
        "glow-md": "0 0 30px rgba(0, 229, 255, 0.12), 0 0 60px rgba(0, 229, 255, 0.04)",
        "glow-accent": "0 0 20px rgba(0, 229, 255, 0.15)",
        "glow-green": "0 0 20px rgba(57, 255, 20, 0.1)",
        soft: "0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)",
        "pixel-subtle": "3px 3px 0 0 rgba(0, 229, 255, 0.06)",
      },
      borderRadius: {
        pixel: "2px",
        card: "12px",
        btn: "8px",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 229, 255, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 229, 255, 0.2)" },
        },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
