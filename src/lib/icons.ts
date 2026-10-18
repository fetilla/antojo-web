// Iconos Phosphor (variante bold) como SVG en línea.
import whatsapp from '@phosphor-icons/core/bold/whatsapp-logo-bold.svg?raw';
import phone from '@phosphor-icons/core/bold/phone-bold.svg?raw';
import instagram from '@phosphor-icons/core/bold/instagram-logo-bold.svg?raw';
import facebook from '@phosphor-icons/core/bold/facebook-logo-bold.svg?raw';
import mapPin from '@phosphor-icons/core/bold/map-pin-bold.svg?raw';
import clock from '@phosphor-icons/core/bold/clock-bold.svg?raw';
import close from '@phosphor-icons/core/bold/x-bold.svg?raw';
import arrowUpRight from '@phosphor-icons/core/bold/arrow-up-right-bold.svg?raw';
import arrowRight from '@phosphor-icons/core/bold/arrow-right-bold.svg?raw';
import book from '@phosphor-icons/core/bold/book-open-text-bold.svg?raw';
import zoom from '@phosphor-icons/core/bold/magnifying-glass-plus-bold.svg?raw';
import caret from '@phosphor-icons/core/bold/caret-down-bold.svg?raw';
import paw from '@phosphor-icons/core/bold/paw-print-bold.svg?raw';
import glutenFree from '@phosphor-icons/core/bold/grains-slash-bold.svg?raw';
import cake from '@phosphor-icons/core/bold/cake-bold.svg?raw';
import confetti from '@phosphor-icons/core/bold/confetti-bold.svg?raw';
import campfire from '@phosphor-icons/core/bold/campfire-bold.svg?raw';
import fire from '@phosphor-icons/core/bold/fire-bold.svg?raw';
import thermometer from '@phosphor-icons/core/bold/thermometer-simple-bold.svg?raw';
import pepper from '@phosphor-icons/core/bold/pepper-bold.svg?raw';
import burger from '@phosphor-icons/core/bold/hamburger-bold.svg?raw';
import bread from '@phosphor-icons/core/bold/bread-bold.svg?raw';
import flame from '@phosphor-icons/core/bold/flame-bold.svg?raw';
import wine from '@phosphor-icons/core/bold/wine-bold.svg?raw';

export const icons = {
  whatsapp, phone, instagram, facebook, mapPin, clock, close, arrowUpRight, arrowRight, book, zoom,
  caret, paw, glutenFree, cake, confetti, campfire, fire, thermometer, pepper, burger,
  bread, flame, wine,
} as const;

export type IconName = keyof typeof icons;
