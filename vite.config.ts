import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When deploying to GitHub Pages as a project page, the site is served from
// https://<user>.github.io/<repo>/ so Vite needs that subpath as its base.
// Change this if the GitHub repo name differs.
const REPO_BASE = '/ibm-integration-interview/';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? REPO_BASE : '/',
}));
