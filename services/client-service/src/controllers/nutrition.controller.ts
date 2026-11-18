import type { Response } from "express";
import { z } from "zod";
import { ValidationError } from "@gym/shared/errors/index.js";
import { type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getAuthenticatedClientId } from "./fitness.controller.js";
import { foodPreferencesSchema, purchaseSchema, menuIdSchema } from "../models/nutrition.model.js";
import { nutritionState, savePreferences, createMenu, readMenu, markPurchase, readPreferences } from "../services/nutrition.service.js";
import { compatibleRecipes } from "../services/nutrition.generator.js";

const validationHints: Record<string, string> = {
  goal: "Selecciona uno de los objetivos disponibles.",
  diet: "Selecciona un tipo de alimentación disponible.",
  priority: "Selecciona una preferencia de preparación.",
  meals: "Selecciona entre 3 y 5 comidas diarias.",
  minutes: "Indica entre 5 y 180 minutos completos por comida.",
  allergies: "Indica hasta 30 alergias de 1 a 80 caracteres cada una.",
  disliked: "Indica hasta 30 ingredientes que no te gustan, de 1 a 80 caracteres cada uno.",
  avoided: "Indica hasta 30 alimentos que deseas evitar, de 1 a 80 caracteres cada uno.",
};

/** Valida cuerpo o identificador y convierte los fallos en un error HTTP de entrada. */
function validated<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const field = String(result.error.issues[0]?.path[0] ?? "");
    throw new ValidationError(validationHints[field] ?? "Revisa los datos enviados y el menú seleccionado.");
  }
  return result.data;
}

/** Lee preferencias y versiones vinculadas al token del socio. */
export async function getNutritionState(req: AuthenticatedRequest, res: Response) {
  res.json(await nutritionState(await getAuthenticatedClientId(req)));
}
/** Guarda el formulario validado sin generar entrenamientos ni menús. */
export async function putPreferences(req: AuthenticatedRequest, res: Response) {
  await savePreferences(await getAuthenticatedClientId(req), validated(foodPreferencesSchema, req.body));
  res.json({ saved: true });
}
/** Lista únicamente las recetas compatibles con los ajustes actuales. */
export async function getRecipes(req: AuthenticatedRequest, res: Response) {
  const { preferences } = await readPreferences(await getAuthenticatedClientId(req));
  res.json(compatibleRecipes(preferences));
}
/** Crea una nueva versión para el titular de la sesión. */
export async function postMenu(req: AuthenticatedRequest, res: Response) {
  res.status(201).json(await createMenu(await getAuthenticatedClientId(req)));
}
/** Busca una instantánea por identificador y cliente, incluida cualquier versión histórica. */
export async function getMenu(req: AuthenticatedRequest, res: Response) {
  res.json(await readMenu(await getAuthenticatedClientId(req), validated(menuIdSchema, req.params.id)));
}
/** Actualiza solo el estado de compra del producto solicitado. */
export async function putPurchase(req: AuthenticatedRequest, res: Response) {
  const data = validated(purchaseSchema, req.body);
  await markPurchase(await getAuthenticatedClientId(req), validated(menuIdSchema, req.params.id), data.name, data.checked);
  res.json({ saved: true });
}
