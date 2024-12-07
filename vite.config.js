import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugIn = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', "apple-touch-icon.png", "maskable_icon.png"],
  manifest: {
    name: "Business Bachao",
    short_name: "BizBachao",
    description: "Business Bachao is a comprehensive platform for managing your stock, point of sale, sales, and purchases effectively. It ensures business continuity even when offline.",
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple touch icon'
      },
      {
        src: '/maskable_icon.png',
        sizes: '1500x1500',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    theme_color: '#4A90E2', // Enhanced theme color
    background_color: '#ffffff', // Enhanced background color
    display: "standalone",
    scope: '/',
    start_url: "/",
    orientation: 'portrait'
  }
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      ...manifestForPlugIn,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api-domain\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            urlPattern: /^https:\/\/your-static-assets\.com\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    terserOptions: {
      compress: {
        drop_console: true,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        format: 'esm',
      },
    },
  },
});
