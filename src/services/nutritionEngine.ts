/**
 * NUTRITION ENGINE
 * ================
 *
 * Pure, offline, UI-free. No React import, no storage access, no network.
 * Same input always produces the same output, which is what makes it
 * testable and what allows the terminal to recompute or verify a payload.
 *
 * Pipeline
 * --------
 *   BMR                         (Mifflin-St Jeor, or Katch-McArdle)
 *    v
 *   Activity factor             (FAO/WHO PAL discretisation)
 *    v
 *   Estimated daily energy      (TDEE, plus a rationing floor)
 *    v
 *   Macronutrient targets       (IOM RDA + AMDR, ISSN protein scaling)
 *    v
 *   Fibre and water             (IOM AI, NASA mission fluid floor)
 *
 * Every constant used here lives in src/constants/nutrition.ts with its
 * bibliographic reference. Nothing is hardcoded in this file.
 */

import {
  ACTIVITY_FACTORS,
  BEVERAGE_SHARE_OF_TOTAL_WATER,
  CARB_AMDR,
  CARB_RDA_G,
  DISCLAIMER,
  ENERGY_MINIMUM_TDEE_RATIO,
  FAT_AMDR,
  FAT_TARGET_PERCENT,
  FIBER_ABSOLUTE_MIN_G,
  FIBER_G_PER_1000_KCAL,
  KATCH_MCARDLE,
  KCAL_PER_GRAM,
  MICRONUTRIENT_REFERENCES,
  MIFFLIN,
  MIFFLIN_OTHER_CONSTANT,
  MISSION_MIN_FLUID_ML,
  PROTEIN_AMDR,
  PROTEIN_G_PER_KG_BY_ACTIVITY,
  PROTEIN_RDA_G_PER_KG,
  TOTAL_WATER_AI_ML,
  WATER_ML_PER_KCAL,
} from '../constants/nutrition';
import type {
  BmrMethod,
  MicronutrientRequirements,
  NutrientStatus,
  NutrientStatusInfo,
  NutritionAssessment,
  NutritionRequirements,
  RequirementRange,
} from '../types/nutrition';
import type { NutritionEngineInput } from '../types/user';

/* -------------------------------------------------------------------------
 * Small numeric helpers
 * ---------------------------------------------------------------------- */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/* -------------------------------------------------------------------------
 * STEP 1 - Basal metabolic rate
 * ---------------------------------------------------------------------- */

export type BmrResult = {
  bmrKcal: number;
  method: BmrMethod;
  /** Lean body mass actually used, when the Katch-McArdle path was taken. */
  leanBodyMassKg?: number;
};

/**
 * Lean body mass, either given directly or derived from body fat percentage.
 * LBM = weight x (1 - bodyFat/100). Returns undefined when unknown.
 */
export function resolveLeanBodyMass(
  input: NutritionEngineInput,
): number | undefined {
  if (typeof input.leanBodyMassKg === 'number' && input.leanBodyMassKg > 0) {
    return input.leanBodyMassKg;
  }
  if (
    typeof input.bodyFatPercent === 'number' &&
    input.bodyFatPercent > 0 &&
    input.bodyFatPercent < 100
  ) {
    return input.weightKg * (1 - input.bodyFatPercent / 100);
  }
  return undefined;
}

/**
 * BMR in kcal/day.
 *
 * Katch-McArdle is preferred when body composition is known, because it is
 * more accurate for lean, trained bodies. Otherwise Mifflin-St Jeor, which
 * the Academy of Nutrition and Dietetics considers the most reliable
 * predictive equation for resting energy expenditure in healthy adults.
 */
export function computeBmr(input: NutritionEngineInput): BmrResult {
  const leanBodyMassKg = resolveLeanBodyMass(input);

  if (leanBodyMassKg !== undefined) {
    return {
      bmrKcal: KATCH_MCARDLE.base + KATCH_MCARDLE.leanMassCoef * leanBodyMassKg,
      method: 'katch-mcardle',
      leanBodyMassKg,
    };
  }

  const sexConstant =
    input.sex === 'male'
      ? MIFFLIN.sexConstant.male
      : input.sex === 'female'
        ? MIFFLIN.sexConstant.female
        : MIFFLIN_OTHER_CONSTANT;

  const bmrKcal =
    MIFFLIN.weightCoef * input.weightKg +
    MIFFLIN.heightCoef * input.heightCm +
    MIFFLIN.ageCoef * input.age +
    sexConstant;

  return { bmrKcal, method: 'mifflin-st-jeor' };
}

