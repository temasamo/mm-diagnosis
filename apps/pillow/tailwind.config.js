/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/**/*.{ts,tsx}", // 共有UIがあれば
  ],
  theme: { extend: {} },
  plugins: [],
}; 