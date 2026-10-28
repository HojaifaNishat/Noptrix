export const REVIEW_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ReviewStatus =
  (typeof REVIEW_STATUSES)[keyof typeof REVIEW_STATUSES];

export interface IReview {
  _id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewListQuery {
  page: number;
  limit: number;
  rating?: number;
  status?: ReviewStatus;
  productId?: string;
}