/* -------------------------------------------------------------------------
 * STEP 2 - Activity factor
 * ---------------------------------------------------------------------- */

/** PAL multiplier. Falls back to the moderate step for an unknown value. */
export function getActivityFactor(activityLevel: string): number {
  return (
    ACTIVITY_FACTORS[activityLevel as keyof typeof ACTIVITY_FACTORS] ??
    ACTIVITY_FACTORS.moderate
  );
}

/**
 * Plausible range for a physical activity level. FAO/WHO/UNU 2004 describes
 * human PAL values between roughly 1.40 (sedentary) and 2.40 (vigorous);
 * the bounds below are slightly wider to accept real data without letting
 * an out-of-range record produce an absurd energy target.
 */
const ACTIVITY_COEFFICIENT_BOUNDS = { min: 1.0, max: 2.5 } as const;

/**
 * The factor actually applied.
 *
 * A measured coefficient always wins over the five-step discretisation:
 * the steps exist only because a person can answer a questionnaire, not
 * because they are more accurate. When the data source provides a real
 * coefficient (here, one per crew post), using it removes that
 * approximation - up to 14% on the daily energy target for an EVA post.
 */
export function resolveActivityFactor(input: NutritionEngineInput): number {
  const measured = input.activityCoefficient;

  if (
    typeof measured === 'number' &&
    Number.isFinite(measured) &&
    measured >= ACTIVITY_COEFFICIENT_BOUNDS.min &&
    measured <= ACTIVITY_COEFFICIENT_BOUNDS.max
  ) {
    return measured;
  }

  return getActivityFactor(input.activityLevel);
}

/* -------------------------------------------------------------------------
 * STEP 3 - Daily energy
 * ---------------------------------------------------------------------- */

export type EnergyResult = {
  bmrKcal: number;
  activityFactor: number;
  tdeeKcal: number;
  range: RequirementRange;
};

/**
 * TDEE = BMR x PAL.
 *
 * The minimum is the higher of the BMR and 80% of TDEE, so the floor can
 * never sit below incompressible basal needs (see ENERGY_MINIMUM_TDEE_RATIO
 * for the full rationale).
 */
export function computeEnergy(input: NutritionEngineInput): EnergyResult {
  const { bmrKcal } = computeBmr(input);
  const activityFactor = resolveActivityFactor(input);
  const tdeeKcal = bmrKcal * activityFactor;
  const minimumKcal = Math.max(bmrKcal, tdeeKcal * ENERGY_MINIMUM_TDEE_RATIO);

  return {
    bmrKcal,
    activityFactor,
    tdeeKcal,
    range: {
      minimum: round(minimumKcal),
      recommended: round(tdeeKcal),
    },
  };
}

/* -------------------------------------------------------------------------
 * STEP 4 - Macronutrients
 * ---------------------------------------------------------------------- */

const gramsFromEnergyShare = (
  kcal: number,
  share: number,
  kcalPerGram: number,
): number => (kcal * share) / kcalPerGram;

/**
 * Protein.
 *   minimum     = RDA 0.8 g/kg, raised to the 10% AMDR floor if that is higher
 *   recommended = activity-scaled g/kg, capped by the 35% AMDR ceiling
 */
