import {
    Router,
    type Request,
    type Response,
} from "express";

import userRoutes from "../modules/users/user.routes";
import roleRoutes from "../modules/roles/role.routes";
import permissionRoutes from "../modules/permissions/permission.routes";
import rolepermissionRoutes from "../modules/role-permissions/role.permission.routes";
import sessionRoutes from "../modules/sessions/session.routes";
import userAuthRoutes from "../modules/user-auth/user-auth.routes";
import verificationRoutes from "../modules/verification/verification.routes";

const router = Router();

/*
|--------------------------------------------------------------------------
| Route Registry
|--------------------------------------------------------------------------
|
| Central API route registry.
|
| All feature/module routes will be registered here
| gradually as each module is implemented.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| System Routes
|--------------------------------------------------------------------------
*/

/**
 * API health check.
 *
 * This route is intentionally lightweight and should
 * remain available without authentication.
 */
router.get(
    "/health",
    (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message:
                "NOPTRIX API route layer is healthy.",
            timestamp:
                new Date().toISOString(),
        });
    }
);

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| These routes will be connected when the corresponding
| authentication modules are implemented.
|
| Planned:
|
| - /auth
| - /admin/auth
| - /owner/auth
| - /rider/auth
|
|--------------------------------------------------------------------------
*/
router.use(
    "/user-auth",
    userAuthRoutes
);

router.use(
    "/verification",
    verificationRoutes
);
/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /users
| - /customers
| - /employees
|
|--------------------------------------------------------------------------
*/
router.use(
    "/users",
    userRoutes
);

/*
|--------------------------------------------------------------------------
| Role & Permission Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /roles
| - /permissions
|
|--------------------------------------------------------------------------
*/
router.use(
    "/roles",
    roleRoutes
);

router.use(
    "/permissions",
    permissionRoutes
);

router.use(
    "/role-permissions",
    rolepermissionRoutes
);
/*
|--------------------------------------------------------------------------
| Employee & Hiring Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /employees
| - /vacancies
| - /applications
| - /invitations
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Seller Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /sellers
| - /seller-applications
| - /seller-orders
| - /seller-earnings
| - /commissions
| - /payouts
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Catalog Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /brands
| - /categories
| - /subcategories
| - /attributes
| - /products
| - /product-variants
| - /product-images
| - /collections
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Inventory Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /warehouses
| - /inventory
| - /stock-movements
| - /stock-transfers
| - /suppliers
| - /purchases
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Customer Commerce Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /addresses
| - /cart
| - /wishlist
| - /checkout
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Order Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /orders
| - /cancellations
| - /returns
| - /refunds
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Payment Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /payments
| - /payment-methods
| - /transactions
| - /webhooks
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Shipping & Delivery Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /shipping
| - /delivery
| - /delivery-zones
| - /riders
| - /tracking
| - /rider-earnings
| - /cod
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Marketing Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /coupons
| - /promotions
| - /discounts
| - /flash-sales
| - /loyalty
| - /gift-cards
| - /referrals
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Customer Engagement Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /reviews
| - /ratings
| - /questions
| - /notifications
| - /support
| - /tickets
| - /live-chat
| - /complaints
| - /faq
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Finance & Documents Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /invoices
| - /receipts
| - /accounting
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Management & Analytics Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /dashboard
| - /analytics
| - /reports
| - /marketing
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Search & File Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /search
| - /files
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| System Management Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /settings
| - /audit-logs
| - /activity-logs
| - /system-logs
| - /integrations
| - /health
| - /maintenance
|
|--------------------------------------------------------------------------
*/

/*
  sessions
*/

router.use(
    "/sessions",
    sessionRoutes
);

/*
|--------------------------------------------------------------------------
| Route Registry Export
|--------------------------------------------------------------------------
*/

export default router;