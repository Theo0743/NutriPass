/**
 * NUTRITION CONSTANTS AND REFERENCES
 * ==================================
 *
 * Every number below comes from a published reference, cited inline.
 * No value is invented. Where the 2080 mission scenario requires a choice
 * that no terrestrial reference covers, it is flagged MISSION ASSUMPTION
 * and surfaced to the user in the app as a hypothesis, not as advice.
 *
 * References
 * ----------
 * [MSJ]   Mifflin MD, St Jeor ST et al. "A new predictive equation for
 *         resting energy expenditure in healthy individuals."
 *         Am J Clin Nutr, 1990;51(2):241-247.
 * [KM]    Katch & McArdle, "Exercise Physiology" - REE from fat-free mass.
 * [FAO]   FAO/WHO/UNU. "Human energy requirements", Report of a Joint Expert
 *         Consultation, Rome 2001 (published 2004) - Physical Activity Level.
 * [DRI]   Institute of Medicine (now NASEM). "Dietary Reference Intakes for
 *         Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein
 *         and Amino Acids", 2005 - RDA, AI and AMDR values.
 * [DRI-W] Institute of Medicine. "DRI for Water, Potassium, Sodium, Chloride
 *         and Sulfate", 2005 - total water AI.
 * [EFSA]  EFSA Panel on Dietetic Products. Dietary Reference Values for
 *         carbohydrates and dietary fibre (2010) and for water (2010).
 * [ISSN]  Jager R et al. "ISSN Position Stand: Protein and Exercise."
 *         J Int Soc Sports Nutr, 2017;14:20 - 1.4 to 2.0 g/kg for trained
 *         individuals; ACSM/AND/DC joint position (2016) gives 1.2 to 2.0.
 * [NASA]  NASA Human Research Program / NASA-STD-3001 nutritional
 *         requirements for spaceflight (minimum fluid intake, vitamin D
 *         supplementation in the absence of UV exposure).
 */

import type { ActivityLevel, Sex } from '../types/user';

/** Atwater factors: kcal released per gram of macronutrient. [DRI] */
export const KCAL_PER_GRAM = {
  protein: 4,
  carbohydrates: 4,
  fat: 9,
} as const;

/* -------------------------------------------------------------------------
 * 1. BASAL METABOLIC RATE
 * ---------------------------------------------------------------------- */

/**
 * Mifflin-St Jeor coefficients. [MSJ]
 *   BMR = 10*weightKg + 6.25*heightCm - 5*age + sexConstant
 */
export const MIFFLIN = {
  weightCoef: 10,
  heightCoef: 6.25,
  ageCoef: -5,
  sexConstant: {
    male: 5,
    female: -161,
  },
} as const;

/**
 * MISSION ASSUMPTION - sex "other".
 * No published BMR equation exists for a non-binary entry. Rather than
 * silently applying the male or the female constant, the engine uses the
 * arithmetic mean of both constants ((5 + -161) / 2 = -78) and tells the
 * user the estimate is less precise. This is an explicit modelling choice,
 * not a clinical recommendation.
 */
export const MIFFLIN_OTHER_CONSTANT =
  (MIFFLIN.sexConstant.male + MIFFLIN.sexConstant.female) / 2;

/**
 * Katch-McArdle, used only when lean body mass is known. [KM]
 *   BMR = 370 + 21.6 * leanBodyMassKg
 * More accurate than Mifflin for athletic or very lean body compositions,
 * which is the expected profile of a flight crew.
 */
export const KATCH_MCARDLE = {
  base: 370,
  leanMassCoef: 21.6,
} as const;

/* -------------------------------------------------------------------------
 * 2. ACTIVITY FACTORS
 * ---------------------------------------------------------------------- */