function computeProtein(
  input: NutritionEngineInput,
  energy: RequirementRange,
): { range: RequirementRange; perKgMinimum: number; perKgRecommended: number } {
  const perKgMinimum = PROTEIN_RDA_G_PER_KG;
  const perKgRecommended =
    PROTEIN_G_PER_KG_BY_ACTIVITY[
      input.activityLevel as keyof typeof PROTEIN_G_PER_KG_BY_ACTIVITY
    ] ?? PROTEIN_G_PER_KG_BY_ACTIVITY.moderate;

  const amdrFloorG = gramsFromEnergyShare(
    energy.minimum,
    PROTEIN_AMDR.min,
    KCAL_PER_GRAM.protein,
  );
  const amdrCeilingG = gramsFromEnergyShare(
    energy.recommended,
    PROTEIN_AMDR.max,
    KCAL_PER_GRAM.protein,
  );

  const minimum = Math.max(input.weightKg * perKgMinimum, amdrFloorG);
  const recommended = clamp(
    input.weightKg * perKgRecommended,
    minimum,
    amdrCeilingG,
  );

  return {
    range: { minimum: round(minimum), recommended: round(recommended) },
    perKgMinimum,
    perKgRecommended,
  };
}

/**
 * Fat. Straight application of the AMDR: 20% of the energy floor for the
 * minimum, 30% of the target energy for the recommendation.
 */
function computeFat(energy: RequirementRange): RequirementRange {
  return {
    minimum: round(
      gramsFromEnergyShare(energy.minimum, FAT_AMDR.min, KCAL_PER_GRAM.fat),
    ),
    recommended: round(
      gramsFromEnergyShare(
        energy.recommended,
        FAT_TARGET_PERCENT,
        KCAL_PER_GRAM.fat,
      ),
    ),
  };
}

/**
 * Carbohydrate.
 *   minimum     = 45% AMDR floor of the energy minimum, never below the
 *                 130 g/day RDA that covers brain glucose oxidation
 *   recommended = whatever energy is left after protein and fat, clamped
 *                 into the 45-65% AMDR band
 */
function computeCarbohydrates(
  energy: RequirementRange,
  protein: RequirementRange,
  fat: RequirementRange,
): RequirementRange {
  const remainderKcal =
    energy.recommended -
    protein.recommended * KCAL_PER_GRAM.protein -
    fat.recommended * KCAL_PER_GRAM.fat;

  const remainderG = remainderKcal / KCAL_PER_GRAM.carbohydrates;

  const amdrFloorG = gramsFromEnergyShare(
    energy.recommended,
    CARB_AMDR.min,
    KCAL_PER_GRAM.carbohydrates,
  );
  const amdrCeilingG = gramsFromEnergyShare(
    energy.recommended,
    CARB_AMDR.max,
    KCAL_PER_GRAM.carbohydrates,
  );

  const minimum = Math.max(
    CARB_RDA_G,
    gramsFromEnergyShare(
      energy.minimum,
      CARB_AMDR.min,
      KCAL_PER_GRAM.carbohydrates,
    ),
  );

  return {
    minimum: round(minimum),
    recommended: round(clamp(remainderG, amdrFloorG, amdrCeilingG)),
  };
}

/**
 * Fibre.
 *   minimum     = 25 g/day, the EFSA adequate intake for normal laxation
 *   recommended = 14 g per 1000 kcal of the energy target (IOM AI)
 */
function computeFiber(energy: RequirementRange): RequirementRange {
  const recommended =
    (energy.recommended / 1000) * FIBER_G_PER_1000_KCAL;

  return {
    minimum: FIBER_ABSOLUTE_MIN_G,
    recommended: round(Math.max(recommended, FIBER_ABSOLUTE_MIN_G)),
  };
}

/**
 * Water, expressed as fluid intake in mL (what the terminal dispenses),
 * not total water including food moisture.
 *
 *   minimum     = 1 mL per kcal of the energy floor, never below the
 *                 2000 mL/day NASA spaceflight fluid minimum
 *   recommended = 80% of the IOM total-water AI for the sex, or 1 mL/kcal
 *                 of the energy target, whichever is higher
 */
function computeWater(
  input: NutritionEngineInput,
  energy: RequirementRange,
): RequirementRange {
  const minimum = Math.max(
    MISSION_MIN_FLUID_ML,
    energy.minimum * WATER_ML_PER_KCAL,
  );

  const beverageAi =
    (TOTAL_WATER_AI_ML[input.sex] ?? TOTAL_WATER_AI_ML.other) *
    BEVERAGE_SHARE_OF_TOTAL_WATER;

  const recommended = Math.max(
    beverageAi,
    energy.recommended * WATER_ML_PER_KCAL,
    minimum,
  );

  return { minimum: round(minimum), recommended: round(recommended) };
}

