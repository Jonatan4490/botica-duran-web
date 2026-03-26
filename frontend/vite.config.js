import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
                manifest: {
                    name: 'Botica Duran',
                    short_name: 'Botica Duran',
                    description: 'Sistema de Gestión de Farmacia',
                    theme_color: '#2563eb',
                    background_color: '#ffffff',
                    display: 'standalone',
                    scope: '/',
                    start_url: '/',
                    icons: [
                        {
                            src: 'logo192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'logo512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
                },
                workbox: {
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/api\./,
                            handler: 'NetworkFirst',
                            options: {
                                cacheName: 'api-cache',
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 300
                                }
                            }
                        }
                    ]
                }
            })
        ],
        server: {
            port: 3000,
            open: true
        }
    };
});
