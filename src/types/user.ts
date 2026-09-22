/**
 * User domain types.
 *
 * The profile lives ONLY on the device (privacy by design).
 * Nothing in this file is ever transmitted as-is over NFC:
 * see src/types/nfc.ts for the minimal transmitted payload.
 */

export type Sex = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'extreme';

export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';

/** Allergens tracked by the onboard food database. */
export type Allergen =
  | 'gluten'
  | 'soy'
  | 'peanut'
  | 'nuts'
  | 'dairy'
  | 'egg'
  | 'fish'
  | 'shellfish'
  | 'sesame';

/** Non-immune food intolerances (handled separately from allergies). */
export type Intolerance = 'lactose' | 'gluten' | 'fructose' | 'histamine';

/** Full local profile. Persisted through storageService. */
export type UserProfile = {
  /** Crew identifier used as the NFC pseudonym, e.g. ASTRO-024. */
  profileId: string;
  firstName: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  /** Optional. Enables the Katch-McArdle BMR equation. */
  leanBodyMassKg?: number;
  /** Optional. Used to derive lean body mass when not entered directly. */
  bodyFatPercent?: number;
  allergies: Allergen[];
  intolerances: Intolerance[];
  diet: DietType;
  /** Coefficient d'activité issu de la base, s'il est connu. */
  activityCoefficient?: number;
  /** Epoch ms of the last local write. */
  updatedAt: number;
};

/**
 * The strict subset of the profile the nutrition engine may read.
 * Keeping it narrow is what lets the engine stay UI-free and testable,
 * and documents exactly which personal fields influence the computation.
 */
export type NutritionEngineInput = Pick<
  UserProfile,
  'age' | 'sex' | 'heightCm' | 'weightKg' | 'activityLevel'
> & {
  leanBodyMassKg?: number;
  bodyFatPercent?: number;
  /**
   * Coefficient d'activité mesuré, quand la source de données en fournit un
   * (la table niveau_activite de la base en stocke un par poste). Il prime
   * sur les cinq paliers, qui ne sont qu'une approximation.
   */
  activityCoefficient?: number;
};

export type ProfileDraft = Omit<UserProfile, 'updatedAt'>;
