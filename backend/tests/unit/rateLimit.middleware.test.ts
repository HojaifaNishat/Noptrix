import express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/noptrix-test";
process.env.JWT_SECRET = "test-jwt-secret-that-is-long-enough";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-that-is-long-enough";

let createRateLimiter: typeof import("../../src/middlewares/rateLimit.middleware").createRateLimiter;

beforeAll(async () => {
  ({ createRateLimiter } =
    await import("../../src/middlewares/rateLimit.middleware"));
});

describe("createRateLimiter", () => {
  it("does not consume rate-limit quota for nested health endpoints", async () => {
    const increment = vi.fn(async () => ({
      totalHits: 1,
      resetTime: new Date(Date.now() + 60_000),
    }));
    const app = express();

    app.use(
      createRateLimiter({
        store: {
          increment,
          decrement: vi.fn(),
          resetKey: vi.fn(),
        },
      }),
    );
    app.get("/api/health/live", (_req, res) => {
      res.sendStatus(200);
    });

    const response = await request(app).get("/api/health/live");

    expect(response.status).toBe(200);
    expect(increment).not.toHaveBeenCalled();
  });

  it("uses the configured store for non-health routes", async () => {
    const increment = vi.fn(async () => ({
      totalHits: 1,
      resetTime: new Date(Date.now() + 60_000),
    }));
    const app = express();

    app.use(
      createRateLimiter({
        store: {
          increment,
          decrement: vi.fn(),
          resetKey: vi.fn(),
        },
      }),
    );
    app.get("/api/catalog", (_req, res) => {
      res.sendStatus(200);
    });

    const response = await request(app).get("/api/catalog");

    expect(response.status).toBe(200);
    expect(increment).toHaveBeenCalledOnce();
  });
});
