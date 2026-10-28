import type { Request, Response, NextFunction, RequestHandler } from "express";

import {
  getPopularSearches,
  getSearchAnalytics,
  getSearchSuggestions,
  searchProducts,
} from "./search.service";

import {
  popularSearchQuerySchema,
  productSearchQuerySchema,
  searchSuggestionQuerySchema,
} from "./search.validator";

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export const searchProductsController = asyncRoute(async (req, res) => {
  const filters = productSearchQuerySchema.parse(req.query);
  const result = await searchProducts(filters);

  res.status(200).json({
    success: true,
    message: "Product search completed successfully",
    data: result,
  });
});

export const searchSuggestionsController = asyncRoute(async (req, res) => {
  const query = searchSuggestionQuerySchema.parse(req.query);
  const suggestions = await getSearchSuggestions(query.q, query.limit);

  res.status(200).json({
    success: true,
    message: "Search suggestions retrieved successfully",
    data: { suggestions },
  });
});

export const popularSearchesController = asyncRoute(async (req, res) => {
  const query = popularSearchQuerySchema.parse(req.query);
  const searches = await getPopularSearches(query.limit);

  res.status(200).json({
    success: true,
    message: "Popular searches retrieved successfully",
    data: { searches },
  });
});

export const searchAnalyticsController = asyncRoute(async (_req, res) => {
  const analytics = await getSearchAnalytics();

  res.status(200).json({
    success: true,
    message: "Search analytics retrieved successfully",
    data: analytics,
  });
});
