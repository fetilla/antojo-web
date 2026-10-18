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

// Una entrada por tramo del recorrido en vídeo (ver plans/landing-antojo-scroll-world.md).
export const secciones = [
  {
    id: 'inicio',
    label: 'Inicio',
    clip: 's0-entrada',
    accent: '#F2B705',
    eyebrow: 'Bar Antojo · Utiel',
    title: 'Date el gusto, en familia',
    body: 'Comida callejera de medio mundo hecha con humo, brasa y paciencia. Tú disfrutas en la mesa y los peques en su zona.',
    scroll: 0.42,
    linger: 0,
    cta: {
      primary: { label: 'Cómo llegar', href: contacto.mapsHref },
      secondary: { label: 'Escríbenos por WhatsApp', href: contacto.whatsappHref },
    },
  },
  {
    id: 'nosotros',
    label: 'Nosotros',
    clip: 's1-nosotros',
    accent: '#F2B705',
    eyebrow: 'Nosotros',
    title: 'Cocina viajada, servida en casa',
    body: 'Antojo surge de la pasión por la cocina de una familia que, habiendo trabajado alrededor del mundo en diferentes restaurantes, decide entregar lo aprendido a su gente. Pensando en los pequeños de la casa: un sitio familiar y a la vez canalla.',
    scroll: 0.45,
    linger: 0,
  },
  {
    id: 'carta',
    label: 'Carta',
    clip: 's2-carta',
    accent: '#7CC6E8',
    eyebrow: 'Carta',
    title: 'Sabores con pasaporte',
    body: 'Pincha para ver nuestros sabores más callejeros.',
    scroll: 0.5,
    linger: 0,
  },
  {
    id: 'cocina',
    label: 'Cocina',
    clip: 's3-cocina',
    accent: '#F2B705',
    eyebrow: 'Cocina',
    title: 'Street world food',
    body: 'Nos centramos en sabores que llamamos street world food: fuego, humo y técnica para una cocina con carácter.',
    scroll: 0.55,
    linger: 0,
  },
  {
    id: 'ninos',
    label: 'Zona de niños',
    clip: 's4-ninos',
    accent: '#7CC6E8',
    eyebrow: 'Zona de niños',
    title: 'Disfrutas tú, disfrutan ellos',
    body: 'Trae a tu familia a disfrutar. Los peques tienen su rincón para jugar mientras tú comes con calma.',
    scroll: 0.85,
    linger: 0,
    cta: {
      primary: { label: 'Contáctanos', href: '#contacto' },
      secondary: { label: 'Escríbenos por WhatsApp', href: contacto.whatsappHref },
    },
  },
] as const;

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
  { label: 'Ahumador', icon: 'campfire' },
  { label: 'Horno de brasas', icon: 'fire' },
  { label: 'Baja temperatura sous vide', icon: 'thermometer' },
  { label: 'Tacos', icon: 'pepper' },
  { label: 'La mejor burger de la zona', icon: 'burger' },
  { label: 'Hot dog polaco', icon: 'bread' },
  { label: 'Careta', icon: 'flame' },
  { label: 'Vinos únicos', icon: 'wine' },
] as const;

export const carta = {
  src: '/carta/carta.jpg',
  aviso: 'Visita la carta en Instagram',
  avisoFinal: 'para novedades',
};

export const tagline = [
  'Humo, brasa y calle.',
  'Mesa para los mayores,',
  'rincón para los peques.',
];
