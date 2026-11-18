import { query, transaction } from "@gym/shared/database/index.js";
import { NotFoundError, ValidationError } from "@gym/shared/errors/index.js";
import type { FoodPreferences, Menu, NutritionState, SavedMenu } from "../../../../shared/types/nutrition.js";
import { generateMenu, normalizeFood } from "./nutrition.generator.js";
import { requireActiveFitnessMembership } from "./fitness.service.js";

const defaults: FoodPreferences = {
  goal: "hábitos", diet: "normal", meals: 3, minutes: 30, priority: "equilibradas",
  allergies: [], disliked: [], avoided: [],
};

/** Lee las preferencias del cliente, heredando alergias, ingredientes y tipo de dieta del perfil previo. */
export async function readPreferences(id: number): Promise<Pick<NutritionState, "preferences" | "saved">> {
  const result = await query<{
    settings: Partial<FoodPreferences> | null; dietary_preferences: string[] | null;
    food_allergies: string[] | null; disliked_ingredients: string[] | null;
  }>(`SELECT n.settings, f.dietary_preferences, f.food_allergies, f.disliked_ingredients
      FROM clients c LEFT JOIN nutrition_preferences n ON n.client_id=c.id
      LEFT JOIN fitness_profiles f ON f.client_id=c.id WHERE c.id=$1`, [id]);
  const row = result.rows[0];
  if (!row) throw new NotFoundError("Cliente", id);
  const legacy = (row.dietary_preferences ?? []).map(normalizeFood);
  const diet = legacy.some(d => /vegan/.test(d)) ? "vegana" :
    legacy.some(d => /vegetarian/.test(d)) ? "vegetariana" : "normal";
  // Las indicaciones antiguas de exclusión también se presentan para revisión antes del primer menú.
  const avoided = legacy.filter(d => /^(sin |evitar )/.test(d)).map(d => d.replace(/^(sin |evitar )/, ""));
  // Un socio puede crear su perfil fitness después del nutricional; conserva ambas fuentes hasta el siguiente guardado.
  return { saved: !!row.settings, preferences: { ...defaults, diet, avoided, ...row.settings,
    allergies: [...new Set([...(row.food_allergies ?? []), ...(row.settings?.allergies ?? [])])],
    disliked: [...new Set([...(row.disliked_ingredients ?? []), ...(row.settings?.disliked ?? [])])],
  } };
}

/**
 * Guarda las preferencias alimentarias de un cliente.
 * Requiere una membresía vigente antes de modificar sus datos.
 * Reutiliza las alergias y los gustos del perfil fitness.
 */
export async function savePreferences(id: number, preferences: FoodPreferences) {
  await requireActiveFitnessMembership(id);

  const { allergies, disliked, ...extra } = preferences;
  await transaction(async db => {
    await db.query("SELECT id FROM clients WHERE id=$1 FOR UPDATE", [id]);
    const fitness = await db.query(`UPDATE fitness_profiles SET food_allergies=$2::jsonb,
      disliked_ingredients=$3::jsonb WHERE client_id=$1`, [id, JSON.stringify(allergies), JSON.stringify(disliked)]);
    await db.query(`INSERT INTO nutrition_preferences(client_id, settings) VALUES($1,$2::jsonb)
      ON CONFLICT(client_id) DO UPDATE SET settings=EXCLUDED.settings`,
      [id, JSON.stringify(fitness.rowCount ? extra : preferences)]);
  });
}

/** Devuelve resúmenes privados por orden de generación; el primero es el menú activo. */
export async function nutritionState(id: number): Promise<NutritionState> {
  const profile = await readPreferences(id);
  const history = await query<{ id: number; created: string }>(
    "SELECT id, created FROM nutrition_menus WHERE client_id=$1 ORDER BY id DESC", [id]);
  return { ...profile, history: history.rows };
}

/** Recupera una versión solo si pertenece al cliente autenticado. */
export async function readMenu(clientId: number, id: number): Promise<SavedMenu> {
  const result = await query<{ menu: Menu; id: number; created: string; bought: string[] }>(
    "SELECT id, created, menu, bought FROM nutrition_menus WHERE client_id=$1 AND id=$2", [clientId,id]);
  const row = result.rows[0];
  if (!row) throw new NotFoundError("Menú",id);
  return { ...row.menu, id: row.id, created: row.created, bought: row.bought };
}

/**
 * Genera y guarda un menú semanal personalizado.
 * Verifica que el cliente tenga una membresía vigente.
 * Conserva una versión independiente del menú generado.
 */
export async function createMenu(clientId: number) {
  await requireActiveFitnessMembership(clientId);

  const state = await readPreferences(clientId);
  if (!state.saved) throw new ValidationError("Guarda tus preferencias antes de generar el menú.");
  const menu = generateMenu(state.preferences);
  const result = await query<{id: number}>(
    "INSERT INTO nutrition_menus(client_id, menu) VALUES($1,$2::jsonb) RETURNING id",
    [clientId, JSON.stringify(menu)]);
  return result.rows[0];
}

/**
 * Marca o desmarca un ingrediente de la lista de compras.
 * Exige una membresía vigente y conserva la lista del cliente.
 */
export async function markPurchase(clientId: number, id: number, name: string, checked: boolean) {
  await requireActiveFitnessMembership(clientId);

  const result = await query(
    `UPDATE nutrition_menus SET bought=CASE
      WHEN $4 AND NOT ($3=ANY(bought)) THEN array_append(bought,$3)
      WHEN NOT $4 THEN array_remove(bought,$3) ELSE bought END
    WHERE client_id=$1 AND id=$2 AND EXISTS
    (SELECT FROM jsonb_array_elements(menu->'shopping') i WHERE i->>'name'=$3)`,
    [clientId,id,name,checked]);
  if (!result.rowCount) throw new NotFoundError("Producto del menú",id);
}
