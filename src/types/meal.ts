/**
 * Types du flux repas, partagés entre l'API et l'écran.
 */

export type MenuItem = {
  id: string;
  name: string;
  calories: number;
  image: string;
  ingredients: string[];
};

export type ClaimPayload = {
  repas_id: string;
  meal_type: string;
  portion_size: number;
};
