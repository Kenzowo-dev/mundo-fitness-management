import { ValidationError } from "@gym/shared/errors/index.js";
import type { FoodPreferences, Ingredient, Menu, Recipe } from "../../../../shared/types/nutrition.js";
import { foods, recipes } from "./nutrition.catalog.js";

/** Normaliza tildes, mayúsculas y espacios para cotejar nombres sin coincidencias parciales ambiguas. */
export function normalizeFood(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

const foodIndex = new Map<string, Set<string>>();
for (const [key, item] of Object.entries(foods)) {
  for (const alias of [key, item.name, ...item.groups, ...item.allergens]) {
    const normalized = normalizeFood(alias);
    const names = foodIndex.get(normalized) ?? new Set<string>();
    names.add(item.name);
    foodIndex.set(normalized, names);
  }
}
// Familias conocidas sin presencia en las fichas actuales. Si se incorporan, prevalece el índice del catálogo.
const absent = new Set(["mani","cacahuate","soja","soya","mariscos","crustaceos","moluscos",
  "almendras","nueces","frutos secos","sesamo","ajonjoli","trigo","cebada","centeno"]);

/** Filtra primero por todas las restricciones. Un término desconocido detiene la recomendación. */
export function compatibleRecipes(p: FoodPreferences): Recipe[] {
  const blocked = new Set<string>();
  for (const term of [...p.allergies, ...p.avoided, ...p.disliked]) {
    const key = normalizeFood(term);
    const names = foodIndex.get(key);
    if (!names && !absent.has(key)) {
      throw new ValidationError("No podemos verificar «" + term + "». Revisa el nombre antes de generar el menú.");
    }
    names?.forEach(name => blocked.add(name));
  }
  return recipes.filter(r => r.minutes <= p.minutes &&
    (p.diet === "normal" || r.diet === p.diet || r.diet === "vegana") &&
    r.ingredients.every(item => !blocked.has(item.name)));
}

/** Ordena opciones compatibles según coste aproximado, tiempo y composición sin calcular calorías. */
function preferenceScore(r: Recipe, p: FoodPreferences): number {
  const names = r.ingredients.map(i => i.name);
  let score = p.priority === "rápidas" ? -r.minutes : 0;
  if (p.priority === "económicas" && r.economical) score += 8;
  if (p.goal === "ganar masa muscular" && names.some(n => /Huevo|Yogur|Lentejas|Garbanzos|Pollo|Bonito|Frejoles/.test(n))) score += 5;
  if (p.goal === "perder grasa" && names.some(n => /Pepino|Espinaca|Tomate|Zanahoria/.test(n))) score += 4;
  if (p.goal === "hábitos" && r.economical) score += 2;
  return score;
}

/** Suma las cantidades de siete días solo para el mismo ingrediente y unidad, para una persona. */
function shoppingList(days: Recipe[][]): Ingredient[] {
  const items = new Map<string, Ingredient>();
  for (const recipe of days.flat()) {
    for (const ingredient of recipe.ingredients) {
      const key = ingredient.name + "|" + ingredient.unit;
      const previous = items.get(key);
      if (previous) previous.quantity += ingredient.quantity;
      else items.set(key, { ...ingredient });
    }
  }
  return [...items.values()].sort((a,b) => a.name.localeCompare(b.name, "es"));
}

/** Arma siete días; minimiza repeticiones antes de puntuar preferencias. Nunca relaja las exclusiones. */
export function generateMenu(p: FoodPreferences): Menu {
  const pool = compatibleRecipes(p);
  const slots: Recipe["type"][] = ["Desayuno", "Almuerzo", "Cena"];
  if (p.meals >= 4) slots.splice(2, 0, "Merienda");
  if (p.meals === 5) slots.splice(1, 0, "Merienda");
  const usage = new Map<string, number>();
  const days: Recipe[][] = [];
  const warnings = new Set<string>();
  for (let day = 0; day < 7; day++) {
    const selected: Recipe[] = [];
    for (const type of slots) {
      const options = pool.filter(r => r.type === type && !selected.some(s => s.id === r.id));
      if (!options.length) throw new ValidationError("No hay suficientes recetas compatibles para " + type.toLowerCase() + ".");
      options.sort((a,b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0) ||
        preferenceScore(b,p) - preferenceScore(a,p) || a.id.localeCompare(b.id));
      const pick = options[0];
      if (usage.has(pick.id)) warnings.add("Se repiten recetas de " + type.toLowerCase() + " para respetar tus preferencias.");
      usage.set(pick.id, (usage.get(pick.id) ?? 0) + 1);
      // La explicación se guarda con esta versión y no altera la ficha original del catálogo.
      const priorityReason = p.priority === "económicas" && pick.economical
        ? " Prioriza ingredientes básicos de uso cotidiano."
        : p.priority === "rápidas" ? " Se priorizó su tiempo de preparación." : "";
      selected.push({ ...pick, reason: pick.reason + priorityReason +
        " Su preparación entra en tus " + p.minutes + " minutos disponibles." });
    }
    days.push(selected);
  }
  return { days, shopping: shoppingList(days), warnings: [...warnings] };
}
