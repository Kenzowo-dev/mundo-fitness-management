import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FoodPreferences } from "../../../shared/types/nutrition.js";
import { recipes } from "../src/services/nutrition.catalog.js";
import { compatibleRecipes, generateMenu } from "../src/services/nutrition.generator.js";
import { foodPreferencesSchema } from "../src/models/nutrition.model.js";
import { nutritionState, readMenu, createMenu, savePreferences, markPurchase } from "../src/services/nutrition.service.js";
import { authenticate, authorize, type AuthenticatedRequest } from "../src/middleware/auth.middleware.js";
import type { Response } from "express";
import express, { type ErrorRequestHandler } from "express";
import request from "supertest";
import nutritionRoutes from "../src/routes/nutrition.routes.js";

const db = vi.hoisted(() => ({ query: vi.fn(), transaction: vi.fn() }));
vi.mock("@gym/shared/database/index.js", () => db);
const base: FoodPreferences = { diet:"normal", goal:"hábitos", meals:3, minutes:30,
  priority:"equilibradas", allergies:[], disliked:[], avoided:[] };

describe("Catálogo y generador de alimentación", () => {
  it("incluye al menos 40 fichas distintas con ingredientes, alérgenos y pasos", () => {
    expect(new Set(recipes.map(r => r.name)).size).toBeGreaterThanOrEqual(40);
    expect(new Set(recipes.map(r => r.id)).size).toBe(recipes.length);
    expect(recipes.every(r => r.ingredients.every(i => i.quantity > 0 && i.unit) && r.steps.length >= 2)).toBe(true);
  });
  it.each([3,4,5])("genera siete días con %i comidas y minimiza las repeticiones", meals => {
    const menu = generateMenu({...base, meals});
    expect(menu.days).toHaveLength(7);
    for (const day of menu.days) expect(new Set(day.map(r => r.id)).size).toBe(meals);
    expect(new Set(menu.days.map(day => day[0].id)).size).toBe(7);
    expect(menu).toEqual(generateMenu({...base, meals}));
  });
  it.each(["vegetariana","vegana"] as const)("respeta alimentación %s", diet => {
    const menu = generateMenu({...base,diet});
    expect(menu.days.flat().every(r => r.diet === diet || r.diet === "vegana")).toBe(true);
  });
  it("excluye alérgenos, familias y nombres alternativos sin distinguir tildes", () => {
    const pool = compatibleRecipes({...base,allergies:["LÁCTEOS","huevo","gluten"], avoided:["quinoa"],disliked:["aguacate"]});
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.flatMap(r => r.ingredients.map(i => i.name)).join(" ")).not.toMatch(/Yogur|Huevo|Avena|Quinua|Palta/);
  });
  it("rechaza cualquier restricción no verificable", () => {
    expect(() => generateMenu({...base, allergies:["producto desconocido"]})).toThrow("No podemos verificar");
  });
  it("informa de opciones insuficientes sin ampliar el tiempo disponible", () => {
    expect(() => generateMenu({...base,minutes:5})).toThrow("No hay suficientes");
    expect(compatibleRecipes({...base,minutes:15}).every(r => r.minutes<=15)).toBe(true);
  });
  it("suma todos los usos de un ingrediente en su unidad", () => {
    const menu = generateMenu(base);
    for (const item of menu.shopping) {
      const total = menu.days.flat().flatMap(r => r.ingredients)
        .filter(i => i.name === item.name && i.unit === item.unit).reduce((sum,i) => sum+i.quantity,0);
      expect(item.quantity).toBe(total);
    }
  });
  it("cambia la selección según prioridad y objetivo", () => {
    expect(generateMenu({...base,priority:"rápidas"}).days).not.toEqual(generateMenu({...base,priority:"económicas"}).days);
    expect(generateMenu({...base,goal:"ganar masa muscular"}).days).not.toEqual(generateMenu(base).days);
  });
  it.each([{meals:2},{meals:6},{minutes:0},{unknown:true},{allergies:[" "]}])("rechaza entradas inválidas %j", fields => {
    expect(foodPreferencesSchema.safeParse({...base,...fields}).success).toBe(false);
  });
});

