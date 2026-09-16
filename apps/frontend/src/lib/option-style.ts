/**
 * Présentation des options de réponse (couleur + forme), partagée entre l'aperçu
 * animateur (`preview-page`) et les écrans live (`live-components`).
 *
 * Ce sont des couleurs *métier* (l'identité d'une réponse, façon quadrant Kahoot),
 * pilotées par la donnée `option.color` — pas des états d'UI. Elles restent donc
 * sur la palette Tailwind brute plutôt que sur les tokens sémantiques du thème.
 */

/** Glyphe par forme — accessibilité couleur + forme (technique §4). */
export const SHAPE_GLYPH: Record<string, string> = {
  triangle: '▲',
  diamond: '◆',
  circle: '●',
  square: '■',
  star: '★',
  hexagon: '⬢',
  heart: '♥',
  cross: '✚',
};

/** Couleur de fond par option. */
export const COLOR_BG: Record<string, string> = {
  red: 'bg-red-600',
  blue: 'bg-blue-600',
  yellow: 'bg-amber-500',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  pink: 'bg-pink-600',
  teal: 'bg-teal-600',
};

/** Repli quand l'option n'a pas de couleur connue. */
export const OPTION_BG_FALLBACK = 'bg-slate-600';
