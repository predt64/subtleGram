import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './src/app/**/*.{vue,js,ts,jsx,tsx}',
    './src/pages/**/*.{vue,js,ts,jsx,tsx}',
    './src/widgets/**/*.{vue,js,ts,jsx,tsx}',
    './src/features/**/*.{vue,js,ts,jsx,tsx}',
    './src/entities/**/*.{vue,js,ts,jsx,tsx}',
    './src/shared/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
