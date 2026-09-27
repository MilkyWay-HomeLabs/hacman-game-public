/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base path the app is served from (must match the deployment location). */
  readonly VITE_BASE_PATH: string;
  /** Static resources host (images, etc.). */
  readonly VITE_RESOURCES_URL: string;
  /** Base URL of the Hacman REST API (no trailing slash). */
  readonly VITE_API_BASE_URL: string;
  /** URL the player is returned to after finishing (Nebula gallery). */
  readonly VITE_NEBULA_RETURN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** App version injected at build time from package.json (see vite.config.ts). */
declare const __APP_VERSION__: string;
