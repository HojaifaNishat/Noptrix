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
import customerRoutes from "../modules/customers/customer.routes";
import employeeRoutes from "../modules/employees/employee.routes";
import employeeInvitationRoutes from "../modules/employee-invitations/invitation.routes";
import { ownerAuthRouter } from "../modules/owner-auth/owner-auth.routes";
import { ownerRouter } from "../modules/owners/owner.routes";
import adminAuthRouter  from "../modules/admin-auth/admin-auth.routes";
import vacancyRoutes from "../modules/job-vacancies/vacancy.routes";
import sellerApplicationRoutes from "../modules/seller-applications/seller-application.routes";
import sellerRoutes from "../modules/sellers/seller.routes";
import riderRoutes from "../modules/riders/rider.routes";
import trackingRoutes from "../modules/tracking/tracking.routes";

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
    "/owner-auth",
    ownerAuthRouter
);
router.use(
    "/owners",
    ownerRouter
);

router.use(
    "/verification",
    verificationRoutes
);

router.use(
    "/admin-auth",
    adminAuthRouter
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

router.use(
    "/customers",
    customerRoutes
);

router.use(
    "/employees",
    employeeRoutes
);

router.use(
    "/employee-invitations",
    employeeInvitationRoutes
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

router.use(
    "/job-vacancies",
    vacancyRoutes,
);

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

router.use(
    "/sellers",
    sellerRoutes,
);

router.use(
    "/seller-applications",
    sellerApplicationRoutes,
);

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
router.use(
    "/riders",
    riderRoutes,
);

router.use(
    "/tracking",
    trackingRoutes,
);

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