describe("Persistencia y acceso privado", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM client_memberships")) {
        return { rows: [{ has_membership: true }] };
      }

      return { rows: [], rowCount: 0 };
    });
  });
  it("rechaza el acceso anónimo a todas las rutas antes de consultar la base", async () => {
    const app = express();
    app.use("/nutrition", nutritionRoutes);
    /** Expone en la prueba el estado HTTP producido por la autenticación real. */
    const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error.statusCode ?? 500).end();
    };
    app.use(errorHandler);
    const http = request(app);
    for (const [method, path] of [["get","/nutrition"], ["get","/nutrition/recipes"],
      ["put","/nutrition/preferences"], ["post","/nutrition/menus"],
      ["get","/nutrition/menus/1"], ["put","/nutrition/menus/1/shopping"]] as const) {
      await http[method](path).expect(401);
    }
    expect(db.query).not.toHaveBeenCalled();
  });
  it.each([0,1])("guarda las restricciones una sola vez con %i perfiles previos", async count => {
    const sql = vi.fn().mockResolvedValue({rowCount:count});
    db.transaction.mockImplementation(callback => callback({query:sql}));
    const preferences = {...base,allergies:["leche"]};
    await savePreferences(8,preferences);
    const [statement,params] = sql.mock.calls[2];
    expect(statement).toContain("ON CONFLICT(client_id)");
    expect(params[0]).toBe(8);
    expect(JSON.parse(params[1]).allergies).toEqual(count ? undefined : ["leche"]);
    expect(sql.mock.calls[1][1]).toEqual([8,'["leche"]','[]']);
  });
  it("lee gustos históricos y solo versiones del titular en orden reciente", async () => {
    db.query.mockResolvedValueOnce({rows:[{settings:null,dietary_preferences:["vegetariana"],food_allergies:["leche"]}]})
      .mockResolvedValueOnce({rows:[{id:4},{id:2}]});
    const state = await nutritionState(8);
    expect(state.preferences).toMatchObject({diet:"vegetariana",allergies:["leche"]});
    expect(state.history.map(v => v.id)).toEqual([4,2]);
    expect(db.query.mock.calls[1][0]).toContain("WHERE client_id=$1 ORDER BY id DESC");
  });
  it("inserta una nueva versión completa sin sobrescribir la anterior", async () => {
    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM client_memberships")) {
        return { rows: [{ has_membership: true }] };
      }

      if (sql.includes("SELECT n.settings")) {
        return { rows: [{ settings: base }] };
      }

      if (sql.includes("INSERT INTO nutrition_menus")) {
        return { rows: [{ id: 7 }] };
      }

      return { rows: [], rowCount: 0 };
    });

    expect(await createMenu(8)).toEqual({ id: 7 });

    const insert = db.query.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO nutrition_menus"),
    );

    expect(insert).toBeDefined();
    expect(JSON.parse(insert![1][1]).days).toHaveLength(7);
  });
  it("impide consultar o marcar compras de una versión ajena", async () => {
    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM client_memberships")) {
        return { rows: [{ has_membership: true }] };
      }

      return { rows: [], rowCount: 0 };
    });
    await expect(readMenu(7, 4)).rejects.toMatchObject({ statusCode: 404 });
    await expect(markPurchase(7, 4, "Mango", true)).rejects.toMatchObject({
      statusCode: 404,
    });
    // Comprueba la propiedad del menú sin incluir la consulta de membresía.
     const consultasMenu = db.query.mock.calls.filter(
      ([sql]) =>
        sql.includes("FROM nutrition_menus") ||
        sql.includes("UPDATE nutrition_menus"),
    );

    expect(consultasMenu).toHaveLength(2);

    for (const [sql, params] of consultasMenu) {
      expect(sql).toContain("WHERE client_id=$1 AND id=$2");
      expect(params.slice(0, 2)).toEqual([7, 4]);
    }
  });
  it("exige autenticación y autorización de socio", () => {
    const next = vi.fn();
    expect(() => authenticate({headers:{}} as AuthenticatedRequest, {} as Response,next)).toThrow();
    expect(() => authorize("member")({user:{role:"staff"}} as AuthenticatedRequest,{} as Response,next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });
});
