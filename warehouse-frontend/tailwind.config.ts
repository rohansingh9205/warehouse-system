import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f0",
          100: "#fbe6dc",
          500: "#b34324",
          600: "#96341a",
          700: "#7a2914",
          900: "#4a180d",
        },
      },
    },
  },
  plugins: [],
};
export default config;
