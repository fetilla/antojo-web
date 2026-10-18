// Prefija rutas con la base del sitio (p. ej. /antojo-web en GitHub Pages).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path: string) => `${base}${path}`;
