import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project-page builds serve from https://<user>.github.io/<repo>/
// so Vite needs that subpath as its base. Override via REPO_BASE env var when
// deploying under a different repo name (must start and end with '/').
const DEFAULT_REPO_BASE = '/ibm-integration-interview/';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? (process.env.REPO_BASE ?? DEFAULT_REPO_BASE) : '/',
}));
