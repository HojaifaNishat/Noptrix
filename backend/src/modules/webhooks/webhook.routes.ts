import { Router } from "express";

import {
  generalWebhookController,
  sslCommerzIpnController,
} from "./webhook.controller";

const router = Router();

/*
 * These are public provider callback endpoints.
 * Do not attach customer/admin authentication middleware here.
 *
 * SSLCommerz uses server-side validation of val_id.
 * Other providers must send HMAC-SHA256 in a supported signature header.
 */
router.post("/sslcommerz", sslCommerzIpnController);
router.post("/:provider", generalWebhookController);

export default router;
