import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Single source of truth for the app version: package.json. Injected as a global so
// the UI/footer and the version API's offline fallback stay in sync with the manifest.
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load VITE_* variables for the current mode so the served base path
  // matches the deployment location (dev vs. production).
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    base: env.VITE_BASE_PATH ?? '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5175,
      allowedHosts: ['milkyway.test'],
      hmr: {
        host: 'milkyway.test',
        protocol: 'wss',
        port: 443
      }
    },
    preview: { port: 5175 }
  }
})
