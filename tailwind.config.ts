import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#6366f1", hover: "#4f46e5", light: "#e0e7ff" },
        surface: { DEFAULT: "#ffffff", secondary: "#f9fafb" },
        muted: { DEFAULT: "#6b7280", light: "#f3f4f6" },
        danger: { DEFAULT: "#ef4444", light: "#fee2e2" },
      },
    },
  },
  plugins: [],
};

export default config;
