/**
 * Design tokens relevés directement sur l'interface publiée
 * (revel-revamp-75792270.figma.site), via getComputedStyle.
 *
 * Ce ne sont pas des approximations : chaque valeur a été lue sur le DOM
 * du panneau profil réel, pour que le rendu React Native colle au design.
 */

export const c = {
  /** Fond du panneau latéral. */
  panel: '#080E1C',
  /** Fond des cartes de section. */
  card: '#0D1628',
  /** Bordure des cartes et séparateurs. */
  border: '#1C2E50',

  /** Accent principal. */
  cyan: '#00D4FF',
  /** Teinte du bouton profil fermé. */
  cyanFill: 'rgba(0, 212, 255, 0.1)',
  cyanBorder: 'rgba(0, 212, 255, 0.4)',

  /** État nominal : IMC normal, statut « EN MISSION ». */
  green: '#00FF9C',

  /** Libellés de champ. */
  label: 'rgba(255, 255, 255, 0.4)',
  /** Valeurs de champ. */
  value: 'rgba(255, 255, 255, 0.8)',
  /** Onglet inactif. */
  muted: 'rgba(255, 255, 255, 0.3)',

  white: '#FFFFFF',
} as const;

/** Police unique — Exo 2 pour toute l'application. */
export const font = {
  display: 'Exo2_500Medium',
  mono: 'Exo2_400Regular',
  body: 'Exo2_500Medium',
  bodyRegular: 'Exo2_400Regular',
} as const;

export const size = {
  sectionTitle: 10,
  label: 12,
  value: 12,
  name: 14,
  tab: 10,
  meta: 10,
  stat: 16,
} as const;

export const radius = {
  card: 8,
  tile: 4,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

/** Épaisseur de bordure du design (0.8 px en CSS). */
export const HAIRLINE = 0.8;

/** Diamètre du bouton profil dans l'en-tête. */
export const PROFILE_BUTTON_SIZE = 36;

/**
 * Thème moderne — blanc pur, propre, sans bordures.
 * Accent principal : bleu. Typographie épurée.
 */
export const arcade = {
  /** Fond principal — blanc pur. */
  bg: '#FFFFFF',
  /** Fond des cartes — blanc pur. */
  card: '#FFFFFF',
  /** Fond des éléments secondaires — gris très clair. */
  cardAlt: '#F5F5F7',
  /** Séparateur fin. */
  border: '#E5E5EA',
  borderLight: '#F0F0F2',

  /** Accent principal — bleu moderne. */
  blue: '#007AFF',
  /** Accent secondaire — bleu foncé. */
  blueDark: '#0056B3',
  /** Accent — vert. */
  green: '#34C759',
  /** Accent — orange. */
  orange: '#FF9500',
  /** Accent — rouge. */
  red: '#FF3B30',
  /** Accent — jaune. */
  yellow: '#FFCC00',

  /** Texte principal — noir. */
  text: '#1C1C1E',
  /** Texte secondaire. */
  textMuted: '#8E8E93',
  /** Texte inversé. */
  textInverse: '#FFFFFF',

  /** Couleur du texte sur bouton d'action. */
  buttonText: '#FFFFFF',
} as const;
