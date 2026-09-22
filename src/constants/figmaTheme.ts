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

/**
 * Trois familles, chacune avec un rôle précis dans le design d'origine :
 *   Orbitron        titres de section, onglets, nom de l'équipier
 *   Share Tech Mono libellés et valeurs numériques
 *   Exo 2           valeurs textuelles
 */
export const font = {
  display: 'Orbitron_700Bold',
  mono: 'ShareTechMono_400Regular',
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
