import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    root: '.',
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        rollupOptions: {
            input: 'resources/js/app/main.tsx',
        },
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
