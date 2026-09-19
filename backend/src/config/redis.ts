import Redis from "ioredis";

import { env } from "./env";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Redis Runtime State
|--------------------------------------------------------------------------
*/

let redisClient: Redis | null = null;

let isRedisConnected = false;

let connectionPromise:
    | Promise<Redis>
    | null = null;

/*
|--------------------------------------------------------------------------
| Create Redis Client
|--------------------------------------------------------------------------
*/

const createRedisClient = (): Redis => {
    const client = new Redis(
        env.REDIS_URL,
        {
            /*
            |--------------------------------------------------------------------------
            | BullMQ Compatibility
            |--------------------------------------------------------------------------
            |
            | BullMQ requires unlimited command retries.
            |
            |--------------------------------------------------------------------------
            */

            maxRetriesPerRequest:
                null,

            /*
            |--------------------------------------------------------------------------
            | Connection Readiness
            |--------------------------------------------------------------------------
            */

            enableReadyCheck:
                true,

            /*
            |--------------------------------------------------------------------------
            | Lazy Connection
            |--------------------------------------------------------------------------
            */

            lazyConnect:
                true,

            /*
            |--------------------------------------------------------------------------
            | Connection Timeout
            |--------------------------------------------------------------------------
            */

            connectTimeout:
                10_000,

            /*
            |--------------------------------------------------------------------------
            | TCP Keep Alive
            |--------------------------------------------------------------------------
            */

            keepAlive:
                10_000,

            /*
            |--------------------------------------------------------------------------
            | Automatic Reconnection
            |--------------------------------------------------------------------------
            */

            retryStrategy(times) {
                const delay =
                    Math.min(
                        times * 500,
                        5_000
                    );

                logger.warn(
                    {
                        attempt:
                            times,

                        retryIn:
                            delay,
                    },
                    "Redis reconnect scheduled."
                );

                return delay;
            },
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Redis Events
    |--------------------------------------------------------------------------
    */

    client.on(
        "connect",
        () => {
            logger.info(
                "Redis connection established."
            );
        }
    );

    client.on(
        "ready",
        () => {
            isRedisConnected =
                true;

            logger.info(
                "Redis is ready."
            );
        }
    );

    client.on(
        "reconnecting",
        (delay: number) => {
            isRedisConnected =
                false;

            logger.warn(
                {
                    retryIn:
                        delay,
                },
                "Redis reconnecting."
            );
        }
    );

    client.on(
        "close",
        () => {
            isRedisConnected =
                false;

            logger.warn(
                "Redis connection closed."
            );
        }
    );

    client.on(
        "end",
        () => {
            isRedisConnected =
                false;

            logger.warn(
                "Redis connection ended."
            );
        }
    );

    client.on(
        "error",
        (error) => {
            isRedisConnected =
                false;

            logger.error(
                {
                    error,
                },
                "Redis connection error."
            );
        }
    );

    return client;
};

/*
|--------------------------------------------------------------------------
| Connect Redis
|--------------------------------------------------------------------------
*/

export const connectRedis =
    async (): Promise<Redis> => {
        /*
        |--------------------------------------------------------------------------
        | Already Ready
        |--------------------------------------------------------------------------
        */

        if (
            redisClient &&
            redisClient.status ===
                "ready"
        ) {
            return redisClient;
        }

        /*
        |--------------------------------------------------------------------------
        | Reuse Existing Connection Attempt
        |--------------------------------------------------------------------------
        */

        if (connectionPromise) {
            return connectionPromise;
        }

        /*
        |--------------------------------------------------------------------------
        | Create Client
        |--------------------------------------------------------------------------
        */

        if (!redisClient) {
            redisClient =
                createRedisClient();
        }

        /*
        |--------------------------------------------------------------------------
        | Connect
        |--------------------------------------------------------------------------
        */

        connectionPromise =
            redisClient
                .connect()
                .then(() => {
                    if (!redisClient) {
                        throw new Error(
                            "Redis client became unavailable during connection."
                        );
                    }

                    isRedisConnected =
                        redisClient.status ===
                        "ready";

                    return redisClient;
                })
                .catch((error) => {
                    isRedisConnected =
                        false;

                    logger.error(
                        {
                            error,
                        },
                        "Redis connection failed."
                    );

                    throw error;
                })
                .finally(() => {
                    connectionPromise =
                        null;
                });

        return connectionPromise;
    };

/*
|--------------------------------------------------------------------------
| Get Redis Client
|--------------------------------------------------------------------------
*/

export const getRedisClient =
    (): Redis => {
        if (!redisClient) {
            throw new Error(
                "Redis client has not been initialized."
            );
        }

        if (
            redisClient.status ===
            "end"
        ) {
            throw new Error(
                "Redis client is closed."
            );
        }

        return redisClient;
    };

/*
|--------------------------------------------------------------------------
| Redis Health
|--------------------------------------------------------------------------
*/

export const isRedisHealthy =
    (): boolean => {
        return (
            redisClient !== null &&
            redisClient.status ===
                "ready" &&
            isRedisConnected
        );
    };

/*
|--------------------------------------------------------------------------
| Redis Runtime State
|--------------------------------------------------------------------------
*/

export const getRedisState =
    () => {
        const status =
            redisClient?.status ??
            "uninitialized";

        return Object.freeze({
            initialized:
                redisClient !== null,

            connected:
                isRedisConnected,

            ready:
                status === "ready",

            connecting:
                status === "connecting",

            reconnecting:
                status === "reconnecting",

            closing:
                status === "close",

            ended:
                status === "end",

            status,
        });
    };

/*
|--------------------------------------------------------------------------
| Disconnect Redis
|--------------------------------------------------------------------------
*/

export const disconnectRedis =
    async (): Promise<void> => {
        /*
        |--------------------------------------------------------------------------
        | Nothing To Disconnect
        |--------------------------------------------------------------------------
        */

        if (!redisClient) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Wait For Active Connection Attempt
        |--------------------------------------------------------------------------
        */

        if (connectionPromise) {
            try {
                await connectionPromise;
            } catch {
                /*
                |--------------------------------------------------------------------------
                | Connection failed.
                |
                | Continue shutdown safely.
                |--------------------------------------------------------------------------
                */
            }
        }

        const client =
            redisClient;

        try {
            /*
            |--------------------------------------------------------------------------
            | Graceful Disconnect
            |--------------------------------------------------------------------------
            */

            if (
                client.status !==
                    "end" &&
                client.status !==
                    "wait"
            ) {
                await client.quit();
            }

            logger.info(
                "Redis disconnected successfully."
            );
        } catch (error) {
            logger.error(
                {
                    error,
                },
                "Redis graceful disconnection failed."
            );

            /*
            |--------------------------------------------------------------------------
            | Force Disconnect
            |--------------------------------------------------------------------------
            */

            client.disconnect();
        } finally {
            isRedisConnected =
                false;

            connectionPromise =
                null;

            redisClient =
                null;
        }
    };