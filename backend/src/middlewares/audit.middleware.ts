import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

/*
|--------------------------------------------------------------------------
| Audit Actions
|--------------------------------------------------------------------------
*/

export type AuditAction =
    | "CREATE"
    | "READ"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "REGISTER"
    | "VERIFY"
    | "APPROVE"
    | "REJECT"
    | "SUSPEND"
    | "ACTIVATE"
    | "UPLOAD"
    | "DOWNLOAD"
    | "EXPORT"
    | "IMPORT"
    | "PAYMENT"
    | "REFUND"
    | "CANCEL"
    | "OTHER";

/*
|--------------------------------------------------------------------------
| Audit Options
|--------------------------------------------------------------------------
*/

export interface AuditOptions {
    action: AuditAction;

    resource?: string;

    resourceId?:
        | string
        | ((
              req: Request
          ) => string | undefined);

    description?:
        | string
        | ((
              req: Request
          ) => string | undefined);

    metadata?:
        | Record<string, unknown>
        | ((
              req: Request
          ) => Record<string, unknown> | undefined);

    includeRequestBody?: boolean;

    includeQuery?: boolean;

    includeParams?: boolean;
}

/*
|--------------------------------------------------------------------------
| Audit Record
|--------------------------------------------------------------------------
*/

export interface AuditRecord {
    action: AuditAction;

    resource?: string;

    resourceId?: string;

    description?: string;

    userId?: string;

    tokenType?: string;

    method: string;

    path: string;

    ipAddress?: string;

    userAgent?: string;

    metadata?: Record<string, unknown>;

    requestBody?: unknown;

    query?: unknown;

    params?: unknown;

    timestamp: Date;
}

/*
|--------------------------------------------------------------------------
| Express Audit Context
|--------------------------------------------------------------------------
*/

declare global {
    namespace Express {
        interface Request {
            audit?: {
                action: AuditAction;
                resource?: string;
                resourceId?: string;
            };
        }
    }
}

/*
|--------------------------------------------------------------------------
| Sensitive Fields
|--------------------------------------------------------------------------
*/

const SENSITIVE_FIELDS = new Set([
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",

    "token",
    "accessToken",
    "refreshToken",

    "authorization",
    "cookie",

    "otp",
    "otpCode",
    "verificationCode",

    "secret",
    "secretCode",

    "apiKey",
    "apiSecret",

    "cardNumber",
    "cvv",
    "cvc",
]);

/*
|--------------------------------------------------------------------------
| Sanitize Value
|--------------------------------------------------------------------------
*/

const sanitizeValue = (
    value: unknown
): unknown => {
    if (value === null) {
        return null;
    }

    if (typeof value !== "object") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(
            (item) => sanitizeValue(item)
        );
    }

    const object =
        value as Record<string, unknown>;

    const sanitized: Record<
        string,
        unknown
    > = {};

    for (const [
        key,
        currentValue,
    ] of Object.entries(object)) {
        if (
            SENSITIVE_FIELDS.has(
                key.toLowerCase()
            )
        ) {
            sanitized[key] = "[REDACTED]";
            continue;
        }

        sanitized[key] =
            sanitizeValue(currentValue);
    }

    return sanitized;
};

/*
|--------------------------------------------------------------------------
| Resolve Resource ID
|--------------------------------------------------------------------------
*/

const resolveResourceId = (
    req: Request,
    resourceId?:
        | string
        | ((
              req: Request
          ) => string | undefined)
): string | undefined => {
    if (typeof resourceId === "function") {
        return resourceId(req);
    }

    if (typeof resourceId === "string") {
        return resourceId;
    }

    const possibleIds = [
        "id",
        "userId",
        "adminId",
        "productId",
        "orderId",
        "customerId",
        "employeeId",
    ];

    for (const key of possibleIds) {
        const value = req.params?.[key];

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value;
        }
    }

    return undefined;
};

/*
|--------------------------------------------------------------------------
| Resolve Description
|--------------------------------------------------------------------------
*/

const resolveDescription = (
    req: Request,
    description?:
        | string
        | ((
              req: Request
          ) => string | undefined)
): string | undefined => {
    if (typeof description === "function") {
        return description(req);
    }

    return description;
};

/*
|--------------------------------------------------------------------------
| Resolve Metadata
|--------------------------------------------------------------------------
*/

const resolveMetadata = (
    req: Request,
    metadata?:
        | Record<string, unknown>
        | ((
              req: Request
          ) => Record<string, unknown> | undefined)
): Record<string, unknown> | undefined => {
    if (typeof metadata === "function") {
        return metadata(req);
    }

    return metadata;
};

/*
|--------------------------------------------------------------------------
| Get IP Address
|--------------------------------------------------------------------------
*/

const getIpAddress = (
    req: Request
): string | undefined => {
    const forwardedFor =
        req.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string") {
        return forwardedFor
            .split(",")[0]
            ?.trim();
    }

    if (Array.isArray(forwardedFor)) {
        return forwardedFor[0];
    }

    return (
        req.ip ||
        req.socket.remoteAddress ||
        undefined
    );
};

/*
|--------------------------------------------------------------------------
| Build Audit Record
|--------------------------------------------------------------------------
*/

