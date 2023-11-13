import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

//import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import basicSsl from '@vitejs/plugin-basic-ssl'

import { VitePWA } from 'vite-plugin-pwa'

import manifest from './manifest.json';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/volatalk-pwa',

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react(), //nxViteTsPaths(), 
    basicSsl(), 
  // tsconfigPaths(),


  VitePWA({
    mode: 'development',

    devOptions: {
      type: "module",
      enabled: true,
    },
    //https://vite-pwa-org.netlify.app/guide/register-service-worker.html

    filename: "sw.ts",
    srcDir: "src/sw",

    includeAssets: ["*.svg"],
    includeManifestIcons: false,
    injectRegister: "script",
    manifest,
    strategies: "injectManifest",
    // workbox: {
    // swDest: "my-dist/my-sw.js",
    //   runtimeCaching: [
    //     {
    //       urlPattern: /^https:\/\/localhost\//,
    //       handler: "NetworkFirst",
    //     },
    //   ],
    // },


  }),
  ],


  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: [nxViteTsPaths()],
  // },

  test: {
    globals: true,
    cache: { dir: '../../node_modules/.vitest' },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  build: {
    rollupOptions: {
    }
  }
});
