import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import type { Server } from "node:http";
import { createGatewayApp, type ServiceConfig } from "../index.js";

describe("API Gateway - seguridad de pagos", () => {
  let server: Server;
  let serviceUrl: string;

  beforeAll(async () => {
    // Servicio simulado para comprobar las solicitudes del proxy.
    const downstream = express();

    downstream.use(express.json());

    downstream.all("/api/payments/webhooks/mercadopago", (req, res) => {
      res.json({
        method: req.method,
        path: req.path,
        paymentId: req.query["data.id"],
        signature: req.get("x-signature"),
        requestId: req.get("x-request-id"),
        body: req.body,
      });
    });

    server = downstream.listen(0);

    await new Promise<void>((resolve) => {
      if (server.listening) {
        resolve();
      } else {
        server.once("listening", resolve);
      }
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("No se pudo iniciar el servicio simulado");
    }

    serviceUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  const createTestApp = (url: string) => {
    const services: ServiceConfig[] = [
      {
        name: "payment-service",
        url,
        paths: ["/api/payments"],
        publicPaths: ["/webhooks/mercadopago"],
      },
    ];

    return createGatewayApp(services);
  };

  it("permite recibir webhooks sin JWT y conserva sus datos", async () => {
    const app = createTestApp(serviceUrl);

    const response = await request(app)
      .post("/api/payments/webhooks/mercadopago?data.id=12345")
      .set("x-signature", "ts=123,v1=signature")
      .set("x-request-id", "webhook-test-123")
      .send({
        type: "payment",
        data: { id: "12345" },
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      method: "POST",
      path: "/api/payments/webhooks/mercadopago",
      paymentId: "12345",
      signature: "ts=123,v1=signature",
      requestId: "webhook-test-123",
      body: {
        type: "payment",
        data: { id: "12345" },
      },
    });
  });

  it("rechaza compras sin JWT", async () => {
    const app = createTestApp(serviceUrl);

    const response = await request(app)
      .post("/api/payments/checkout")
      .send({ planId: 1 });

    expect(response.status).toBe(401);
  });

  it("rechaza consultar órdenes sin JWT", async () => {
    const app = createTestApp(serviceUrl);

    const response = await request(app).get("/api/payments/checkout/1");

    expect(response.status).toBe(401);
  });
});
