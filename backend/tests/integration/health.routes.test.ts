import express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/noptrix-test";
process.env.JWT_SECRET = "test-jwt-secret-that-is-long-enough";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-that-is-long-enough";

const app = express();

beforeAll(async () => {
  const { healthRoutes } =
    await import("../../src/modules/health/health.routes");
  app.use("/api/health", healthRoutes);
});

describe("health routes", () => {
  it("reports liveness without requiring external dependencies", async () => {
    const response = await request(app).get("/api/health/live");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: "alive",
    });
  });

  it("does not report readiness while database and Redis are disconnected", async () => {
    const response = await request(app).get("/api/health/ready");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      status: "not_ready",
      dependencies: {
        database: { status: "unhealthy" },
        redis: { status: "unhealthy" },
      },
    });
  });
});
