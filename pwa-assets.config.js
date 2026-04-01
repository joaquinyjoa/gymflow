import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    apple: {
      sizes: [180],
      padding: 0.1,
    },
    maskable: {
      sizes: [512],
      padding: 0,
    },
    transparent: {
      sizes: [64, 192, 512],
      padding: 0.05,
      favicons: [[64, 'favicon.ico']],
    },
  },
  images: ['public/icon.svg'],
})
