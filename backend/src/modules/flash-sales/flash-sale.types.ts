export type FlashSaleStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface FlashSaleProductInput {
  productId: string;
  salePrice: number;
  quantityLimit?: number | null;
}

export interface CreateFlashSaleInput {
  name: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  products: FlashSaleProductInput[];
  status?: FlashSaleStatus;
  priority?: number;
}

export type UpdateFlashSaleInput = Partial<CreateFlashSaleInput>;

export interface FlashSaleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: FlashSaleStatus;
}
