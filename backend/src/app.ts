import express from "express";
import cors from "cors";

import apiRoutes from "./routes";

import {
    securityMiddleware,
} from "./middlewares/security.middleware";

import {
    globalRateLimiter,
} from "./middlewares/rateLimit.middleware";

import {
    notFoundMiddleware,
    errorMiddleware,
} from "./middlewares/error.middleware";

/*
|--------------------------------------------------------------------------
| Express Application
|--------------------------------------------------------------------------
*/

const app = express();

/*
|--------------------------------------------------------------------------
| Trust Proxy
|--------------------------------------------------------------------------
|
| Required when the application runs behind:
| - Nginx
| - Cloudflare
| - Load Balancer
| - Reverse Proxy
|
| This allows Express to correctly resolve client IPs
| for rate limiting, audit logs and security middleware.
|--------------------------------------------------------------------------
*/

app.set("trust proxy", 1);

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/

app.use(
    securityMiddleware
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

/*
|--------------------------------------------------------------------------
| Global Rate Limiting
|--------------------------------------------------------------------------
*/

app.use(
    globalRateLimiter
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(
    express.json({
        limit: "2mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb",
    })
);

/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    (_req, res) => {
        res.status(200).json({
            success: true,
            message:
                "NOPTRIX API is Running",
            service: "backend",
            environment:
                process.env.NODE_ENV ??
                "development",
            timestamp:
                new Date().toISOString(),
        });
    }
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
    "/api",
    apiRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
|
| Must be registered after all valid routes.
|--------------------------------------------------------------------------
*/

app.use(
    notFoundMiddleware
);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
|
| Must be the final middleware.
|--------------------------------------------------------------------------
*/

app.use(
    errorMiddleware
);

/*
|--------------------------------------------------------------------------
| Export Application
|--------------------------------------------------------------------------
*/

export default app;