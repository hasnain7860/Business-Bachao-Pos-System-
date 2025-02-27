// vite.config.js
import { defineConfig } from "file:///data/data/com.termux/files/home/Business-Bachao-Pos-System-/node_modules/vite/dist/node/index.js";
import react from "file:///data/data/com.termux/files/home/Business-Bachao-Pos-System-/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///data/data/com.termux/files/home/Business-Bachao-Pos-System-/node_modules/vite-plugin-pwa/dist/index.js";
var manifestForPlugIn = {
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "maskable_icon.png"],
  manifest: {
    name: "Business Bachao",
    short_name: "BizBachao",
    description: "Business Bachao is a comprehensive platform for managing your stock, point of sale, sales, and purchases effectively. It ensures business continuity even when offline.",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple touch icon"
      },
      {
        src: "/maskable_icon.png",
        sizes: "1500x1500",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    theme_color: "#4A90E2",
    // Enhanced theme color
    background_color: "#ffffff",
    // Enhanced background color
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "portrait"
  }
};
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      ...manifestForPlugIn,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api-domain\.com\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
                // 1 day
              }
            }
          },
          {
            urlPattern: /^https:\/\/your-static-assets\.com\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    terserOptions: {
      compress: {
        drop_console: true
      },
      mangle: true
    },
    rollupOptions: {
      output: {
        format: "esm"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvZGF0YS9kYXRhL2NvbS50ZXJtdXgvZmlsZXMvaG9tZS9CdXNpbmVzcy1CYWNoYW8tUG9zLVN5c3RlbS1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9kYXRhL2RhdGEvY29tLnRlcm11eC9maWxlcy9ob21lL0J1c2luZXNzLUJhY2hhby1Qb3MtU3lzdGVtLS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vZGF0YS9kYXRhL2NvbS50ZXJtdXgvZmlsZXMvaG9tZS9CdXNpbmVzcy1CYWNoYW8tUG9zLVN5c3RlbS0vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuXG5jb25zdCBtYW5pZmVzdEZvclBsdWdJbiA9IHtcbiAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCBcImFwcGxlLXRvdWNoLWljb24ucG5nXCIsIFwibWFza2FibGVfaWNvbi5wbmdcIl0sXG4gIG1hbmlmZXN0OiB7XG4gICAgbmFtZTogXCJCdXNpbmVzcyBCYWNoYW9cIixcbiAgICBzaG9ydF9uYW1lOiBcIkJpekJhY2hhb1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIkJ1c2luZXNzIEJhY2hhbyBpcyBhIGNvbXByZWhlbnNpdmUgcGxhdGZvcm0gZm9yIG1hbmFnaW5nIHlvdXIgc3RvY2ssIHBvaW50IG9mIHNhbGUsIHNhbGVzLCBhbmQgcHVyY2hhc2VzIGVmZmVjdGl2ZWx5LiBJdCBlbnN1cmVzIGJ1c2luZXNzIGNvbnRpbnVpdHkgZXZlbiB3aGVuIG9mZmxpbmUuXCIsXG4gICAgaWNvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgc3JjOiAnL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcbiAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzcmM6ICcvYW5kcm9pZC1jaHJvbWUtNTEyeDUxMi5wbmcnLFxuICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogJy9hcHBsZS10b3VjaC1pY29uLnBuZycsXG4gICAgICAgIHNpemVzOiAnMTgweDE4MCcsXG4gICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICBwdXJwb3NlOiAnYXBwbGUgdG91Y2ggaWNvbidcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogJy9tYXNrYWJsZV9pY29uLnBuZycsXG4gICAgICAgIHNpemVzOiAnMTUwMHgxNTAwJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZSdcbiAgICAgIH1cbiAgICBdLFxuICAgIHRoZW1lX2NvbG9yOiAnIzRBOTBFMicsIC8vIEVuaGFuY2VkIHRoZW1lIGNvbG9yXG4gICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLCAvLyBFbmhhbmNlZCBiYWNrZ3JvdW5kIGNvbG9yXG4gICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgc2NvcGU6ICcvJyxcbiAgICBzdGFydF91cmw6IFwiL1wiLFxuICAgIG9yaWVudGF0aW9uOiAncG9ydHJhaXQnXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICAuLi5tYW5pZmVzdEZvclBsdWdJbixcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL3lvdXItYXBpLWRvbWFpblxcLmNvbVxcLy4qJC8sXG4gICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya0ZpcnN0JyxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnYXBpLWNhY2hlJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAvLyAxIGRheVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL3lvdXItc3RhdGljLWFzc2V0c1xcLmNvbVxcLy4qJC8sXG4gICAgICAgICAgICBoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N0YXRpYy1hc3NldHMtY2FjaGUnLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwIC8vIDMwIGRheXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIGRldk9wdGlvbnM6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1hbmdsZTogdHJ1ZSxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBmb3JtYXQ6ICdlc20nLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNXLFNBQVMsb0JBQW9CO0FBQ25ZLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTSxvQkFBb0I7QUFBQSxFQUN4QixjQUFjO0FBQUEsRUFDZCxlQUFlLENBQUMsZUFBZSx3QkFBd0IsbUJBQW1CO0FBQUEsRUFDMUUsVUFBVTtBQUFBLElBQ1IsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osYUFBYTtBQUFBLElBQ2IsT0FBTztBQUFBLE1BQ0w7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUFBLElBQ0EsYUFBYTtBQUFBO0FBQUEsSUFDYixrQkFBa0I7QUFBQTtBQUFBLElBQ2xCLFNBQVM7QUFBQSxJQUNULE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxFQUNmO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixHQUFHO0FBQUEsTUFDSCxTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxVQUNkO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUMzQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFlBQ0UsWUFBWTtBQUFBLFlBQ1osU0FBUztBQUFBLFlBQ1QsU0FBUztBQUFBLGNBQ1AsV0FBVztBQUFBLGNBQ1gsWUFBWTtBQUFBLGdCQUNWLFlBQVk7QUFBQSxnQkFDWixlQUFlLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUNoQztBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxRQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
