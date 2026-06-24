import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "ui-monospace", "monospace"]
      },
      boxShadow: {
        soft: "0 24px 70px rgba(0, 0, 0, 0.35)",
        glow: "0 0 42px rgba(36, 210, 255, 0.25)"
      }
    }
  },
  plugins: []
} satisfies Config;
