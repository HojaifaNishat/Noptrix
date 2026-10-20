import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  createAddressController,
  deleteAddressController,
  getAddressController,
  getDefaultAddressController,
  listAddressesController,
  setDefaultAddressController,
  updateAddressController,
} from "./address.controller";

import {
  addressIdSchema,
  addressQuerySchema,
  createAddressSchema,
  updateAddressSchema,
} from "./address.validator";

const router = Router();

router.use(userAuth);

// Default address must be registered before "/:id".
router.get("/default", getDefaultAddressController);

router.get(
  "/",
  validate(addressQuerySchema, "query"),
  listAddressesController,
);

router.post(
  "/",
  validate(createAddressSchema),
  createAddressController,
);

router.patch(
  "/:id/default",
  validate(addressIdSchema, "params"),
  setDefaultAddressController,
);

router.get(
  "/:id",
  validate(addressIdSchema, "params"),
  getAddressController,
);

router.patch(
  "/:id",
  validate(addressIdSchema, "params"),
  validate(updateAddressSchema),
  updateAddressController,
);

router.delete(
  "/:id",
  validate(addressIdSchema, "params"),
  deleteAddressController,
);

export default router;
