import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d0f14',
        surface: '#161a22',
        surface2: '#1e2330',
        border: '#2a3040',
        accent: '#3b82f6',
        accent2: '#10b981',
        accent3: '#f59e0b',
      },
    },
  },
  plugins: [],
};

export default config;
