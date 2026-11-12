import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { pqrLocalApiPlugin } from './server/viteApiPlugin.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), pqrLocalApiPlugin(__dirname)],
});
