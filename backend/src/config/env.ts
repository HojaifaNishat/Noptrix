import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();


/*
|--------------------------------------------------------------------------
| Environment Schema
|--------------------------------------------------------------------------
|
| All environment variables are validated once during application startup.
|
| IMPORTANT:
| - Never access process.env directly outside this file.
| - Secrets are validated here but never logged.
| - Optional third-party integrations can remain disabled.
|
|--------------------------------------------------------------------------
*/

const envSchema = z.object({
    /*
    |--------------------------------------------------------------------------
    | Application
    |--------------------------------------------------------------------------
    */

    NODE_ENV: z
        .enum([
            "development",
            "test",
            "production",
        ])
        .default("development"),

    PORT: z
        .coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(5000),

    API_PREFIX: z
        .string()
        .trim()
        .min(1)
        .default("/api"),

    APP_NAME: z
        .string()
        .trim()
        .min(1)
        .default("NOPTRIX"),

    APP_URL: z
        .string()
        .url()
        .default("http://localhost:3000"),

    BACKEND_URL: z
        .string()
        .url()
        .default("http://localhost:5000"),

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    */

    MONGODB_URI: z
        .string()
        .trim()
        .min(1, "MONGODB_URI is required"),

    MONGODB_DB_NAME: z
        .string()
        .trim()
        .min(1)
        .default("noptrix"),

    /*
    |--------------------------------------------------------------------------
    | Redis
    |--------------------------------------------------------------------------
    */

    REDIS_URL: z
        .string()
        .trim()
        .min(1)
        .default("redis://127.0.0.1:6379"),

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    JWT_SECRET: z
        .string()
        .min(
            32,
            "JWT_SECRET must contain at least 32 characters"
        ),

    JWT_EXPIRES_IN: z
        .string()
        .trim()
        .min(1)
        .default("7d"),

    REFRESH_TOKEN_SECRET: z
        .string()
        .min(
            32,
            "REFRESH_TOKEN_SECRET must contain at least 32 characters"
        ),

    REFRESH_TOKEN_EXPIRES_IN: z
        .string()
        .trim()
        .min(1)
        .default("30d"),

    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    */

    CORS_ORIGIN: z
        .string()
        .trim()
        .min(1)
        .default("http://localhost:3000"),

    /*
    |--------------------------------------------------------------------------
    | Cookies
    |--------------------------------------------------------------------------
    */

    COOKIE_DOMAIN: z
        .string()
        .trim()
        .optional(),

    COOKIE_SECURE: z
        .enum(["true", "false"])
        .default("false")
        .transform(
            (value) => value === "true"
        ),

    /*
    |--------------------------------------------------------------------------
    | Cloudinary
    |--------------------------------------------------------------------------
    */

    CLOUDINARY_CLOUD_NAME: z
        .string()
        .trim()
        .optional(),

    CLOUDINARY_API_KEY: z
        .string()
        .trim()
        .optional(),

    CLOUDINARY_API_SECRET: z
        .string()
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | SMTP / Email
    |--------------------------------------------------------------------------
    */

    SMTP_HOST: z
        .string()
        .trim()
        .optional(),

    SMTP_PORT: z
        .coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(587),

    SMTP_USER: z
        .string()
        .trim()
        .optional(),

    SMTP_PASSWORD: z
        .string()
        .optional(),

    SMTP_FROM: z
        .string()
        .trim()
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | SMS
    |--------------------------------------------------------------------------
    */

    SMS_PROVIDER: z
        .string()
        .trim()
        .optional(),

    SMS_API_KEY: z
        .string()
        .trim()
        .optional(),

    SMS_API_SECRET: z
        .string()
        .optional(),

    SMS_FROM: z
        .string()
        .trim()
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | Firebase
    |--------------------------------------------------------------------------
    */

    FIREBASE_PROJECT_ID: z
        .string()
        .trim()
        .optional(),

    FIREBASE_CLIENT_EMAIL: z
        .string()
        .trim()
        .optional(),

    FIREBASE_PRIVATE_KEY: z
        .string()
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
    */

    BCRYPT_SALT_ROUNDS: z
        .coerce
        .number()
        .int()
        .min(10)
        .max(15)
        .default(12),

    RATE_LIMIT_WINDOW_MS: z
        .coerce
        .number()
        .int()
        .positive()
        .default(15 * 60 * 1000),

    RATE_LIMIT_MAX: z
        .coerce
        .number()
        .int()
        .positive()
        .default(100),

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    */

    LOG_LEVEL: z
        .enum([
            "fatal",
            "error",
            "warn",
            "info",
            "debug",
            "trace",
        ])
        .default("info"),

    /*
    |--------------------------------------------------------------------------
    | OTP
    |--------------------------------------------------------------------------
    */

    OTP_LENGTH: z
        .coerce
        .number()
        .int()
        .min(4)
        .max(8)
        .default(6),

    OTP_EXPIRES_IN_MINUTES: z
        .coerce
        .number()
        .int()
        .positive()
        .default(5),

    OTP_MAX_ATTEMPTS: z
        .coerce
        .number()
        .int()
        .positive()
        .default(5),

    OTP_RESEND_COOLDOWN_SECONDS: z
        .coerce
        .number()
        .int()
        .positive()
        .default(60),

    /*
    |--------------------------------------------------------------------------
    | File Upload
    |--------------------------------------------------------------------------
    */

    MAX_FILE_SIZE_MB: z
        .coerce
        .number()
        .positive()
        .default(10),

    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    PAYMENT_CURRENCY: z
        .string()
        .trim()
        .length(
            3,
            "PAYMENT_CURRENCY must be a 3-letter ISO currency code"
        )
        .transform((value) =>
            value.toUpperCase()
        )
        .default("BDT"),

    PAYMENT_PROVIDER: z
        .string()
        .trim()
        .optional(),

    PAYMENT_WEBHOOK_SECRET: z
        .string()
        .min(
            16,
            "PAYMENT_WEBHOOK_SECRET must contain at least 16 characters"
        )
        .optional(),

    PAYMENT_SUCCESS_URL: z
        .string()
        .url()
        .optional(),

    PAYMENT_CANCEL_URL: z
        .string()
        .url()
        .optional(),

    PAYMENT_FAIL_URL: z
        .string()
        .url()
        .optional(),

    PAYMENT_IPN_URL: z
        .string()
        .url()
        .optional(),

    PAYMENT_REQUEST_TIMEOUT_MS: z
        .coerce
        .number()
        .int()
        .positive()
        .default(15_000),

    PAYMENT_MAX_RETRIES: z
        .coerce
        .number()
        .int()
        .min(0)
        .max(5)
        .default(2),

    PAYMENT_IDEMPOTENCY_TTL_SECONDS: z
        .coerce
        .number()
        .int()
        .positive()
        .default(24 * 60 * 60),

    PAYMENT_WEBHOOK_TOLERANCE_SECONDS: z
        .coerce
        .number()
        .int()
        .positive()
        .default(300),

    PAYMENT_ENABLE_COD: z
        .enum(["true", "false"])
        .default("true")
        .transform(
            (value) => value === "true"
        ),

    PAYMENT_ENABLE_ONLINE: z
        .enum(["true", "false"])
        .default("false")
        .transform(
            (value) => value === "true"
        ),
});

/*
|--------------------------------------------------------------------------
| Parse Environment
|--------------------------------------------------------------------------
*/

const parsedEnv = envSchema.safeParse(
    process.env
);

if (!parsedEnv.success) {
    console.error(
        "\n❌ Invalid environment configuration:\n"
    );

    console.error(
        parsedEnv.error.issues
            .map(
                (issue) =>
                    `- ${issue.path.join(".")}: ${issue.message}`
            )
            .join("\n")
    );

    console.error(
        "\n❌ NOPTRIX backend cannot start with invalid environment variables.\n"
    );

    process.exit(1);
}

/*
|--------------------------------------------------------------------------
| Frozen Runtime Configuration
|--------------------------------------------------------------------------
*/

export const env = Object.freeze(
    parsedEnv.data
);

/*
|--------------------------------------------------------------------------
| Environment Helpers
|--------------------------------------------------------------------------
*/

export const isDevelopment =
    env.NODE_ENV === "development";

export const isTest =
    env.NODE_ENV === "test";

export const isProduction =
    env.NODE_ENV === "production";