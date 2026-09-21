import rateLimit, {
    Options,
    RateLimitRequestHandler,
} from "express-rate-limit";

/*
|--------------------------------------------------------------------------
| Default Rate Limit Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 300;

/*
|--------------------------------------------------------------------------
| Create Rate Limiter
|--------------------------------------------------------------------------
*/

export const createRateLimiter = (
    options: Partial<Options> = {}
): RateLimitRequestHandler => {
    return rateLimit({
        windowMs:
            options.windowMs ??
            DEFAULT_WINDOW_MS,

        limit:
            options.limit ??
            DEFAULT_MAX_REQUESTS,

        standardHeaders: "draft-8",

        legacyHeaders: false,

        message: {
            success: false,
            message:
                "Too many requests. Please try again later.",
        },

        handler: (
            req,
            res,
            next,
            options
        ) => {
            res.status(429).json({
                success: false,
                message:
                    "Too many requests. Please try again later.",
                retryAfter:
                    Math.ceil(
                        (options.windowMs ?? DEFAULT_WINDOW_MS) /
                            1000
                    ),
            });
        },

        skip: (req) => {
            /*
             * Health-check endpoints should not consume
             * normal API rate-limit quota.
             */
            return (
                req.path === "/health" ||
                req.path === "/api/health"
            );
        },

        ...options,
    });
};

/*
|--------------------------------------------------------------------------
| Global API Limiter
|--------------------------------------------------------------------------
*/

export const globalRateLimiter =
    createRateLimiter({
        windowMs: 15 * 60 * 1000,
        limit: 300,
    });

/*
|--------------------------------------------------------------------------
| Authentication Limiter
|--------------------------------------------------------------------------
|
| Used for:
| - Login
| - Register
| - Password reset
| - Sensitive authentication endpoints
|
*/

export const authRateLimiter =
    createRateLimiter({
        windowMs: 15 * 60 * 1000,
        limit: 20,

        message: {
            success: false,
            message:
                "Too many authentication attempts. Please try again later.",
        },
    });

/*
|--------------------------------------------------------------------------
| OTP Limiter
|--------------------------------------------------------------------------
|
| OTP endpoints need much stricter protection.
|
*/

export const otpRateLimiter =
    createRateLimiter({
        windowMs: 10 * 60 * 1000,
        limit: 5,

        message: {
            success: false,
            message:
                "Too many OTP requests. Please wait before trying again.",
        },
    });

/*
|--------------------------------------------------------------------------
| Admin Sensitive Action Limiter
|--------------------------------------------------------------------------
*/

export const adminActionRateLimiter =
    createRateLimiter({
        windowMs: 15 * 60 * 1000,
        limit: 60,

        message: {
            success: false,
            message:
                "Too many administrative requests. Please try again later.",
        },
    });