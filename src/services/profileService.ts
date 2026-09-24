/**
 * Accès au profil stocké, et valeurs qu'on peut en DÉRIVER.
 *
 * Règle tenue par ce fichier : rien n'est affiché qui ne soit soit
 * un champ de UserProfile, soit un calcul fait à partir de ces champs.
 * Aucune donnée inventée.
 *
 * La lecture/écriture passe par storageService (SecureStore quand
 * disponible, donc chiffré au repos, AsyncStorage sinon).
 */

import { ACTIVITY_LABELS } from '../constants/nutrition';
import { loadProfile, saveProfile } from './storageService';
import type { UserProfile } from '../types/user';

/**
 * Profil de démonstration, écrit au premier lancement.
 * Il ne contient que les 13 champs du modèle — rien de plus.
 */
export const SEED_PROFILE: Omit<UserProfile, 'updatedAt'> = {
  profileId: 'USR-7724-ALPHA',
  firstName: 'Jean',
  age: 38,
  sex: 'male',
  heightCm: 181,
  weightKg: 76.4,
  activityLevel: 'moderate',
  bodyFatPercent: 19.5,
  // Dérivée du taux de masse grasse : 76,4 x (1 - 0,195).
  leanBodyMassKg: 61.5,
  allergies: [],
  intolerances: ['gluten', 'lactose'],
  diet: 'vegan',
};

/** Lit le profil ; écrit la graine s'il n'y en a pas encore. */
export async function loadOrSeedProfile(): Promise<UserProfile> {
  const stored = await loadProfile();
  if (stored) return stored;
  return saveProfile(SEED_PROFILE);
}

/* -------------------------------------------------------------------------
 * Valeurs dérivées — calculées depuis les champs stockés
 * ---------------------------------------------------------------------- */

/** IMC = poids / taille². */
export function getBmi(profile: UserProfile): number {
  const heightM = profile.heightCm / 100;
  if (heightM <= 0) return 0;
  return Math.round((profile.weightKg / (heightM * heightM)) * 10) / 10;
}

/** Classification OMS de l'IMC adulte. */
export function getBmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Insuffisant';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Surpoids';
  return 'Obésité';
}

/**
 * Masse maigre : celle qui est stockée, sinon déduite du taux de masse
 * grasse. Renvoie undefined quand aucune des deux n'est renseignée.
 */
export function getLeanMassKg(profile: UserProfile): number | undefined {
  if (typeof profile.leanBodyMassKg === 'number') return profile.leanBodyMassKg;
  if (typeof profile.bodyFatPercent === 'number') {
    return (
      Math.round(profile.weightKg * (1 - profile.bodyFatPercent / 100) * 10) / 10
    );
  }
  return undefined;
}

/** Initiale affichée dans la pastille. Le modèle n'a pas de nom de famille. */
export function getInitial(profile: UserProfile): string {
  return profile.firstName.trim().charAt(0).toUpperCase();
}

export function getSexLabel(profile: UserProfile): string {
  switch (profile.sex) {
    case 'male':
      return 'Homme';
    case 'female':
      return 'Femme';
    default:
      return 'Autre';
  }
}

export function getDietLabel(profile: UserProfile): string {
  switch (profile.diet) {
    case 'vegan':
      return 'Végétalien';
    case 'vegetarian':
      return 'Végétarien';
    case 'pescatarian':
      return 'Pescétarien';
    default:
      return 'Omnivore';
  }
}

export function getActivityLabel(profile: UserProfile): string {
  return ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel;
}

const INTOLERANCE_LABELS: Record<string, string> = {
  lactose: 'Lactose',
  gluten: 'Gluten',
  fructose: 'Fructose',
  histamine: 'Histamine',
};

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  soy: 'Soja',
  peanut: 'Arachide',
  nuts: 'Fruits à coque',
  dairy: 'Lait',
  egg: 'Œuf',
  fish: 'Poisson',
  shellfish: 'Crustacés',
  sesame: 'Sésame',
};

export function formatIntolerances(profile: UserProfile): string {
  if (profile.intolerances.length === 0) return 'Aucune';
  return profile.intolerances
    .map((value) => INTOLERANCE_LABELS[value] ?? value)
    .join(', ');
}

export function formatAllergies(profile: UserProfile): string {
  if (profile.allergies.length === 0) return 'Aucune';
  return profile.allergies
    .map((value) => ALLERGEN_LABELS[value] ?? value)
    .join(', ');
}

/** `updatedAt` au format « 22/09/2026 à 14:03 ». */
export function formatUpdatedAt(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  const p = (n: number): string => n.toString().padStart(2, '0');
  return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()} à ${p(date.getHours())}:${p(date.getMinutes())}`;
}
