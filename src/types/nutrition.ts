/** Nutrition domain types shared by the engine, the UI and the NFC payload. */

/** Every requirement is a floor and a target, never a single number. */
export type RequirementRange = {
  /** Lower bound that should not be crossed durably. */
  minimum: number;
  /** Target value for a nominal mission day. */
  recommended: number;
};

/** Macro + hydration requirements. Units: kcal, g, g, g, g, mL. */
export type NutritionRequirements = {
  calories: RequirementRange;
  protein: RequirementRange;
  carbohydrates: RequirementRange;
  fat: RequirementRange;
  fiber: RequirementRange;
  water: RequirementRange;
};

export type NutrientKey = keyof NutritionRequirements;

export type MicronutrientKey =
  | 'calcium'
  | 'iron'
  | 'vitaminD'
  | 'vitaminC'
  | 'potassium'
  | 'sodium';

export type MicronutrientRequirement = RequirementRange & {
  label: string;
  unit: 'mg' | 'ug';
  /** Tolerable upper intake level when the reference body defines one. */
  upperLimit?: number;
  /** Reference for this value, kept in the data and not only in comments. */
  source: string;
};

export type MicronutrientRequirements = Record<
  MicronutrientKey,
  MicronutrientRequirement
>;

/** Which BMR equation was actually applied. */
export type BmrMethod = 'mifflin-st-jeor' | 'katch-mcardle';

/**
 * Full engine output: the requirements plus the whole derivation chain,
 * so the UI and a reviewer can both see how a number was produced.
 *
 * BMR -> Activity factor -> Estimated daily energy requirement -> Macros
 */
export type NutritionAssessment = {
  requirements: NutritionRequirements;
  micronutrients: MicronutrientRequirements;
  derivation: {
    bmrKcal: number;
    bmrMethod: BmrMethod;
    activityFactor: number;
    /** Total daily energy expenditure = BMR x activity factor. */
    tdeeKcal: number;
    proteinPerKgMinimum: number;
    proteinPerKgRecommended: number;
    fatPercentOfEnergy: { minimum: number; recommended: number };
    carbPercentOfEnergy: { minimum: number; recommended: number };
  };
  /** Human-readable hypotheses behind this estimate, shown in the app. */
  assumptions: string[];
  /** Non-negotiable disclaimer surfaced in the UI. */
  disclaimer: string;
  computedAt: number;
};

/** Semantic state of an intake relative to its requirement range. */
export type NutrientStatus = 'optimal' | 'below' | 'critical' | 'excess';

export type NutrientStatusInfo = {
  status: NutrientStatus;
  label: string;
  /** Intake divided by the recommended value. */
  ratio: number;
};