/**
 * Physical Activity Level multipliers applied to BMR. [FAO]
 * FAO/WHO/UNU 2004 describes sedentary lifestyles as PAL 1.40-1.69,
 * active or moderately active as 1.70-1.99 and vigorous as 2.00-2.40.
 * The five steps below are the widely used clinical discretisation of that
 * continuum (Harris-Benedict tradition), kept because each step maps to a
 * question a crew member can actually answer.
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extreme: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  extreme: 'Very active',
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Station keeping, little to no exercise',
  light: 'Light duty, 1-3 exercise sessions / week',
  moderate: 'Standard duty, 3-5 sessions / week',
  active: 'Heavy duty or EVA, 6-7 sessions / week',
  extreme: 'Intensive EVA schedule or twice-daily training',
};

/* -------------------------------------------------------------------------
 * 3. ENERGY FLOOR
 * ---------------------------------------------------------------------- */

/**
 * MISSION ASSUMPTION - energy minimum.
 * No reference body publishes a "minimum daily calorie" for healthy adults.
 * Two constraints are combined:
 *   a) intake should not sit below BMR, since basal needs are incompressible
 *      (FAO/WHO treat sustained intakes below BMR as non-viable);
 *   b) a rationing floor of 80% of TDEE is the lowest intake the mission
 *      plan tolerates, and only over a limited period.
 * The engine takes the HIGHER of the two, so the floor is never below BMR.
 */
export const ENERGY_MINIMUM_TDEE_RATIO = 0.8;

/* -------------------------------------------------------------------------
 * 4. PROTEIN
 * ---------------------------------------------------------------------- */

/** RDA for healthy adults, g per kg body mass per day. [DRI] (EFSA PRI 0.83) */
export const PROTEIN_RDA_G_PER_KG = 0.8;

/**
 * Activity-scaled protein targets, g/kg/day. [ISSN]
 * ACSM/AND/DC (2016) recommend 1.2-2.0 g/kg for active individuals;
 * ISSN (2017) supports 1.4-2.0 g/kg to build and maintain muscle.
 * Sedentary stays at the RDA, since no evidence supports going higher.
 * Microgravity muscle wasting is a documented concern, which is why the
 * upper part of the evidence-based range is used for active crew.
 */
export const PROTEIN_G_PER_KG_BY_ACTIVITY: Record<ActivityLevel, number> = {
  sedentary: 1.0,
  light: 1.2,
  moderate: 1.4,
  active: 1.6,
  extreme: 1.8,
};

/** AMDR for protein, fraction of total energy. [DRI] */
export const PROTEIN_AMDR = { min: 0.1, max: 0.35 } as const;

/* -------------------------------------------------------------------------
 * 5. FAT
 * ---------------------------------------------------------------------- */

/** AMDR for fat, fraction of total energy: 20-35%. [DRI] (EFSA RI 20-35%) */
export const FAT_AMDR = { min: 0.2, max: 0.35 } as const;

/** Target sits mid-range, a common operationalisation of the AMDR. */
export const FAT_TARGET_PERCENT = 0.3;

/* -------------------------------------------------------------------------
 * 6. CARBOHYDRATES
 * ---------------------------------------------------------------------- */

/**
 * RDA in grams: 130 g/day, the amount covering brain glucose oxidation. [DRI]
 * This is an absolute floor, independent of energy intake.
 */
export const CARB_RDA_G = 130;

/** AMDR for carbohydrate, fraction of total energy: 45-65%. [DRI] */
export const CARB_AMDR = { min: 0.45, max: 0.65 } as const;

/* -------------------------------------------------------------------------
 * 7. FIBRE
 * ---------------------------------------------------------------------- */

/** AI: 14 g of total fibre per 1000 kcal consumed. [DRI] */
export const FIBER_G_PER_1000_KCAL = 14;

/** EFSA considers 25 g/day adequate for normal laxation in adults. [EFSA] */
export const FIBER_ABSOLUTE_MIN_G = 25;

/* -------------------------------------------------------------------------
 * 8. WATER
 * ---------------------------------------------------------------------- */

