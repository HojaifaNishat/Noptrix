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
import employeeAuthRoutes from "../modules/employee-auth/employee-auth.routes";
import employeeInvitationRoutes from "../modules/employee-invitations/invitation.routes";
import adminInvitationRoutes from "../modules/admin-invitations/admin-invitation.routes";
import { ownerAuthRouter } from "../modules/owner-auth/owner-auth.routes";
import { ownerRouter } from "../modules/owners/owner.routes";
import adminAuthRouter  from "../modules/admin-auth/admin-auth.routes";
import adminRoutes from "../modules/admins/admin.routes";
import vacancyRoutes from "../modules/job-vacancies/vacancy.routes";
import jobApplicationRoutes from "../modules/job-applications/application.routes";
import categoryRoutes from "../modules/categories/category.routes";
import productVariantRoutes from "../modules/product-variants/variant.routes";
import productTagRoutes from "../modules/product-tags/tag.routes";
import productImageRoutes from "../modules/product-images/image.routes";
import productRoutes from "../modules/products/product.routes";
import subcategoryRoutes from "../modules/subcategories/subcategory.routes";
import sellerApplicationRoutes from "../modules/seller-applications/seller-application.routes";
import sellerRoutes from "../modules/sellers/seller.routes";
import riderRoutes from "../modules/riders/rider.routes";
import trackingRoutes from "../modules/tracking/tracking.routes";
import riderAuthRoutes from "../modules/rider-auth/rider-auth.routes";
import riderEarningRoutes from "../modules/rider-earnings/riderEarning.routes";
import sellerAuthRoutes from "../modules/seller-auth/seller-auth.routes";
import communicationRoutes from "../modules/communication/communication.routes";
import liveChatRoutes from "../modules/live-chat/live-chat.routes";
import supportRoutes from "../modules/support/support.routes";
import faqRoutes from "../modules/faq/faq.routes";
import questionRoutes from "../modules/questions/question.routes";
import ticketRoutes from "../modules/tickets/ticket.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import notificationTemplateRoutes from "../modules/notifications/notification-template.routes";
import currencyRoutes from "../modules/currencies/currency.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import codRoutes from "../modules/cod/cod.routes";
import transactionRoutes from "../modules/transactions/transaction.routes";
import paymentRoutes from "../modules/payments/payment.routes";
import { auditLogsRoutes } from "../modules/audit-logs/audit-log.routes";
import { activityLogsRoutes } from "../modules/activity-logs/activity-log.routes";
import { systemLogsRoutes } from "../modules/system-logs/system-log.routes";
import { integrationsRoutes } from "../modules/integrations/integration.routes";
import { healthRoutes } from "../modules/health/health.routes";
import { maintenanceRoutes } from "../modules/maintenance/maintenance.routes";
import attributeRoutes from "../modules/attributes/attribute.routes";
import brandRoutes from "../modules/brands/brand.routes";

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
| - /seller/auth
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

router.use(
    "/employee-auth",
    employeeAuthRoutes
);

router.use(
    "/admins",
    adminRoutes
);

router.use(
    "/rider-auth",
    riderAuthRoutes
);

router.use(
    "/seller-auth",
    sellerAuthRoutes
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

router.use(
    "/admin-invitations",
    adminInvitationRoutes
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

router.use(
    "/job-applications",
    jobApplicationRoutes,
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

router.use(
    "/attributes",
    attributeRoutes,
);

router.use(
    "/brands",
    brandRoutes,
);

router.use(
    "/categories",
    categoryRoutes,
);

router.use("/products", productRoutes);
router.use("/product-images", productImageRoutes);
router.use("/product-tags", productTagRoutes);
router.use("/product-variants", productVariantRoutes);

/*
|--------------------------------------------------------------------------
| Subcategory Routes
|--------------------------------------------------------------------------
*/

router.use(
    "/subcategories",
    subcategoryRoutes,
);

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

router.use(
    "/rider-earnings",
    riderEarningRoutes,
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
| Dashboard Routes
|--------------------------------------------------------------------------
|
| - /dashboard/overview
|
|--------------------------------------------------------------------------
*/

router.use(
    "/dashboard",
    dashboardRoutes,
);

router.use(
    "/live-chat",
    liveChatRoutes,
);

router.use(
    "/tickets",
    ticketRoutes,
);

router.use(
    "/support",
    supportRoutes,
);

router.use(
    "/faq",
    faqRoutes,
);

router.use(
    "/questions",
    questionRoutes,
);


/*
|--------------------------------------------------------------------------
| Communication Routes
|--------------------------------------------------------------------------
|
| Planned:
|
| - /communication/messages
| - /communication/announcements
|
|--------------------------------------------------------------------------
*/

router.use(
    "/communication",
    communicationRoutes,
);

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
| Notification Template Routes
|--------------------------------------------------------------------------
|
| Admin-managed notification templates.
|
| - /notification-templates
|
|--------------------------------------------------------------------------
*/

router.use(
    "/notification-templates",
    notificationTemplateRoutes,
);

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
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| Administrative system settings.
|
| - GET /settings
| - GET /settings/:category
| - PATCH /settings/:category
|
|--------------------------------------------------------------------------
*/

router.use(
    "/currencies",
    currencyRoutes,
);

router.use(
    "/settings",
    settingsRoutes,
);

router.use(
    "/payments",
    paymentRoutes,
);

router.use(
    "/transactions",
    transactionRoutes,
);

router.use("/cod", codRoutes);


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

router.use("/health", healthRoutes);
router.use("/audit-logs", auditLogsRoutes);
router.use("/activity-logs", activityLogsRoutes);
router.use("/system-logs", systemLogsRoutes);
router.use("/integrations", integrationsRoutes);
router.use("/maintenance", maintenanceRoutes);

export default router;
