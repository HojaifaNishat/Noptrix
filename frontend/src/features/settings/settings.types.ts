export const SETTINGS_CATEGORIES = [
    "general",
    "business",
    "security",
    "currency",
    "tax",
    "payment",
    "shipping",
    "email",
    "sms",
] as const;

export type SettingsCategory =
    (typeof SETTINGS_CATEGORIES)[number];

export type SettingValueType =
    | "text"
    | "email"
    | "url"
    | "number"
    | "boolean"
    | "choice";

export interface SettingField {
    readonly key: string;
    readonly label: string;
    readonly type: SettingValueType;
    readonly description?: string;
    readonly min?: number;
    readonly max?: number;
    readonly choices?: readonly {
        readonly label: string;
        readonly value: string;
    }[];
}

export interface SettingsCategoryConfig {
    readonly label: string;
    readonly description: string;
    readonly fields: readonly SettingField[];
}

export interface SettingsRecord {
    readonly category: SettingsCategory;
    readonly values: Record<string, unknown>;
    readonly updatedAt: string | null;
    readonly updatedBy: string | null;
}

export const SETTINGS_CATEGORY_CONFIG: Record<
    SettingsCategory,
    SettingsCategoryConfig
> = {
    general: {
        label: "General",
        description: "Platform identity, support details, and basic operation.",
        fields: [
            { key: "platformName", label: "Platform name", type: "text" },
            { key: "faviconUrl", label: "Favicon URL", type: "url" },
            { key: "supportEmail", label: "Support email", type: "email" },
            { key: "supportPhone", label: "Support phone", type: "text" },
            { key: "websiteUrl", label: "Website URL", type: "url" },
            { key: "defaultLanguage", label: "Default language", type: "text" },
            { key: "timezone", label: "Timezone", type: "text" },
            {
                key: "maintenanceMode",
                label: "Maintenance mode",
                type: "boolean",
                description: "Enable this only when the application supports maintenance mode.",
            },
        ],
    },
    business: {
        label: "Business",
        description: "Business identity and checkout policies.",
        fields: [
            { key: "legalName", label: "Legal business name", type: "text" },
            { key: "address", label: "Business address", type: "text" },
            { key: "country", label: "Country", type: "text" },
            { key: "allowGuestCheckout", label: "Allow guest checkout", type: "boolean" },
            { key: "minOrderAmount", label: "Minimum order amount", type: "number", min: 0 },
            {
                key: "cancellationWindowMinutes",
                label: "Cancellation window (minutes)",
                type: "number",
                min: 0,
                max: 10080,
            },
        ],
    },
    security: {
        label: "Security",
        description: "Security policy values. Authentication services must enforce these settings separately.",
        fields: [
            { key: "minPasswordLength", label: "Minimum password length", type: "number", min: 8, max: 128 },
            { key: "maxLoginAttempts", label: "Maximum login attempts", type: "number", min: 1, max: 20 },
            { key: "lockoutMinutes", label: "Lockout duration (minutes)", type: "number", min: 1, max: 1440 },
            { key: "requireMfaForAdmins", label: "Require MFA for admins", type: "boolean" },
        ],
    },
    currency: {
        label: "Currency",
        description: "Default currency display preferences.",
        fields: [
            { key: "defaultCurrency", label: "Default currency (ISO 4217)", type: "text" },
            { key: "displaySymbol", label: "Display symbol", type: "text" },
            { key: "decimalPlaces", label: "Decimal places", type: "number", min: 0, max: 4 },
            {
                key: "symbolPosition",
                label: "Symbol position",
                type: "choice",
                choices: [
                    { label: "Before amount", value: "before" },
                    { label: "After amount", value: "after" },
                ],
            },
        ],
    },
    tax: {
        label: "Tax",
        description: "Default tax policy. Detailed jurisdiction tax rules are managed separately.",
        fields: [
            { key: "enabled", label: "Enable tax", type: "boolean" },
            { key: "pricesIncludeTax", label: "Prices include tax", type: "boolean" },
            { key: "defaultRate", label: "Default tax rate (%)", type: "number", min: 0, max: 100 },
            { key: "taxLabel", label: "Tax label", type: "text" },
        ],
    },
    payment: {
        label: "Payment",
        description: "Platform-level payment availability. Gateway credentials are managed separately.",
        fields: [
            { key: "allowCashOnDelivery", label: "Allow cash on delivery", type: "boolean" },
            { key: "allowOnlinePayments", label: "Allow online payments", type: "boolean" },
        ],
    },
    shipping: {
        label: "Shipping",
        description: "Default shipping policies and delivery estimates.",
        fields: [
            { key: "freeShippingEnabled", label: "Enable free shipping", type: "boolean" },
            { key: "freeShippingThreshold", label: "Free shipping threshold", type: "number", min: 0 },
            { key: "estimatedDeliveryMinDays", label: "Minimum delivery time (days)", type: "number", min: 0, max: 365 },
            { key: "estimatedDeliveryMaxDays", label: "Maximum delivery time (days)", type: "number", min: 0, max: 365 },
        ],
    },
    email: {
        label: "Email",
        description: "Public sender preferences only. SMTP credentials and provider secrets are not stored here.",
        fields: [
            { key: "enabled", label: "Enable email notifications", type: "boolean" },
            { key: "fromName", label: "Sender name", type: "text" },
            { key: "fromEmail", label: "Sender email", type: "email" },
            { key: "replyToEmail", label: "Reply-to email", type: "email" },
        ],
    },
    sms: {
        label: "SMS",
        description: "SMS notification preferences only. Provider credentials are managed separately.",
        fields: [
            { key: "enabled", label: "Enable SMS notifications", type: "boolean" },
            { key: "senderId", label: "Sender ID", type: "text" },
        ],
    },
};
