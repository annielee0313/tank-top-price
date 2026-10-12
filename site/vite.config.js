import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo-name>/, set by the deploy workflow.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
});
