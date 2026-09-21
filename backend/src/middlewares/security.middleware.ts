import {
    Request,
    Response,
    NextFunction,
} from "express";
import helmet from "helmet";

/**
 * Global security middleware.
 *
 * Responsibilities:
 * - HTTP security headers
 * - Content Security Policy foundation
 * - Clickjacking protection
 * - MIME sniffing protection
 * - Referrer policy
 * - DNS prefetch control
 * - Cross-origin policy foundation
 */
export const securityMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https:",
                ],

                fontSrc: [
                    "'self'",
                    "data:",
                    "https:",
                ],

                connectSrc: [
                    "'self'",
                    "https:",
                    "http:",
                ],

                objectSrc: [
                    "'none'",
                ],

                frameAncestors: [
                    "'none'",
                ],

                baseUri: [
                    "'self'",
                ],

                formAction: [
                    "'self'",
                ],
            },
        },

        frameguard: {
            action: "deny",
        },

        hidePoweredBy: true,

        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },

        noSniff: true,

        referrerPolicy: {
            policy: "strict-origin-when-cross-origin",
        },

        xssFilter: false,

        dnsPrefetchControl: {
            allow: false,
        },

        permittedCrossDomainPolicies: {
            permittedPolicies: "none",
        },
    })(req, res, next);
};