/* -------------------------------------------------------------------------
 * STEP 5 - Micronutrients
 * ---------------------------------------------------------------------- */

/**
 * A small, high-risk subset. `minimum` is the terrestrial DRI, `recommended`
 * applies a documented mission adjustment where one exists (vitamin D
 * supplementation, higher calcium against bone loss).
 */
export function computeMicronutrients(
  input: NutritionEngineInput,
): MicronutrientRequirements {
  const R = MICRONUTRIENT_REFERENCES;
  const isFemale = input.sex === 'female';
  const isOver50 = input.age > 50;

  return {
    calcium: {
      label: R.calcium.label,
      unit: R.calcium.unit,
      minimum: isOver50 ? R.calcium.rdaOver50 : R.calcium.rda,
      // Mission adjustment: the upper DRI step is targeted for every adult,
      // because bone demineralisation is accelerated in microgravity.
      recommended: R.calcium.rdaOver50,
      upperLimit: R.calcium.upperLimit,
      source: R.calcium.source,
    },
    iron: {
      label: R.iron.label,
      unit: R.iron.unit,
      minimum: isFemale && !isOver50 ? R.iron.rdaFemaleMenstruating : R.iron.rdaMale,
      recommended: isFemale && !isOver50 ? R.iron.rdaFemaleMenstruating : R.iron.rdaMale,
      upperLimit: R.iron.upperLimit,
      source: R.iron.source,
    },
    vitaminD: {
      label: R.vitaminD.label,
      unit: R.vitaminD.unit,
      minimum: R.vitaminD.rda,
      recommended: R.vitaminD.missionTarget,
      upperLimit: R.vitaminD.upperLimit,
      source: R.vitaminD.source,
    },
    vitaminC: {
      label: R.vitaminC.label,
      unit: R.vitaminC.unit,
      minimum: isFemale ? R.vitaminC.rdaFemale : R.vitaminC.rdaMale,
      recommended: isFemale ? R.vitaminC.rdaFemale : R.vitaminC.rdaMale,
      upperLimit: R.vitaminC.upperLimit,
      source: R.vitaminC.source,
    },
    potassium: {
      label: R.potassium.label,
      unit: R.potassium.unit,
      minimum: isFemale ? R.potassium.aiFemale : R.potassium.aiMale,
      recommended: isFemale ? R.potassium.aiFemale : R.potassium.aiMale,
      source: R.potassium.source,
    },
    sodium: {
      label: R.sodium.label,
      unit: R.sodium.unit,
      // Sodium is the one nutrient where the "minimum" is the adequate
      // intake and the "recommended" is a ceiling not to exceed.
      minimum: R.sodium.ai,
      recommended: R.sodium.crdr,
      upperLimit: R.sodium.crdr,
      source: R.sodium.source,
    },
  };
}

/* -------------------------------------------------------------------------
 * PUBLIC API
 * ---------------------------------------------------------------------- */

/**
 * The function the spec asks for: profile in, requirements out.
 * Units: calories kcal, protein/carbohydrates/fat/fiber g, water mL.
 */
export function computeRequirements(
  input: NutritionEngineInput,
): NutritionRequirements {
  const energy = computeEnergy(input);
  const protein = computeProtein(input, energy.range);
  const fat = computeFat(energy.range);
  const carbohydrates = computeCarbohydrates(
    energy.range,
    protein.range,
    fat,
  );

  return {
    calories: energy.range,
    protein: protein.range,
    carbohydrates,
    fat,
    fiber: computeFiber(energy.range),
    water: computeWater(input, energy.range),
  };
}

/**
 * Same computation, plus the full derivation chain and the hypotheses,
 * so the UI can explain every figure instead of just displaying it.
 */
