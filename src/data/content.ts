// Todos los textos y enlaces de la web. Edita aquí para cambiar el contenido.

export const contacto = {
  telefono: '+34 698 96 06 22',
  telefonoHref: 'tel:+34698960622',
  whatsappHref:
    'https://wa.me/34698960622?text=Hola%20Antojo%2C%20quer%C3%ADa%20informaci%C3%B3n',
  instagram: '@antojo.utiel',
  instagramHref: 'https://instagram.com/antojo.utiel',
  facebook: '@antojo.utiel',
  facebookHref: 'https://www.facebook.com/antojo.utiel',
  direccion: 'C/ S.S. León XIII, nº 3, bajo',
  localidad: '46300 Utiel (Valencia)',
  mapsHref:
    'https://www.google.com/maps/search/?api=1&query=Antojo%2C%20Calle%20S.S.%20Le%C3%B3n%20XIII%203%2C%2046300%20Utiel',
};

export const seo = {
  title: 'Antojo · Street food del mundo para disfrutar en familia en Utiel',
  description:
    'Bar Antojo en Utiel: comida callejera de todo el mundo hecha con ahumador, horno de brasas y baja temperatura. Zona de niños, pet friendly y opciones sin gluten.',
};

// Secciones del recorrido (ver plans/scroll-plan.md).
// `frame`: fotograma del vídeo (24 fps, 0–720) donde la cámara se para en la sección.
// `scroll`: largo de la sección en alturas de pantalla. `travel`: parte de ese largo en la
// que la cámara viaja desde la parada anterior; el resto es la parada.
// `poster`: imagen fija de la parada (public/posters).
export const secciones = [
  {
    id: 'inicio',
    label: 'Inicio',
    frame: 0,
    scroll: 0.3,
    travel: 0,
    poster: 's0-entrada',
    accent: '#F2B705',
    eyebrow: 'Bar Antojo · Utiel',
    title: 'Date el gusto, en familia',
    body: 'Comida callejera de medio mundo hecha con humo, brasa y paciencia. Tú disfrutas en la mesa y los peques en su zona.',
    cta: {
      primary: { label: 'Cómo llegar', href: contacto.mapsHref },
      secondary: { label: 'Escríbenos por WhatsApp', href: contacto.whatsappHref },
    },
  },
  {
    id: 'nosotros',
    label: 'Nosotros',
    frame: 120,
    scroll: 0.65,
    travel: 0.55,
    poster: 's1-nosotros',
    accent: '#F2B705',
    eyebrow: 'Nosotros',
    title: 'Cocina viajada, servida en casa',
    body: 'Antojo surge de la pasión por la cocina de una familia que, habiendo trabajado alrededor del mundo en diferentes restaurantes, decide entregar lo aprendido a su gente. Pensando en los pequeños de la casa: un sitio familiar y a la vez canalla.',
  },
  {
    id: 'carta',
    label: 'Carta',
    frame: 360,
    scroll: 0.8,
    travel: 0.6,
    poster: 's2-carta',
    accent: '#7CC6E8',
    eyebrow: 'Carta',
    title: 'Sabores con pasaporte',
    body: 'Pincha para ver nuestros sabores más callejeros.',
  },
  {
    id: 'cocina',
    label: 'Cocina',
    frame: 480,
    scroll: 0.6,
    travel: 0.5,
    poster: 's3-cocina',
    accent: '#F2B705',
    eyebrow: 'Cocina',
    title: 'Street world food',
    body: 'Nos centramos en sabores que llamamos street world food: fuego, humo y técnica para una cocina con carácter.',
  },
  {
    id: 'ninos',
    label: 'Zona de niños',
    frame: 720,
    scroll: 0.85,
    travel: 0.6,
    poster: 's4-ninos',
    accent: '#7CC6E8',
    eyebrow: 'Zona de niños',
    title: 'Disfrutas tú, disfrutan ellos',
    body: 'Trae a tu familia a disfrutar. Los peques tienen su rincón para jugar mientras tú comes con calma.',
    cta: {
      primary: { label: 'Contáctanos', href: '#contacto' },
      secondary: { label: 'Escríbenos por WhatsApp', href: contacto.whatsappHref },
    },
  },
] as const;

// Recursos del recorrido (scripts/encode-video.sh)
export const recorrido = {
  fps: 24,
  frames: 721,
  video: '/video/recorrido.mp4', // escritorio
  movil: { fps: 12, frames: 361, ruta: (i: number) => `/frames/${String(i).padStart(4, '0')}.jpg` },
};

export const etiquetas = {
  simples: [
    { label: 'Pet friendly', icon: 'paw' },
    { label: 'Gluten free lovers', icon: 'glutenFree' },
  ],
  eventos: {
    label: 'Celebración de eventos',
    opciones: [
      { label: 'Cumpleaños', icon: 'cake' },
      { label: 'Fiestas', icon: 'confetti' },
    ],
  },
} as const;

export const cocina = [
  {
    label: 'Ahumador',
    icon: 'campfire',
    // Al pulsar la etiqueta se abre este clip en bucle
    media: {
      title: 'Así sale del ahumador',
      src: '/media/ahumador.mp4',
      poster: '/media/ahumador-poster.jpg',
      alt: 'Se abre la tapa del ahumador y aparece una pieza de panceta ahumándose',
    },
  },
  { label: 'Horno de brasas', icon: 'fire' },
  { label: 'Baja temperatura sous vide', icon: 'thermometer' },
  { label: 'Tacos', icon: 'pepper' },
  { label: 'La mejor burger de la zona', icon: 'burger' },
  { label: 'Hot dog polaco', icon: 'bread' },
  { label: 'Careta', icon: 'flame' },
  { label: 'Vinos únicos', icon: 'wine' },
] as const;

export const carta = {
  src: '/carta/carta-web.jpg',
  aviso: 'Visita la carta en Instagram',
  avisoFinal: 'para novedades',
};

export const tagline = [
  'Humo, brasa y calle.',
  'Mesa para los mayores,',
  'rincón para los peques.',
];