const buildAuditRecord = (
    req: Request,
    options: AuditOptions
): AuditRecord => {
    const auditRecord: AuditRecord = {
        action: options.action,

        method: req.method,

        path: req.originalUrl || req.url,

        ipAddress: getIpAddress(req),

        userAgent:
            req.get("user-agent") ||
            undefined,

        timestamp: new Date(),
    };

    const resourceId =
        resolveResourceId(
            req,
            options.resourceId
        );

    if (options.resource) {
        auditRecord.resource =
            options.resource;
    }

    if (resourceId) {
        auditRecord.resourceId =
            resourceId;
    }

    const description =
        resolveDescription(
            req,
            options.description
        );

    if (description) {
        auditRecord.description =
            description;
    }

    const metadata =
        resolveMetadata(
            req,
            options.metadata
        );

    if (metadata) {
        auditRecord.metadata =
            sanitizeValue(
                metadata
            ) as Record<string, unknown>;
    }

    if (req.auth?.userId) {
        auditRecord.userId =
            req.auth.userId;
    }

    if (req.auth?.tokenType) {
        auditRecord.tokenType =
            req.auth.tokenType;
    }

    if (
        options.includeRequestBody &&
        req.body
    ) {
        auditRecord.requestBody =
            sanitizeValue(req.body);
    }

    if (
        options.includeQuery &&
        req.query
    ) {
        auditRecord.query =
            sanitizeValue(req.query);
    }

    if (
        options.includeParams &&
        req.params
    ) {
        auditRecord.params =
            sanitizeValue(req.params);
    }

    return auditRecord;
};

/*
|--------------------------------------------------------------------------
| Audit Sink
|--------------------------------------------------------------------------
*/

export type AuditSink = (
    record: AuditRecord
) => Promise<void> | void;

/*
|--------------------------------------------------------------------------
| Default Audit Sink
|--------------------------------------------------------------------------
*/

let auditSink: AuditSink = async (
    record
) => {
    if (
        process.env.NODE_ENV !==
        "production"
    ) {
        console.log(
            "[AUDIT]",
            JSON.stringify(
                record,
                null,
                2
            )
        );
    }
};

/*
|--------------------------------------------------------------------------
| Set Audit Sink
|--------------------------------------------------------------------------
*/

export const setAuditSink = (
    sink: AuditSink
): void => {
    auditSink = sink;
};

/*
|--------------------------------------------------------------------------
| Main Audit Middleware
|--------------------------------------------------------------------------
*/

export const auditMiddleware = (
    options: AuditOptions
): RequestHandler => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const resourceId =
            resolveResourceId(
                req,
                options.resourceId
            );

        req.audit = {
            action: options.action,

            ...(options.resource
                ? {
                      resource:
                          options.resource,
                  }
                : {}),

            ...(resourceId
                ? {
                      resourceId,
                  }
                : {}),
        };

        const auditRecord =
            buildAuditRecord(
                req,
                options
            );

        let finalized = false;

        const finalizeAudit =
            async (): Promise<void> => {
                if (finalized) {
                    return;
                }

                finalized = true;

                auditRecord.metadata = {
                    ...(auditRecord.metadata ??
                        {}),

                    responseStatus:
                        res.statusCode,

                    success:
                        res.statusCode < 400,
                };

                try {
                    await auditSink(
                        auditRecord
                    );
                } catch (
                    auditError
                ) {
                    if (
                        process.env
                            .NODE_ENV !==
                        "production"
                    ) {
                        console.error(
                            "[AUDIT_ERROR]",
                            auditError
                        );
                    }
                }
            };

        res.once(
            "finish",
            () => {
                void finalizeAudit();
            }
        );

        res.once(
            "close",
            () => {
                void finalizeAudit();
            }
        );

        next();
    };
};

/*
|--------------------------------------------------------------------------
| Convenience Audit Middleware
|--------------------------------------------------------------------------
*/

export const audit = (
    action: AuditAction,
    options: Omit<
        AuditOptions,
        "action"
    > = {}
): RequestHandler => {
    return auditMiddleware({
        ...options,
        action,
    });
};

/*
|--------------------------------------------------------------------------
| Create Audit
|--------------------------------------------------------------------------
*/

export const auditCreate = (
    resource: string,
    options: Omit<
        AuditOptions,
        "action" | "resource"
    > = {}
): RequestHandler => {
    return auditMiddleware({
        ...options,
        action: "CREATE",
        resource,
    });
};

/*
|--------------------------------------------------------------------------
| Update Audit
|--------------------------------------------------------------------------
*/

export const auditUpdate = (
    resource: string,
    options: Omit<
        AuditOptions,
        "action" | "resource"
    > = {}
): RequestHandler => {
    return auditMiddleware({
        ...options,
        action: "UPDATE",
        resource,
    });
};

/*
|--------------------------------------------------------------------------
| Delete Audit
|--------------------------------------------------------------------------
*/

export const auditDelete = (
    resource: string,
    options: Omit<
        AuditOptions,
        "action" | "resource"
    > = {}
): RequestHandler => {
    return auditMiddleware({
        ...options,
        action: "DELETE",
        resource,
    });
};

/*
|--------------------------------------------------------------------------
| Login Audit
|--------------------------------------------------------------------------
*/

export const auditLogin = (
    resource = "AUTH",
    options: Omit<
        AuditOptions,
        "action" | "resource"
    > = {}
): RequestHandler => {
    return auditMiddleware({
        ...options,
        action: "LOGIN",
        resource,
    });
};