import type { Config } from "tailwindcss";

const warmScale = {
  50: "#FFFEFC",
  100: "#F8F6F1",                       // Main Background
  200: "#EAE5DD",                       // Hairline Subtle Border
  300: "#DDD6CA",
  400: "#A18D70",                       // Muted Taupe
  500: "#77736C",                       // Secondary Text
  600: "#5A5650",
  700: "#3D3934",
  800: "#242321",                       // Primary Espresso Text
  900: "#242321",
  950: "#1A1918",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official ESPACIO Premium Light Brand Tokens
        cream: {
          DEFAULT: "#F8F6F1", // Main App Background
          light: "#FFFEFC",
          dark: "#F5F2EC",
        },
        offwhite: {
          DEFAULT: "#FFFEFC", // Primary Card Surface
          light: "#FFFFFF",
          dark: "#F3EEE5",
        },
        sidebar: {
          DEFAULT: "#F5F2EC", // Light Sidebar Background
          active: "#EEE5D6",  // Active Navigation Pill
          hover: "#EFEAE0",
        },
        gold: {
          DEFAULT: "#B99558", // Soft Gold Accent / CTA
          hover: "#A7844A",
          active: "#94743C",
          soft: "#F4EDE0",
          muted: "#E8DEC8",
          dark: "#8C6E38",
        },
        taupe: {
          DEFAULT: "#A18D70",
          light: "#C5B49F",
          dark: "#847257",
        },
        walnut: {
          DEFAULT: "#77736C", // Secondary Muted Text
          light: "#9E978E",
          dark: "#4E4B46",
          border: "#EAE5DD",  // Hairline Border
          soft: "#F3EEE5",
        },
        charcoal: {
          DEFAULT: "#242321", // Primary Espresso Text
          light: "#3D3934",
          dark: "#1A1918",
          muted: "#77736C",
        },

        // Semantic Brand Scale
        brand: {
          50: "#FAF6EF",
          100: "#F4EDE0",
          200: "#EEE5D6",
          300: "#DBCFBC",
          400: "#CBB99F",
          500: "#B99558", // Soft Gold
          600: "#A7844A",
          700: "#94743C",
          800: "#755B2E",
          900: "#594420",
        },

        // Semantic Surfaces
        surface: {
          bg: "#F8F6F1",       // Dominant App Background
          sidebar: "#F5F2EC",  // Sidebar Background
          card: "#FFFEFC",     // Card Surface
          elevated: "#FFFEFC", // Card Elevated
          secondary: "#F3EEE5",// Secondary Tile / Header Surface
          active: "#EEE5D6",   // Active Pill
          border: "#EAE5DD",   // Hairline Border
        },

        // Custom Warm Scales for complete fallback protection
        slate: warmScale,
        gray: warmScale,
        zinc: warmScale,
        neutral: warmScale,
        stone: warmScale,

        // Restrained Business Semantic Colors (Zero pure neon green)
        semantic: {
          success: "#8C7355",
          "success-bg": "#F4EFE6",
          "success-border": "#E5DACB",
          warning: "#C48436",
          "warning-bg": "#FAF3EB",
          "warning-border": "#ECD9C6",
          danger: "#B8594D",
          "danger-bg": "#FDF2F0",
          "danger-border": "#F5D2CD",
          info: "#7E786E",
          "info-bg": "#F3EFE9",
          "info-border": "#E5DFD5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(36, 35, 33, 0.04)",
        card: "0 1px 3px 0 rgba(36, 35, 33, 0.04), 0 1px 2px -1px rgba(36, 35, 33, 0.02)",
        elevated: "0 4px 6px -1px rgba(36, 35, 33, 0.04), 0 2px 4px -2px rgba(36, 35, 33, 0.02)",
        modal: "0 20px 25px -5px rgba(36, 35, 33, 0.1), 0 8px 10px -6px rgba(36, 35, 33, 0.04)",
        gold: "0 2px 8px -1px rgba(185, 149, 88, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
