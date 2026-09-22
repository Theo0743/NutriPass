/**
 * Accès aux repas et réclamations via l'API PHP.
 *
 * Reprend la même couche de transport (apiRequest) que crewApi : clé API,
 * timeout, parsing JSON et gestion d'erreurs centralisés.
 */

import { apiRequest } from './apiService';
import type { ClaimPayload, MenuItem } from '../types/meal';

type ApiMeal = {
  id: string;
  name: string;
  calories: number;
  image: string;
  ingredients: string[];
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

  return meals.map((m) => ({
    id: String(m.id),
    name: m.name,
    calories: m.calories,
    image: m.image,
    ingredients: m.ingredients ?? [],
  }));
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
