import pino, {
    type Logger,
    type LoggerOptions,
} from "pino";

import { env } from "../config/env";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type LoggerInstance = Logger;

/*
|--------------------------------------------------------------------------
| Sensitive Data Redaction
|--------------------------------------------------------------------------
|
| These fields must never appear in application logs.
|
| Important:
| - Authorization headers
| - Cookies
| - Passwords
| - JWTs
| - OTP / secret codes
| - API credentials
|
*/

const REDACT_PATHS: string[] = [
    // Request headers
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers.set-cookie",
    "req.headers.x-api-key",
    "req.headers.x-auth-token",

    // Request body credentials
    "req.body.password",
    "req.body.currentPassword",
    "req.body.newPassword",
    "req.body.confirmPassword",

    "req.body.token",
    "req.body.accessToken",
    "req.body.refreshToken",

    "req.body.secret",
    "req.body.secretCode",

    "req.body.otp",
    "req.body.otpCode",

    "req.body.apiKey",
    "req.body.apiSecret",
    "req.body.clientSecret",
    "req.body.privateKey",

    // Response headers
    "res.headers.authorization",
    "res.headers.cookie",
    "res.headers.set-cookie",

    // Generic application fields
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",

    "token",
    "accessToken",
    "refreshToken",

    "secret",
    "secretCode",

    "otp",
    "otpCode",

    "apiKey",
    "apiSecret",
    "clientSecret",
    "privateKey",
];

/*
|--------------------------------------------------------------------------
| Logger Options
|--------------------------------------------------------------------------
*/

const loggerOptions: LoggerOptions = {
    level: env.LOG_LEVEL,

    /*
    |--------------------------------------------------------------------------
    | Base Context
    |--------------------------------------------------------------------------
    |
    | These fields are attached to every log entry.
    |
    */

    base: {
        service: env.APP_NAME,
        environment: env.NODE_ENV,
    },

    /*
    |--------------------------------------------------------------------------
    | Timestamp
    |--------------------------------------------------------------------------
    */

    timestamp:
        pino.stdTimeFunctions.isoTime,

    /*
    |--------------------------------------------------------------------------
    | Log Level Formatting
    |--------------------------------------------------------------------------
    */

    formatters: {
        level: (label) => ({
            level: label,
        }),
    },

    /*
    |--------------------------------------------------------------------------
    | Sensitive Data Protection
    |--------------------------------------------------------------------------
    */

    redact: {
        paths: REDACT_PATHS,
        censor: "[REDACTED]",
    },

    /*
    |--------------------------------------------------------------------------
    | Error Serialization
    |--------------------------------------------------------------------------
    |
    | Keeps Error objects structured and useful for debugging.
    |
    */

    serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,

        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
    },

    /*
    |--------------------------------------------------------------------------
    | Development Transport
    |--------------------------------------------------------------------------
    |
    | Pretty logs are useful locally.
    | Production keeps structured JSON logs.
    |
    */

    transport:
        env.NODE_ENV === "development"
            ? {
                  target: "pino-pretty",

                  options: {
                      colorize: true,

                      translateTime:
                          "SYS:standard",

                      ignore:
                          "pid,hostname",

                      singleLine: false,
                  },
              }
            : undefined,
};

/*
|--------------------------------------------------------------------------
| Logger Instance
|--------------------------------------------------------------------------
*/

const logger: LoggerInstance =
    pino(loggerOptions);

/*
|--------------------------------------------------------------------------
| Child Logger Factory
|--------------------------------------------------------------------------
|
| Allows modules/services to create contextual loggers:
|
| const log = createLogger("OrderService");
| log.info("Order created");
|
| Result:
| service=Noptrix
| module=OrderService
| ...
|
*/

export const createLogger = (
    module: string
): LoggerInstance => {
    const normalizedModule =
        module.trim();

    if (!normalizedModule) {
        throw new Error(
            "Logger module name cannot be empty."
        );
    }

    return logger.child({
        module: normalizedModule,
    });
};

/*
|--------------------------------------------------------------------------
| Request Context Logger
|--------------------------------------------------------------------------
|
| Useful when requestId / userId / adminId / etc.
| become available through middleware.
|
*/

export interface LoggerContext {
    readonly requestId?: string;
    readonly userId?: string;
    readonly adminId?: string;
    readonly riderId?: string;
    readonly sessionId?: string;
    readonly ip?: string;
    readonly module?: string;
}

export const createContextLogger = (
    context: LoggerContext
): LoggerInstance => {
    const sanitizedContext: Record<
        string,
        string
    > = {};

    for (const [
        key,
        value,
    ] of Object.entries(context)) {
        if (
            typeof value ===
                "string" &&
            value.trim().length > 0
        ) {
            sanitizedContext[key] =
                value.trim();
        }
    }

    return logger.child(
        sanitizedContext
    );
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export { logger };

export default logger;