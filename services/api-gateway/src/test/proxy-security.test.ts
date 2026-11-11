import { describe, it, expect } from "vitest";
import request from "supertest";
import { createGatewayApp } from "../index.js";

describe("API Gateway - proxy seguro", () => {
  it("mantiene activo el rate limiting con X-Forwarded-For", async () => {
    const app = createGatewayApp([]);

    const response = await request(app)
      .get("/services")
      .set("X-Forwarded-For", "203.0.113.10");

    expect(response.status).toBe(200);
    expect(response.headers["ratelimit-limit"]).toBeDefined();
  });

  it("agrupa solicitudes con la misma IP reenviada", async () => {
    const app = createGatewayApp([]);

    const first = await request(app)
      .get("/services")
      .set("X-Forwarded-For", "198.51.100.10");

    const second = await request(app)
      .get("/services")
      .set("X-Forwarded-For", "198.51.100.10");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const firstRemaining = Number(first.headers["ratelimit-remaining"]);
    const secondRemaining = Number(second.headers["ratelimit-remaining"]);

    expect(secondRemaining).toBe(firstRemaining - 1);
  });
});
