/**
 * Types du flux repas, partagés entre l'API et l'écran.
 */

/** Un aliment manquant, et l'écart entre besoin et stock. */
export type MissingIngredient = {
  name: string;
  required: number;
  available: number;
};

export type MenuCategory = 'repas' | 'snack' | 'boisson';

export type MenuItem = {
  id: string;
  name: string;
  calories: number;
  image: string;
  ingredients: string[];
  /** Catégorie du plat : repas, snack ou boisson. */
  categorie: MenuCategory;
  /** false dès qu'un aliment de la recette manque en stock. */
  available: boolean;
  /**
   * Portions réalisables avec le stock actuel, limitées par l'aliment le
   * plus rare. null quand la recette ne déclare aucun aliment.
   */
  maxPortions: number | null;
  missing: MissingIngredient[];
};

/** Une ligne d'inventaire, telle que renvoyée par get_stock.php. */
export type StockItem = {
  id: string;
  name: string;
  category: string | null;
  /** Quantité consommable, lots périmés exclus. */
  quantityG: number;
  /** Quantité encore à bord mais périmée. */
  expiredG: number;
  batches: number;
  /** Date ISO du prochain lot à expirer, null s'il n'y en a pas. */
  nextExpiry: string | null;
};

export type ClaimPayload = {
  repas_id: string;
  meal_type: string;
  portion_size: number;
  /**
   * Identifiant de l'astronaute qui réclame. Le serveur s'en sert pour
   * retrouver son nom et son prénom en base — l'app ne les envoie pas,
   * pour qu'ils restent cohérents avec la table astronaute.
   */
  astronaute_id?: string;
  /**
   * Calories choisies avec le curseur, calculées pour la personne. Le serveur
   * s'en sert pour savoir combien de fois la recette retirer du stock.
   */
  kcal?: number;
};
