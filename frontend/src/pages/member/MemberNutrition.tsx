import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { FoodPreferences, NutritionState, Recipe, SavedMenu } from "../../../../shared/types/nutrition";
import "./MemberNutrition.css";

const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const lists = { allergies: "Alergias alimentarias", disliked: "Ingredientes que no te gustan", avoided: "Alimentos que deseas evitar" } as const;

/** Separa por comas los términos ingresados y descarta espacios y duplicados. */
function terms(value: FormDataEntryValue | null) {
  return [...new Set(String(value ?? "").split(",").map(term => term.trim()).filter(Boolean))];
}

/** Muestra los ajustes guardados y entrega un borrador validado al confirmar el formulario. */
function Preferences({
  initial,
  save,
  busy,
  hasActiveMembership,
}: {
  initial: FoodPreferences;
  save: (p: FoodPreferences) => void;
  busy: boolean;
  hasActiveMembership: boolean;
}) {
  /**
   * Procesa las preferencias únicamente cuando la membresía está vigente.
   * Evita solicitar un guardado si el socio no tiene acceso.
   */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasActiveMembership || busy) return;

    const data = new FormData(event.currentTarget);
    save({
      goal: data.get("goal") as FoodPreferences["goal"],
      diet: data.get("diet") as FoodPreferences["diet"],
      priority: data.get("priority") as FoodPreferences["priority"],
      minutes: Number(data.get("minutes")),
      meals: Number(data.get("meals")),
      allergies: terms(data.get("allergies")),
      disliked: terms(data.get("disliked")),
      avoided: terms(data.get("avoided")),
    });
  }
  return (
    <details className="member-card" open>
      <summary>Mis preferencias alimentarias</summary>
      <form onSubmit={submit}>
        <label>
          Objetivo
          <select name="goal" defaultValue={initial.goal}>
            {[
              "hábitos",
              "mantener peso",
              "perder grasa",
              "ganar masa muscular",
            ].map((v) => (
              <option key={v} value={v}>
                {v === "hábitos" ? "Mejorar hábitos saludables" : v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Alimentación
          <select name="diet" defaultValue={initial.diet}>
            {["normal", "vegetariana", "vegana"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Comidas diarias
          <select name="meals" defaultValue={initial.meals}>
            {[3, 4, 5].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Tiempo por comida (minutos)
          <input
            name="minutes"
            type="number"
            required
            min={5}
            max={180}
            defaultValue={initial.minutes}
          />
        </label>
        <label>
          Preferencia
          <select name="priority" defaultValue={initial.priority}>
            {["equilibradas", "económicas", "rápidas"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <p className="nutrition-field-help" id="nutrition-list-help">
          Separa los alimentos de cada lista con comas.
        </p>
        {Object.entries(lists).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              aria-describedby="nutrition-list-help"
              defaultValue={initial[key as keyof typeof lists].join(", ")}
            />
          </label>
        ))}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !hasActiveMembership}
        >
          Guardar preferencias
        </button>
      </form>
    </details>
  );
}

/** Expone cantidades orientativas, técnica y alérgenos de la receta almacenada en esta versión. */
function MealCard({recipe:r}: {recipe:Recipe}) {
  return <details className="nutrition-recipe"><summary>
    <small>{r.type} · {r.minutes} min</small><strong>{r.name}</strong>
  </summary><p>{r.description}</p><p>{r.servings} porción · Alimentación {r.diet}</p>
    <ul>{r.ingredients.map(i => <li key={i.name}>{i.name} · {i.quantity} {i.unit}</li>)}</ul>
    <ol>{r.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p><strong>Alérgenos identificados</strong> · {r.allergens.join(", ") || "Ninguno en los ingredientes de la ficha"}</p>
    <p>{r.reason}</p>
  </details>;
}

/**
 * Gestiona el recomendador nutricional del socio.
 * @param userId - Identificador del usuario autenticado.
 * @param hasActiveMembership - Indica si puede realizar operaciones nutricionales.
 */
export default function MemberNutrition({
  userId,
  hasActiveMembership,
}: {
  userId: string;
  hasActiveMembership: boolean;
}) {
  const cache = useQueryClient();
  const [selected, select] = useState<number>();
  const [day, setDay] = useState(0);
  const [notice, setNotice] = useState("");
  const key = ["nutrition", userId];
  const state = useQuery({queryKey:[...key,"preferences"],queryFn:() => api.nutrition<NutritionState>()});
  const id = selected ?? state.data?.history[0]?.id;
  const menu = useQuery({queryKey:[...key,"menu",id], enabled:!!id,
    queryFn:() => api.nutrition<SavedMenu>("/menus/"+id)});
  const action = useMutation({
    /** Realiza una acción del usuario y espera la actualización de sus datos en caché. */
    mutationFn: async (operation: () => Promise<string>) => {
      setNotice("");
      const message = await operation();
      await cache.invalidateQueries({queryKey:key});
      setNotice(message);
    },
  });
  if (state.isPending) return <p role="status">Cargando tus preferencias alimentarias…</p>;
  if (!state.data) return <section className="member-card member-nutrition"><p role="alert">{state.error?.message ?? "No se pudo cargar tu alimentación."}</p>
    {!api.isAuthenticated() && <a href="/login">Iniciar sesión</a>}
    <button onClick={() => void state.refetch()}>Reintentar</button></section>;
  const data = state.data;
  return (
    <div className="member-nutrition">
      {!hasActiveMembership && (
        <div className="member-card" role="status">
          <p>
            Necesitas una membresía vigente para guardar preferencias, generar
            menús y modificar tu lista de compras. Tus menús anteriores seguirán
            disponibles.
          </p>
        </div>
      )}
      {action.isError && (
        <div role="alert">
          {action.error.message}
          {!api.isAuthenticated() && (
            <p>
              <a href="/login">Iniciar sesión</a>
            </p>
          )}
        </div>
      )}
      {notice && !action.isError && <p role="status">{notice}</p>}
      <Preferences
        initial={data.preferences}
        hasActiveMembership={hasActiveMembership}
        busy={action.isPending}
        save={(p) =>
          action.mutate(async () => {
            await api.nutrition("/preferences", "PUT", p);
            return "Preferencias guardadas. Genera un menú para aplicarlas.";
          })
        }
      />
      <section className="member-card">
        <h2>Mi menú semanal</h2>
        <p>
          Porciones orientativas para una persona. Los tiempos suponen que los
          ingredientes indicados como cocidos ya están listos.
        </p>
        <p>
          Si tienes alergias, revisa las etiquetas y la posible contaminación
          cruzada. Estas sugerencias no sustituyen una evaluación profesional.
        </p>
        <button
          className="btn btn-primary"
          disabled={!hasActiveMembership || !data.saved || action.isPending}
          onClick={() =>
            action.mutate(async () => {
              const result = await api.nutrition<{ id: number }>(
                "/menus",
                "POST",
              );
              select(result.id);
              setDay(0);
              return "Menú semanal generado.";
            })
          }
        >
          {data.history.length ? "Generar nueva versión" : "Generar mi menú"}
        </button>
        {!id && (
          <p>
            {data.saved
              ? "Aún no has generado un menú."
              : "Guarda tus preferencias para generar tu primer menú."}
          </p>
        )}
        {data.history.length > 0 && (
          <label>
            Menú guardado
            <select value={id} onChange={(e) => select(Number(e.target.value))}>
              {data.history.map((v, i) => (
                <option key={v.id} value={v.id}>
                  {i === 0 ? "Activo" : "Histórico"} · #{v.id} ·{" "}
                  {new Date(v.created).toLocaleDateString("es-PE", {
                    timeZone: "America/Lima",
                  })}
                </option>
              ))}
            </select>
          </label>
        )}
        {id && menu.isPending && <p role="status">Cargando menú…</p>}
        {menu.isError && (
          <p role="alert">
            No se pudo cargar el menú.{" "}
            <button onClick={() => void menu.refetch()}>Reintentar</button>
          </p>
        )}
        {menu.data && (
          <>
            <p>Este menú conserva las preferencias de cuando lo generaste.</p>
            {menu.data.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
            <nav aria-label="Día del menú">
              {weekdays.map((v, i) => (
                <button
                  className="fitness-nav-button"
                  key={v}
                  aria-pressed={i === day}
                  onClick={() => setDay(i)}
                >
                  {v}
                </button>
              ))}
            </nav>
            <h3>{weekdays[day]}</h3>
            <div className="nutrition-cards">
              {menu.data.days[day].map((r) => (
                <MealCard key={r.id} recipe={r} />
              ))}
            </div>
          </>
        )}
      </section>
      {menu.data && (
        <details className="member-card">
          <summary>Lista de compras semanal</summary>
          <div className="nutrition-shopping">
            {menu.data.shopping.map((i) => (
              <label key={i.name}>
                <input
                  type="checkbox"
                  checked={menu.data.bought.includes(i.name)}
                  disabled={!hasActiveMembership || action.isPending}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    action.mutate(async () => {
                      await api.nutrition("/menus/" + id + "/shopping", "PUT", {
                        name: i.name,
                        checked,
                      });
                      return "Lista de compras actualizada.";
                    });
                  }}
                />
                {i.name} · {i.quantity} {i.unit}
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
