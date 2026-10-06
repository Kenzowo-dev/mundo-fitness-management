import { expect, test, type Page } from "@playwright/test";

const plan = {
  id: 3,
  name: "Plan mensual",
  description: "Tu plan de gimnasio",
  durationDays: 30,
  price: 90,
  currency: "PEN",
  features: ["Acceso al gimnasio"],
  includesClasses: false,
  includesSauna: false,
  includesPersonalTrainer: false,
  isActive: true,
  sortOrder: 1,
};
const client = {
  id: 12,
  userId: 42,
  dni: "00000000",
  firstName: "Andrea",
  lastName: "Prueba",
  email: "demo@example.test",
  phone: "",
  status: "active",
  joinedAt: new Date().toISOString(),
};
const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

async function mockApi(page: Page, role?: string) {
  if (role)
    await page.addInitScript(() =>
      localStorage.setItem("accessToken", "ui-test-only"),
    );
  const user = {
    id: 42,
    firstName: "Andrea",
    lastName: "Prueba",
    email: "demo@example.test",
    role: role ?? "member",
    isActive: true,
    emailVerified: true,
  };
  await page.route(
    /\/api\/(?:auth|clients|memberships|payments)(?:\/|\?|$)/,
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (route.request().method() === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
          },
        });
      let body: unknown = [];
      if (path === "/api/auth/me") body = user;
      else if (path === "/api/auth/register")
        body = {
          user,
          tokens: {
            accessToken: "ui-test-only",
            refreshToken: "ui-refresh-only",
            expiresIn: 3600,
          },
        };
      else if (path.includes("/plans")) body = [plan];
      else if (path === "/api/clients/stats")
        body = { totalClients: 125, activeClients: 110 };
      else if (path === "/api/memberships/stats")
        body = { activeMemberships: 104, visitsToday: 32 };
      else if (path === "/api/payments/stats")
        body = { revenueThisMonth: [{ currency: "PEN", amount: 8450 }] };
      else if (path === "/api/clients/reports")
        body = { clientsByMonth: [], clientsByStatus: [] };
      else if (path === "/api/memberships/reports")
        body = { membershipsByStatus: [], visitsByDay: [] };
      else if (path === "/api/clients/user/42") body = client;
      else if (path === "/api/clients") body = { data: [client], pagination };
      else if (path.startsWith("/api/payments") && !path.endsWith("/reports"))
        body = { data: [], pagination: { ...pagination, total: 0 } };
      return route.fulfill({
        json: body,
        headers: { "access-control-allow-origin": "*" },
      });
    },
  );
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}

for (const theme of ["light", "dark"]) {
  test(`public navigation and editable content, ${theme}`, async ({
    page,
  }, testInfo) => {
    await mockApi(page);
    await page.addInitScript(
      (value) => localStorage.setItem("mf-theme-v1", value),
      theme,
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /tu próxima/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Plan mensual" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("link", { name: /conoce el gimnasio/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /me interesa este plan/i }).click();
    await expect(page).toHaveURL(/registro\?plan=3/);
    await expect(page.getByText(/te interesa plan mensual/i)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.screenshot({
      path: testInfo.outputPath(`register-${theme}.png`),
      fullPage: true,
    });
    await page.goto("/");
    await page.screenshot({
      path: testInfo.outputPath(`landing-${theme}.png`),
      fullPage: true,
    });
    await noOverflow(page);
  });
}

for (const width of [320, 390, 900, 1440]) {
  test(`public and auth fit width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page);
    for (const path of [
      "/",
      "/login",
      "/registro",
      "/forgot-password",
      "/reset-password?token=demo",
    ]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await noOverflow(page);
      const themeControl = page.getByRole("button", { name: /activar tema/i });
      await themeControl.click();
      await expect(themeControl).toBeVisible();
    }
    await page.goto("/");
    if (width < 760) {
      await page.getByRole("button", { name: "Abrir navegación" }).click();
      await expect(
        page.getByRole("link", { name: "Planes", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Abrir navegación" }),
      ).toBeFocused();
    }
  });
}

for (const role of ["admin", "receptionist"]) {
  test(`${role} screens in both themes`, async ({ page }, testInfo) => {
    await mockApi(page, role);
    for (const theme of ["light", "dark"]) {
      await page.addInitScript(
        (value) => localStorage.setItem("mf-theme-v1", value),
        theme,
      );
      for (const path of [
        "/dashboard",
        "/clientes",
        "/membresias",
        "/pagos",
        "/informes",
        ...(role === "admin" ? ["/configuracion"] : []),
      ]) {
        await page.goto(path);
        await expect(page.locator(".page-title")).toBeVisible();
        await expect(page.locator(".page-title")).not.toHaveText("");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await noOverflow(page);
        if (path === "/dashboard")
          await page.screenshot({
            path: testInfo.outputPath(`${role}-${theme}.png`),
            fullPage: true,
          });
      }
    }
    if (role === "receptionist") {
      await page.goto("/configuracion");
      await expect(page).toHaveURL(/dashboard/);
      await expect(
        page.getByRole("link", { name: "Configuración" }),
      ).toHaveCount(0);
    }
  });
}

for (const width of [390, 900]) {
  test(`staff drawer focus at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page, "receptionist");
    await page.goto("/dashboard");
    const trigger = page.getByRole("button", {
      name: "Abrir menú de navegación",
    });
    await expect(page.locator("#sidebar")).toBeHidden();
    await trigger.click();
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    await expect(
      page.locator("#sidebar").getByRole("button", { name: "Cerrar menú", exact: true }),
    ).toBeFocused();
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest("#sidebar"),
        ),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
    await expect(page.locator("#sidebar")).toBeHidden();
  });
}

test("member intent, role isolation, theme and mobile", async ({
  page,
}, testInfo) => {
  await mockApi(page, "member");
  await page.goto("/registro?plan=3");
  await expect(page).toHaveURL(/portal\?plan=3/);
  await expect(page.getByLabel("Plan solicitado")).toHaveValue("3");
  await expect(
    page.getByRole("heading", { name: "Planes y renovaciones" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /activar tema/i }).click();
  await page.screenshot({
    path: testInfo.outputPath("member-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("member-mobile.png"),
    fullPage: true,
  });
  await page.goto("/clientes");
  await expect(page).toHaveURL(/portal/);
  await expect(
    page.getByRole("link", { name: "Socios", exact: true }),
  ).toHaveCount(0);
});

test("public plans failure has a useful next step", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/memberships/plans/public", (route) =>
    route.fulfill({ status: 503, json: { error: { message: "Test outage" } } }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Volver a intentar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Consultar en el gimnasio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /tu próxima/i }),
  ).toBeVisible();
});
