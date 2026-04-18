import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                subscription: resolve(__dirname, 'subscription.html'),
                payment: resolve(__dirname, 'payment.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                contact: resolve(__dirname, 'contact.html'),
                login: resolve(__dirname, 'login.html'),
                myCourse: resolve(__dirname, 'my-course.html'),
                adminLogin: resolve(__dirname, 'admin/login.html'),
                adminDashboard: resolve(__dirname, 'admin/dashboard.html'),
                subscriptionSuccess: resolve(__dirname, 'subscription/success.html'),
                subscriptionCancel: resolve(__dirname, 'subscription/cancel.html'),
            },
        },
    },
    server: {
        port: 5173,
        open: true
    },
    preview: {
        port: 4173
    }
});
