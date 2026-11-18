import { z } from "zod";
const list = z.array(z.string().trim().min(1).max(80)).max(30);
export const foodPreferencesSchema = z.strictObject({
  goal: z.enum(["perder grasa", "mantener peso", "ganar masa muscular", "hábitos"]),
  diet: z.enum(["normal", "vegetariana", "vegana"]),
  allergies: list, disliked: list, avoided: list,
  meals: z.number().int().min(3).max(5),
  minutes: z.number().int().min(5).max(180),
  priority: z.enum(["equilibradas", "económicas", "rápidas"]),
});
export const purchaseSchema = z.strictObject({ name: z.string().trim().min(1).max(100), checked: z.boolean() });
export const menuIdSchema = z.coerce.number().int().positive().max(2147483647);
