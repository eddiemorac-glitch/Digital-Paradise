import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        preserveSymlinks: true,
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'offline.html'],
            manifest: {
                name: 'Caribe Digital CR',
                short_name: 'Caribe Digital',
                description: 'The Ultra-Premium South Caribbean Marketplace for Food, Events & Logistics.',
                theme_color: '#050a06',
                background_color: '#050a06',
                display: 'standalone',
                orientation: 'portrait',
                categories: ['shopping', 'food', 'lifestyle'],
                shortcuts: [
                    {
                        name: 'Mis Pedidos',
                        url: '/orders',
                        icons: [{ src: 'pwa-icon-512.png', sizes: '192x192' }]
                    },
                    {
                        name: 'Explorar',
                        url: '/',
                        icons: [{ src: 'pwa-icon-512.png', sizes: '192x192' }]
                    }
                ],
                icons: [
                    {
                        src: 'pwa-icon-512.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: '/offline.html',
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/api\/(merchants|products|categories|orders)/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'api-data-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/api\/orders/i,
                        handler: 'NetworkOnly',
                        method: 'POST',
                        options: {
                            backgroundSync: {
                                name: 'sync-orders',
                                options: {
                                    maxRetentionTime: 24 * 60 // 24 hours
                                }
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
                    api: ['axios', '@tanstack/react-query'],
                    ui: ['zustand'],
                    maps: ['leaflet', 'react-leaflet']
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3001',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://127.0.0.1:3001',
                ws: true,
                changeOrigin: true,
            },
        },
    },
})
// Mobile UI Update Trigger: 2026-02-10 (Forced Deploy)
