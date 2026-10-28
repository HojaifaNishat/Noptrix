import { Router } from "express";

import {
  popularSearchesController,
  searchAnalyticsController,
  searchProductsController,
  searchSuggestionsController,
} from "./search.controller";

import {
  popularSearchQuerySchema,
  productSearchQuerySchema,
  searchSuggestionQuerySchema,
} from "./search.validator";

import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { requirePermissionMatch } from "../../middlewares/permission.middleware";
import { validateRequest } from "../../middlewares/validation.middleware";

const router = Router();

// Public storefront search.
router.get(
  "/",
  validateRequest({ query: productSearchQuerySchema }),
  searchProductsController,
);

// Public autocomplete.
router.get(
  "/suggestions",
  validateRequest({ query: searchSuggestionQuerySchema }),
  searchSuggestionsController,
);

// Public popular searches from the last 30 days.
router.get(
  "/popular",
  validateRequest({ query: popularSearchQuerySchema }),
  popularSearchesController,
);

// Admin analytics.
router.get(
  "/admin/analytics",
  adminAuth,
  requirePermissionMatch("products.read"),
  searchAnalyticsController,
);

export default router;
