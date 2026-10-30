import { describe, expect, it } from "vitest";
import {
  createFlashSaleSchema,
  updateFlashSaleSchema,
} from "../../src/modules/flash-sales/flash-sale.validator";

describe("flash sale validators", () => {
  it("accepts valid create input", () => {
    const result = createFlashSaleSchema.safeParse({
      body: {
        name: "Weekend sale",
        startsAt: "2026-11-01T10:00:00.000Z",
        endsAt: "2026-11-02T10:00:00.000Z",
        products: [
          {
            productId: "507f1f77bcf86cd799439011",
            salePrice: 12.5,
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("allows partial update input", () => {
    const result = updateFlashSaleSchema.safeParse({
      params: {
        flashSaleId: "507f1f77bcf86cd799439011",
      },
      body: {
        status: "INACTIVE",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects update dates when the end does not follow the start", () => {
    const result = updateFlashSaleSchema.safeParse({
      params: {
        flashSaleId: "507f1f77bcf86cd799439011",
      },
      body: {
        startsAt: "2026-11-02T10:00:00.000Z",
        endsAt: "2026-11-01T10:00:00.000Z",
      },
    });

    expect(result.success).toBe(false);
  });
});
