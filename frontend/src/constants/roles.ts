export const ROLES = {
    OWNER: "owner",

    SUPER_ADMIN: "super-admin",
    ADMIN: "admin",
    MANAGER: "manager",
    PRODUCT_MANAGER: "product-manager",
    ORDER_MANAGER: "order-manager",
    INVENTORY_MANAGER: "inventory-manager",
    DELIVERY_MANAGER: "delivery-manager",
    SUPPORT: "support",

    SELLER: "seller",
    RIDER: "rider",

    USER: "user",
} as const;

export type Role =
    (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.PRODUCT_MANAGER,
    ROLES.ORDER_MANAGER,
    ROLES.INVENTORY_MANAGER,
    ROLES.DELIVERY_MANAGER,
    ROLES.SUPPORT,
] as const;

export type AdminRole =
    (typeof ADMIN_ROLES)[number];