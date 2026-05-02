import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/styles/tokens.css', 'resources/js/app/main.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['resources/js/test/setup.ts'],
        include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
    },
});
