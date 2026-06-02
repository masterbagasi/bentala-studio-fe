import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08090d",
        bg2: "#0d0f18",
        bg3: "#111420",
        blue1: "#0B3DE7",
        blue2: "#0B3DE7",
        blue3: "#0B3DE7",
        blue4: "#0B3DE7",
        cyan: "#0B3DE7",
        white: "#f0f4ff",
        dim: "rgba(240,244,255,0.55)",
        ghost: "rgba(240,244,255,0.1)",
      },
      fontFamily: {
        sans: ["Open Sauce Sans", "sans-serif"],
      },
      fontSize: {
        "label":      ["9px",  { lineHeight: "1.2" }],
        "meta":       ["10px", { lineHeight: "1.2" }],
        "tag":        ["11px", { lineHeight: "1.2" }],
        "nav":        ["13px", { lineHeight: "1.2" }],
        "body-sm":    ["15px", { lineHeight: "1.75" }],
        "body":       ["17px", { lineHeight: "1.9"  }],
        "body-lg":    ["19px", { lineHeight: "1.85" }],
        "heading-xs": ["22px", { lineHeight: "1.1"  }],
        "heading-sm": ["26px", { lineHeight: "1.1"  }],
        "display-sm": ["32px", { lineHeight: "1"    }],
        "stat":       ["64px", { lineHeight: "1"    }],
        "collab":     ["clamp(22px,2.5vw,34px)",  { lineHeight: "1"    }],
        "story":      ["clamp(40px,4.5vw,64px)",  { lineHeight: "0.95" }],
        "section":    ["clamp(44px,5vw,72px)",    { lineHeight: "1.05" }],
        "cta":        ["clamp(48px,6vw,88px)",    { lineHeight: "0.95" }],
        "hero":       ["clamp(219px,31.2vw,429px)", { lineHeight: "0.92" }],
        "page":       ["clamp(64px,9vw,130px)",   { lineHeight: "0.88" }],
      },
    },
  },
  plugins: [],
};
export default config;
