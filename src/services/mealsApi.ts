/**
 * Accès aux repas et réclamations via l'API PHP.
 *
 * Reprend la même couche de transport (apiRequest) que crewApi : clé API,
 * timeout, parsing JSON et gestion d'erreurs centralisés.
 */

import { apiRequest } from './apiService';
import type {
  ClaimPayload,
  MenuCategory,
  MenuItem,
  MissingIngredient,
  StockItem,
} from '../types/meal';

type ApiMeal = {
  id: string;
  name: string;
  calories: number;
  image: string;
  ingredients: string[];
  categorie?: string;
  available?: boolean;
  maxPortions?: number | null;
  missing?: MissingIngredient[];
};

type MealsResponse = { data?: ApiMeal[] };

type ClaimResponse = { success?: boolean; error?: string };

export async function fetchMeals(): Promise<MenuItem[]> {
  const response = await apiRequest<MealsResponse>('/get_meals.php');

  if (!response.ok) {
    throw new Error(response.message);
  }

  const meals = response.data.data;
  if (!Array.isArray(meals)) {
    throw new Error('Format de données invalide.');
  }

  return meals.map((m) => {
    const cat = (m.categorie ?? 'repas').toLowerCase().trim();
    const categorie: MenuCategory =
      cat === 'snack' ? 'snack' : cat === 'boisson' ? 'boisson' : 'repas';
    return {
      id: String(m.id),
      name: m.name,
      calories: m.calories,
      image: m.image,
      ingredients: m.ingredients ?? [],
      categorie,
      available: m.available ?? true,
      maxPortions: m.maxPortions ?? null,
      missing: m.missing ?? [],
    };
  });
}

/** Inventaire du vaisseau, aliment par aliment. */
export async function fetchStock(): Promise<StockItem[]> {
  const response = await apiRequest<{ data?: StockItem[] }>('/get_stock.php');

  if (!response.ok) {
    throw new Error(response.message);
  }

  const stock = response.data.data;
  if (!Array.isArray(stock)) {
    throw new Error('Format de données invalide.');
  }

  return stock;
}

export async function claimMeal(payload: ClaimPayload): Promise<void> {
  const response = await apiRequest<ClaimResponse>('/claim_meal.php', {
    method: 'POST',
    body: payload,
  });

  if (!response.ok) {
    throw new Error(response.message);
  }

  if (!response.data.success) {
    throw new Error(response.data.error ?? 'Erreur lors de l\'enregistrement.');
  }
}

/**
 * Envoie une réclamation pour chaque plat sélectionné (repas, snack, boisson).
 * La table `reclamation` ne stocke qu'un repas_id par ligne : on envoie donc
 * une ligne par item, avec le même astronaute_id et le même meal_type.
 */
export async function claimAllMeals(
  payloads: ClaimPayload[],
): Promise<void> {
  for (const payload of payloads) {
    await claimMeal(payload);
  }
}