/**
 * Total water AI, mL/day. [DRI-W] 3.7 L for men, 2.7 L for women, all
 * sources combined. IOM notes roughly 80% comes from beverages, which is
 * what NutriPass displays, because the terminal dispenses fluids.
 */
export const TOTAL_WATER_AI_ML: Record<Sex, number> = {
  male: 3700,
  female: 2700,
  // Mean of both AI values, same rationale as MIFFLIN_OTHER_CONSTANT.
  other: 3200,
};

/** Share of total water intake coming from beverages. [DRI-W] */
export const BEVERAGE_SHARE_OF_TOTAL_WATER = 0.8;

/** Classic IOM rule of thumb: 1 mL of water per kcal expended. [DRI-W] */
export const WATER_ML_PER_KCAL = 1.0;

/**
 * Absolute fluid floor, mL/day. NASA spaceflight nutritional requirements
 * set a minimum fluid intake of 2000 mL/day for crew members. [NASA]
 */
export const MISSION_MIN_FLUID_ML = 2000;

/* -------------------------------------------------------------------------
 * 9. MICRONUTRIENTS (subset)
 * ---------------------------------------------------------------------- */

/**
 * A deliberately small subset: the ones a closed-loop food system and
 * microgravity actually put at risk. Values are adult DRIs; sex- and
 * age-specific variations are applied by the engine where they exist.
 */
export const MICRONUTRIENT_REFERENCES = {
  calcium: {
    label: 'Calcium',
    unit: 'mg' as const,
    rda: 1000,
    rdaOver50: 1200,
    upperLimit: 2500,
    source: 'IOM DRI 2011 - bone loss is a known microgravity risk',
  },
  iron: {
    label: 'Iron',
    unit: 'mg' as const,
    rdaMale: 8,
    rdaFemaleMenstruating: 18,
    upperLimit: 45,
    source: 'IOM DRI 2001',
  },
  vitaminD: {
    label: 'Vitamin D',
    unit: 'ug' as const,
    rda: 15,
    // NASA supplements crew at 25 ug/day (1000 IU) because there is no
    // UV-B exposure on orbit, so cutaneous synthesis is nil. [NASA]
    missionTarget: 25,
    upperLimit: 100,
    source: 'IOM DRI 2011 + NASA spaceflight supplementation',
  },
  vitaminC: {
    label: 'Vitamin C',
    unit: 'mg' as const,
    rdaMale: 90,
    rdaFemale: 75,
    upperLimit: 2000,
    source: 'IOM DRI 2000',
  },
  potassium: {
    label: 'Potassium',
    unit: 'mg' as const,
    aiMale: 3400,
    aiFemale: 2600,
    source: 'NASEM DRI 2019',
  },
  sodium: {
    label: 'Sodium',
    unit: 'mg' as const,
    ai: 1500,
    // NASEM 2019 replaced the UL with a Chronic Disease Risk Reduction
    // intake of 2300 mg/day. High sodium is also linked to bone resorption
    // in spaceflight, hence the low target.
    crdr: 2300,
    source: 'NASEM DRI 2019 (AI 1500 mg, CDRR 2300 mg)',
  },
} as const;

/* -------------------------------------------------------------------------
 * 10. INPUT VALIDATION BOUNDS
 * ---------------------------------------------------------------------- */

/** Plausibility bounds for an adult crew member. Not medical criteria. */
export const PROFILE_BOUNDS = {
  age: { min: 18, max: 80 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
  bodyFatPercent: { min: 3, max: 60 },
  leanBodyMassKg: { min: 20, max: 150 },
} as const;

export const DISCLAIMER =
  'Estimates computed on-device from published reference equations ' +
  '(Mifflin-St Jeor, FAO/WHO PAL, IOM DRI). They are not personalised ' +
  'medical advice and do not replace a flight surgeon assessment.';
