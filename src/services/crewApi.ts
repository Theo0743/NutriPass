/**
 * Lecture des astronautes depuis l'API.
 *
 * La base range les informations sur plusieurs tables ; astronautes.php
 * les rassemble déjà. Ce fichier ne fait que convertir la réponse dans
 * le type manipulé par l'application, et assurer le repli hors ligne.
 */

import { apiRequest } from './apiService';
import { loadOrSeedProfile } from './profileService';
import type { UserProfile } from '../types/user';

/** Astronaute affiché par défaut au démarrage. */
export const DEFAULT_CREW_ID = '1';

/** Forme exacte renvoyée par astronautes.php. */
export type ApiAstronaut = {
  profileId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number | null;
  sex: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: UserProfile['activityLevel'];
  activityLabel: string | null;
  /** Coefficient réel stocké en base : 1.3, 1.6, 2.2… */
  activityCoefficient: number | null;
  allergies: string[];
};

export type CrewSource = 'serveur' | 'local';

export type CrewResult = {
  profile: UserProfile;
  source: CrewSource;
  /** Renseigné quand le serveur n'a pas répondu. */
  warning?: string;
};

/** Réponse de l'API -> profil utilisable par l'écran. */
export function toUserProfile(astronaut: ApiAstronaut): UserProfile {
  return {
    profileId: astronaut.profileId,
    firstName: astronaut.firstName,
    age: astronaut.age ?? 0,
    sex: astronaut.sex,
    heightCm: astronaut.heightCm,
    weightKg: astronaut.weightKg,
    activityLevel: astronaut.activityLevel,
    // Le coefficient de la base prime sur le palier approché : le moteur
    // l'utilise directement s'il est présent et plausible.
    activityCoefficient: astronaut.activityCoefficient ?? undefined,
    // La base nomme les allergies librement ("Arachide", "Lactose"…) alors
    // que le type de l'app attend une liste fermée. L'affichage retombe sur
    // la valeur brute quand elle est inconnue, donc rien ne casse.
    allergies: astronaut.allergies as UserProfile['allergies'],
    // Ces trois champs n'existent pas dans la base.
    intolerances: [],
    diet: 'omnivore',
    updatedAt: Date.now(),
  };
}

/** Liste complète de l'équipage. */
export async function fetchCrew() {
  return apiRequest<ApiAstronaut[]>('/astronautes.php');
}

/**
 * Charge un astronaute depuis le serveur.
 * En cas d'échec réseau, retombe sur le profil stocké localement :
 * l'app reste utilisable, conformément au scénario du vaisseau isolé.
 */
export async function loadCrewMember(
  id: string = DEFAULT_CREW_ID,
): Promise<CrewResult> {
  const response = await apiRequest<ApiAstronaut>('/astronautes.php', {
    query: { id },
  });

  if (!response.ok) {
    const local = await loadOrSeedProfile();
    return { profile: local, source: 'local', warning: response.message };
  }

  return { profile: toUserProfile(response.data), source: 'serveur' };
}