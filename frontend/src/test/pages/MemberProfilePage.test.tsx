import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import MemberProfilePage from "@/pages/member/MemberProfilePage";
import { api } from "@/api/client";
import * as authModule from "@/context/useAuth";

// Aislamos las secciones ajenas a la edición de datos personales.
vi.mock("@/components/member/MemberAvatarProfile", () => ({
  default: () => null,
}));

vi.mock("@/components/member/MemberPhysicalProfile", () => ({
  default: () => null,
}));

vi.mock("@/components/member/MemberGoals", () => ({
  default: () => null,
}));

vi.mock("@/components/member/MemberProgressCharts", () => ({
  default: () => null,
}));

const memberUser = {
  id: 42,
  email: "member@example.test",
  firstName: "Socio",
  lastName: "Prueba",
  role: "member",
  isActive: true,
  emailVerified: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const memberClient = {
  id: 12,
  userId: 42,
  dni: "12345678",
  firstName: "Socio",
  lastName: "Prueba",
  email: "member@example.test",
  phone: "+51987654321",
  address: "Calle Uno 123",
  emergencyContactName: "Contacto Prueba",
  emergencyContactPhone: "+51911111111",
  status: "active",
  joinedAt: "2026-09-01",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/perfil"]}>
        <MemberProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MemberProfilePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(authModule, "useAuth").mockReturnValue({
      user: memberUser,
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof authModule.useAuth>);

    vi.spyOn(api, "getClientByUserId").mockResolvedValue(memberClient);
  });

  it("allows a member to update their contact information from the profile", async () => {
    const updateProfile = vi
      .spyOn(api, "updateOwnClientProfile")
      .mockResolvedValue({
        ...memberClient,
        phone: "+51999999999",
      });

    renderProfile();

    fireEvent.click(
      await screen.findByRole("button", { name: "Actualizar datos" }),
    );

    const phoneField = screen.getByLabelText("Teléfono", {
      exact: true,
    });

    expect(phoneField).toHaveValue("987654321");

    fireEvent.change(phoneField, {
      target: { value: "999 999 999" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          phone: "999999999",
          emergencyContactPhone: "911111111",
        }),
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tus datos de contacto se actualizaron.",
    );

    expect(
      screen.queryByRole("textbox", { name: "Documento" }),
    ).not.toBeInTheDocument();
  });

  it("filters signs out of the contact fields and validates them before saving", async () => {
    const updateProfile = vi.spyOn(api, "updateOwnClientProfile").mockResolvedValue(memberClient);

    renderProfile();
    fireEvent.click(await screen.findByRole("button", { name: "Actualizar datos" }));

    const phoneField = screen.getByLabelText("Teléfono", { exact: true });
    const addressField = screen.getByLabelText("Dirección");
    const emergencyName = screen.getByLabelText("Nombre de contacto de emergencia");
    const emergencyPhone = screen.getByLabelText("Teléfono de contacto de emergencia");

    fireEvent.change(phoneField, { target: { value: "9a8b7-654" } });
    fireEvent.change(addressField, { target: { value: "Av. Perú 450, Dpto. 3-B $%&!" } });
    fireEvent.change(emergencyName, { target: { value: "María2 López!" } });
    fireEvent.change(emergencyPhone, { target: { value: "12345678901" } });

    expect(phoneField).toHaveValue("987654");
    expect(addressField).toHaveValue("Av. Perú 450, Dpto. 3-B ");
    expect(emergencyName).toHaveValue("María López");
    expect(emergencyPhone).toHaveValue("123456789");

    fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }));

    expect(await screen.findAllByText("El teléfono debe tener 9 dígitos y comenzar con 9.")).toHaveLength(2);
    expect(updateProfile).not.toHaveBeenCalled();

    fireEvent.change(phoneField, { target: { value: "987654321" } });
    fireEvent.change(emergencyPhone, { target: { value: "912345678" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(42, {
        phone: "987654321",
        address: "Av. Perú 450, Dpto. 3-B",
        emergencyContactName: "María López",
        emergencyContactPhone: "912345678",
      }),
    );
  });
});
