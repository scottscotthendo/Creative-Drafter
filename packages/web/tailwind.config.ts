import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Exposure"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        bark:     "#28030F",
        sand:     "#F6ECE4",
        sunlight: "#FBF582",
        forest:   "#194B22",
        sky:      "#B9CFFF",
        surface: {
          0: "#F6ECE4",
          1: "#EEE3D9",
          2: "#E5D8CC",
          3: "#D6C8BA",
        },
        text: {
          primary:   "#28030F",
          secondary: "#5C3A3F",
          muted:     "#8C6E72",
          inverse:   "#F6ECE4",
        },
        status: {
          success: "#32A246",
          warning: "#E76D18",
          error:   "#D32539",
        },
      },
      boxShadow: {
        card:        "0 2px 12px rgba(40,3,15,0.06), 0 1px 4px rgba(40,3,15,0.04)",
        "card-hover":"0 6px 24px rgba(40,3,15,0.10), 0 2px 8px rgba(40,3,15,0.06)",
        warm:        "0 4px 16px rgba(251,245,130,0.20)",
      },
      borderRadius: {
        card: "16px",
        btn:  "10px",
        tag:  "6px",
      },
    },
  },
  plugins: [],
};

export default config;