export function estimateNutrition(
  input: NutritionEngineInput,
): NutritionAssessment {
  const energy = computeEnergy(input);
  const bmr = computeBmr(input);
  const protein = computeProtein(input, energy.range);
  const fat = computeFat(energy.range);
  const carbohydrates = computeCarbohydrates(energy.range, protein.range, fat);
  const requirements: NutritionRequirements = {
    calories: energy.range,
    protein: protein.range,
    carbohydrates,
    fat,
    fiber: computeFiber(energy.range),
    water: computeWater(input, energy.range),
  };

  const assumptions: string[] = [
    bmr.method === 'katch-mcardle'
      ? `BMR from Katch-McArdle using ${round(bmr.leanBodyMassKg ?? 0, 1)} kg of lean mass (370 + 21.6 x LBM).`
      : 'BMR from the Mifflin-St Jeor equation (1990).',
    input.activityCoefficient !== undefined &&
    energy.activityFactor === input.activityCoefficient
      ? `Facteur d'activité ${energy.activityFactor} appliqué au métabolisme de base : coefficient mesuré, issu de la base.`
      : `Facteur d'activité ${energy.activityFactor} appliqué au métabolisme de base (paliers FAO/WHO/UNU).`,
    `Energy floor set at the higher of BMR and ${Math.round(ENERGY_MINIMUM_TDEE_RATIO * 100)}% of the daily expenditure - a mission rationing assumption, not a clinical threshold.`,
    `Protein floor at the ${PROTEIN_RDA_G_PER_KG} g/kg RDA, target at ${protein.perKgRecommended} g/kg (ACSM/ISSN range for active individuals).`,
    `Fat between ${FAT_AMDR.min * 100}% and ${FAT_AMDR.max * 100}% of energy, target ${FAT_TARGET_PERCENT * 100}% (IOM AMDR).`,
    `Carbohydrate from the remaining energy, kept inside the ${CARB_AMDR.min * 100}-${CARB_AMDR.max * 100}% AMDR and never below the ${CARB_RDA_G} g RDA.`,
    `Fibre at ${FIBER_G_PER_1000_KCAL} g per 1000 kcal (IOM AI), floor ${FIBER_ABSOLUTE_MIN_G} g (EFSA).`,
    `Fluid intake at 1 mL/kcal, floor ${MISSION_MIN_FLUID_ML} mL (NASA spaceflight minimum), target based on the IOM water AI.`,
  ];

  if (input.sex === 'other') {
    assumptions.push(
      'Sex recorded as "other": the BMR sex constant is the mean of the male and female values, so this estimate carries additional uncertainty.',
    );
  }

  return {
    requirements,
    micronutrients: computeMicronutrients(input),
    derivation: {
      bmrKcal: round(energy.bmrKcal),
      bmrMethod: bmr.method,
      activityFactor: energy.activityFactor,
      tdeeKcal: round(energy.tdeeKcal),
      proteinPerKgMinimum: protein.perKgMinimum,
      proteinPerKgRecommended: protein.perKgRecommended,
      fatPercentOfEnergy: {
        minimum: FAT_AMDR.min,
        recommended: FAT_TARGET_PERCENT,
      },
      carbPercentOfEnergy: { minimum: CARB_AMDR.min, recommended: CARB_AMDR.max },
    },
    assumptions,
    disclaimer: DISCLAIMER,
    computedAt: Date.now(),
  };
}

/* -------------------------------------------------------------------------
 * Status helpers used by the UI
 * ---------------------------------------------------------------------- */

/**
 * Where an actual intake sits relative to its requirement range.
 *   >= recommended            -> optimal
 *   >= minimum                -> below target
 *   <  minimum                -> critical
 * Sodium-style ceilings are handled by the caller, not here.
 */
export function getNutrientStatus(
  intake: number,
  range: RequirementRange,
): NutrientStatusInfo {
  const ratio = range.recommended > 0 ? intake / range.recommended : 0;

  let status: NutrientStatus = 'critical';
  let label = 'CRITICAL';

  if (intake >= range.recommended) {
    status = 'optimal';
    label = 'TARGET REACHED';
  } else if (intake >= range.minimum) {
    status = 'below';
    label = 'BELOW TARGET';
  }

  return { status, label, ratio };
}

/** Worst status across a set, used for the global dashboard indicator. */
export function aggregateStatus(
  statuses: NutrientStatus[],
): NutrientStatus {
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('below')) return 'below';
  return 'optimal';
}
