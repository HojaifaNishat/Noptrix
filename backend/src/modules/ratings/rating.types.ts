export interface CreateRatingInput {
  productId: string;
  value: number;
}

export interface UpdateRatingInput {
  value: number;
}

export interface RatingListQuery {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
  value?: number;
}
