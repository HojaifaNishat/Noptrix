export type GiftCardStatus = "ACTIVE" | "INACTIVE" | "DEPLETED";

export interface CreateGiftCardInput {
  initialBalance: number;
  currency?: string;
  expiresAt?: Date | null;
  recipientEmail?: string;
  recipientName?: string;
  note?: string;
}

export interface GiftCardListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: GiftCardStatus;
}

export interface RedeemGiftCardInput {
  code: string;
  amount: number;
  currency: string;
}
