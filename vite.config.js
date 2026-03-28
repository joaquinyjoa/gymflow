import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'GymFlow',
        short_name: 'GymFlow',
        description: 'Tu rutina de entrenamiento siempre disponible',
        theme_color: '#1a1a1a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cachear estos tipos de archivos automáticamente
        globPatterns: ['**/*.{js,css,html,ico,png,svg,gif,webp}'],
        // Estrategia para las llamadas a la API — Network first, fallback a cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              networkTimeoutSeconds: 5,
            }
          },
          {
            // Cachear los GIFs de ejercicios
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/ejercicios\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ejercicios-gif-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              }
            }
          }
        ]
      }
    })
  ]
})