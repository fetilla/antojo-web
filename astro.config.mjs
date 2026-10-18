// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';

// Dominio propio en GitHub Pages: la web se sirve en la raíz de antojoutiel.com.
// SITE y BASE_PATH permiten sobrescribirlo (p. ej. para probar en usuario.github.io/repo).
export default defineConfig({
  site: process.env.SITE || 'https://antojoutiel.com',
  base: process.env.BASE_PATH || '/',
});
