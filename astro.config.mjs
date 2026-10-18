// @ts-check
import process from 'node:process';
import { execSync } from 'node:child_process';
import { defineConfig } from 'astro/config';

// Versión visible en ?debug=1 para comprobar qué despliegue se está viendo
const build = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'local';
  }
})();

// Dominio propio en GitHub Pages: la web se sirve en la raíz de antojoutiel.com.
// SITE y BASE_PATH permiten sobrescribirlo (p. ej. para probar en usuario.github.io/repo).
export default defineConfig({
  site: process.env.SITE || 'https://antojoutiel.com',
  base: process.env.BASE_PATH || '/',
  vite: {
    define: { __BUILD__: JSON.stringify(build) },
  },
});
