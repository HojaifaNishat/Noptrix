export const AUTH_ACCOUNT_TYPES = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    USER: "USER",
    SELLER: "SELLER",
    RIDER: "RIDER",
} as const;

export type AuthAccountType =
    (typeof AUTH_ACCOUNT_TYPES)[keyof typeof AUTH_ACCOUNT_TYPES];

export const AUTH_ROUTES = {
    OWNER_LOGIN: "/owner",
    ADMIN_LOGIN: "/admin/login",
    CUSTOMER_LOGIN: "/customer/login",
    SELLER_LOGIN: "/seller/login",
    RIDER_LOGIN: "/rider/login",
} as const;

export const PROTECTED_ROUTES = {
    ADMIN_PANEL: "/admin",
    CUSTOMER_ACCOUNT: "/account",
    SELLER_PANEL: "/seller-panel",
    RIDER_PANEL: "/rider-panel",
} as const;