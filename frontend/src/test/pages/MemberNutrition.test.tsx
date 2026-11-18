import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MemberNutrition from "../../pages/member/MemberNutrition";
import { api } from "../../api/client";

vi.mock("../../api/client", () => ({ api: { nutrition: vi.fn(), isAuthenticated: () => true } }));

describe("Comidas del socio", () => {
  it("carga preferencias previas, guarda los cambios y pide el menú con validación visible", async () => {
    const preferences = { goal:"hábitos", diet:"vegana", priority:"equilibradas", minutes:30, meals:3,
      allergies:["leche"], avoided:[], disliked:[] };
    const request = vi.mocked(api.nutrition);
    let saved = false;
    request.mockImplementation(async (path,method) => {
      if (method === "PUT") { saved = true; return {}; }
      if (path === "/menus") throw new Error("No hay suficientes recetas compatibles para cena.");
      return { saved, preferences, history:[] };
    });
    render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>
      <MemberNutrition userId="8" hasActiveMembership={true}/>
    </QueryClientProvider>);
    expect(await screen.findByLabelText("Alergias alimentarias")).toHaveValue("leche");
    expect(screen.getByText("Generar mi menú")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Alimentos que deseas evitar"),{target:{value:"quinua, palta"}});
    fireEvent.click(screen.getByText("Guardar preferencias"));
    await waitFor(() => expect(request).toHaveBeenCalledWith("/preferences","PUT",
      expect.objectContaining({diet:"vegana",avoided:["quinua","palta"],allergies:["leche"]})));
    await waitFor(() => expect(screen.getByText("Generar mi menú")).toBeEnabled());
    fireEvent.click(screen.getByText("Generar mi menú"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay suficientes recetas compatibles para cena.");
  });
});
