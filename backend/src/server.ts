import http from "http";

import app from "./app";

import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import {
    connectRedis,
    disconnectRedis,
} from "./config/redis";

import { logger } from "./utils/logger";

/*
|--------------------------------------------------------------------------
| HTTP Server
|--------------------------------------------------------------------------
*/

const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

let isShuttingDown = false;

const gracefulShutdown = async (
    signal: string,
): Promise<void> => {
    if (isShuttingDown) return;

    isShuttingDown = true;

    logger.info(
        { signal },
        "Shutdown signal received. Starting graceful shutdown...",
    );

    server.close(async (serverError) => {
        if (serverError) {
            logger.error(
                { error: serverError },
                "HTTP server failed to close cleanly.",
            );
        }

        try {
            await disconnectRedis();
            logger.info("Redis disconnected.");

            await disconnectDatabase();
            logger.info("Database disconnected.");

            logger.info(
                "NOPTRIX server shutdown completed successfully.",
            );

            process.exit(serverError ? 1 : 0);
        } catch (error) {
            logger.error(
                { error },
                "Error during graceful shutdown.",
            );

            process.exit(1);
        }
    });
};

/*
|--------------------------------------------------------------------------
| Application Bootstrap
|--------------------------------------------------------------------------
*/

const bootstrap = async (): Promise<void> => {
    try {
        logger.info("Starting NOPTRIX backend...");

        /*
        |--------------------------------------------------------------------------
        | Database
        |--------------------------------------------------------------------------
        */

        await connectDatabase();

        logger.info("Database connection established.");

        /*
        |--------------------------------------------------------------------------
        | Redis
        |--------------------------------------------------------------------------
        */

        await connectRedis();

        logger.info("Redis connection established.");

        /*
        |--------------------------------------------------------------------------
        | HTTP Server
        |--------------------------------------------------------------------------
        */

        server.listen(env.PORT, () => {
            logger.info(
                {
                    port: env.PORT,
                    environment: env.NODE_ENV,
                },
                `NOPTRIX API is running on port ${env.PORT}.`,
            );
        });
    } catch (error) {
        logger.error(
            { error },
            "NOPTRIX backend failed to start.",
        );

        try {
            await disconnectRedis();
        } catch (shutdownError) {
            logger.error(
                { error: shutdownError },
                "Redis cleanup failed after startup error.",
            );
        }

        try {
            await disconnectDatabase();
        } catch (shutdownError) {
            logger.error(
                { error: shutdownError },
                "Database cleanup failed after startup error.",
            );
        }

        process.exit(1);
    }
};

/*
|--------------------------------------------------------------------------
| Process Signals
|--------------------------------------------------------------------------
*/

process.on("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
    void gracefulShutdown("SIGINT");
});

/*
|--------------------------------------------------------------------------
| Unhandled Errors
|--------------------------------------------------------------------------
*/

process.on("uncaughtException", (error) => {
    logger.error(
        { error },
        "Uncaught exception detected.",
    );

    void gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
    logger.error(
        { reason },
        "Unhandled promise rejection detected.",
    );

    void gracefulShutdown("unhandledRejection");
});

/*
|--------------------------------------------------------------------------
| Start Application
|--------------------------------------------------------------------------
*/

void bootstrap();