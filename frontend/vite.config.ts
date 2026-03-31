import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [],
    },
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,
    },
    build: {
        rollupOptions: {
            input: './index.html',
        },
    },
});
