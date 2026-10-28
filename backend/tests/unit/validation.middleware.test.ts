import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validateRequest } from "../../src/middlewares/validation.middleware";

describe("validateRequest", () => {
  it("passes transformed query, params, and body values to controllers", async () => {
    const app = express();
    app.use(express.json());
    app.post(
      "/items/:itemId",
      validateRequest({
        params: z.object({
          itemId: z.string().regex(/^[a-f\d]{24}$/i),
        }),
        query: z.object({
          page: z.coerce.number().int().default(1),
        }),
        body: z.object({
          quantity: z.coerce.number().int().positive(),
        }),
      }),
      (req, res) => {
        res.json({
          params: req.params,
          query: req.query,
          body: req.body,
        });
      },
    );

    const response = await request(app)
      .post("/items/507f1f77bcf86cd799439011?page=3")
      .send({ quantity: "2" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      params: { itemId: "507f1f77bcf86cd799439011" },
      query: { page: 3 },
      body: { quantity: 2 },
    });
  });

  it("rejects invalid request parts before reaching the controller", async () => {
    const app = express();
    app.use(express.json());
    app.post(
      "/items",
      validateRequest({
        body: z.object({
          quantity: z.coerce.number().int().positive(),
        }),
      }),
      (_req, res) => {
        res.sendStatus(204);
      },
    );

    const response = await request(app)
      .post("/items")
      .send({ quantity: "not-a-number" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ target: "body" })]),
    );
  });
});
