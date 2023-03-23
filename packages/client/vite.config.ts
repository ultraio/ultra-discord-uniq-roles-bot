import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSSL from '@vitejs/plugin-basic-ssl';

const args = process.argv;

let plugins = [vue()];

if (args.find((x) => x.includes('mode=dev'))) {
    plugins.push(basicSSL());
}

export default defineConfig({
    plugins,
    build: {
        outDir: '../server/dist/html',
        emptyOutDir: true,
    },
    server: {
        host: 'localhost',
        https: true,
    },
});
