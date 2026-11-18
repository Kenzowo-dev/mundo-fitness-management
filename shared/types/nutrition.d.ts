export interface FoodPreferences {
  goal: "hábitos" | "mantener peso" | "perder grasa" | "ganar masa muscular";
  diet: "normal" | "vegetariana" | "vegana";
  allergies: string[];
  disliked: string[];
  avoided: string[];
  meals: number;
  minutes: number;
  priority: "equilibradas" | "rápidas" | "económicas";
}
export interface Ingredient { name: string; quantity: number; unit: string }
export interface Recipe {
  id: string;
  name: string;
  type: "Desayuno" | "Almuerzo" | "Cena" | "Merienda";
  description: string;
  ingredients: Ingredient[];
  servings: number;
  steps: string[];
  minutes: number;
  diet: FoodPreferences["diet"];
  allergens: string[];
  economical: boolean;
  reason: string;
}
export interface Menu {
  days: Recipe[][];
  shopping: Ingredient[];
  warnings: string[];
}
export interface SavedMenu extends Menu { id: number; created: string; bought: string[] }
export interface NutritionState {
  preferences: FoodPreferences;
  saved: boolean;
  history: { id: number; created: string }[];
}
