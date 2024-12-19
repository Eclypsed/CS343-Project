import { resolve } from 'path'
import { defineConfig } from 'vite'

const root = 'src/routes' // Entry point

export default defineConfig({
    base: './', // Ensure all paths are relative
    root,
    resolve: {
        alias: {
            '@lib': resolve(__dirname, 'src/lib'),
            '@images': resolve(__dirname, 'src/images'),
        },
    },
    esbuild: {
        supported: {
            'top-level-await': true,
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, root, 'index.html'),
                dashboard: resolve(__dirname, root, 'dashboard/index.html'),
                settings: resolve(__dirname, root, 'settings/index.html'),
            },
        },
        minify: false, // So professor can actually read the files
        outDir: '../dist', // Build output to dist directory in src
    },
    envDir: '../../',
})
