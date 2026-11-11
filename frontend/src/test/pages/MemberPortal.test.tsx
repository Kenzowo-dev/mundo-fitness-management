import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import MemberPortal from "@/pages/member/MemberPortal";
import { api } from "@/api/client";
import * as authModule from "@/context/useAuth";

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
  userId: memberUser.id,
  dni: "12345678",
  firstName: "Socio",
  lastName: "Prueba",
  email: memberUser.email,
  phone: "+51987654321",
  address: "Calle Uno 123",
  status: "active",
  joinedAt: "2026-09-01",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function renderPortal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MemberPortal />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe("MemberPortal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/portal");

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
    vi.spyOn(api, "getClientMemberships").mockResolvedValue([]);
  });

  it("shows the welcome message and fitness dashboard", async () => {
    renderPortal();

    expect(
      screen.getByRole("heading", { name: /Hola, Socio/i }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", {
        name: /Mi resumen físico/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Mis objetivos fitness",
      }),
    ).toBeInTheDocument();
  });

  it("does not show old payment or renewal sections on Inicio", async () => {
    renderPortal();

    await waitFor(() => {
      expect(api.getClientByUserId).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("heading", {
        name: "Historial de membresías",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Planes y renovaciones",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Mis pagos",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Solicitar renovación",
      }),
    ).not.toBeInTheDocument();

    expect(screen.queryByLabelText(/Plan solicitado/i)).not.toBeInTheDocument();
  });

  it.each(["not-a-plan", "99"])(
    "ignores an old URL plan parameter %s on Inicio",
    async (planId) => {
      window.history.replaceState({}, "", `/portal?plan=${planId}`);

      const renewalSpy = vi.spyOn(api, "createMembershipRenewalRequest");

      renderPortal();

      expect(
        await screen.findByRole("heading", {
          name: /Mi resumen físico/i,
        }),
      ).toBeInTheDocument();

      expect(
        screen.queryByLabelText(/Plan solicitado/i),
      ).not.toBeInTheDocument();

      expect(renewalSpy).not.toHaveBeenCalled();
    },
  );

  it("shows unavailable membership status and allows retry", async () => {
    vi.spyOn(api, "getClientMemberships")
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValue([]);

    renderPortal();

    expect(
      await screen.findByRole("heading", {
        name: "Vigencia no disponible",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reintentar vigencia",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: /Sin membresía vigente/i,
      }),
    ).toBeInTheDocument();

    expect(api.getClientMemberships).toHaveBeenCalledTimes(2);
  });

  it("keeps contact editing outside Inicio", async () => {
    renderPortal();

    expect(
      await screen.findByRole("heading", {
        name: /Mi resumen físico/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Actualizar datos",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /Ver objetivos/i,
      }),
    ).toHaveAttribute("href", "/perfil#goals");
  });

  it("does not create a membership or submit manual renewal requests", async () => {
    const renewalSpy = vi.spyOn(api, "createMembershipRenewalRequest");
    const membershipSpy = vi.spyOn(api, "createMembership");

    renderPortal();

    expect(
      await screen.findByRole("heading", {
        name: /Mi resumen físico/i,
      }),
    ).toBeInTheDocument();

    expect(renewalSpy).not.toHaveBeenCalled();
    expect(membershipSpy).not.toHaveBeenCalled();
  });
});
