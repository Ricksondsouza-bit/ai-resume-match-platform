import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#eef3f8",
        ocean: "#176b87",
        leaf: "#2f855a",
        ember: "#c05621",
      },
    },
  },
  plugins: [],
};

export default config;

