import {
    cert,
    getApps,
    initializeApp,
    type App,
} from "firebase-admin/app";

import { env } from "./env";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Firebase Application State
|--------------------------------------------------------------------------
*/

let firebaseApp: App | null = null;

let isFirebaseConfigured = false;

let isFirebaseVerified = false;

/*
|--------------------------------------------------------------------------
| Normalize Firebase Private Key
|--------------------------------------------------------------------------
*/

const normalizePrivateKey = (
    privateKey: string
): string => {
    return privateKey.replace(
        /\\n/g,
        "\n"
    );
};

/*
|--------------------------------------------------------------------------
| Validate Firebase Configuration
|--------------------------------------------------------------------------
*/

const validateFirebaseConfiguration =
    (): void => {
        const values = [
            env.FIREBASE_PROJECT_ID,
            env.FIREBASE_CLIENT_EMAIL,
            env.FIREBASE_PRIVATE_KEY,
        ];

        const configuredCount =
            values.filter(
                (value) =>
                    typeof value === "string" &&
                    value.trim().length > 0
            ).length;

        /*
        |--------------------------------------------------------------------------
        | Firebase Completely Disabled
        |--------------------------------------------------------------------------
        */

        if (configuredCount === 0) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Partial Configuration
        |--------------------------------------------------------------------------
        */

        if (
            configuredCount !==
            values.length
        ) {
            throw new Error(
                "Incomplete Firebase configuration. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must all be provided."
            );
        }
    };

/*
|--------------------------------------------------------------------------
| Firebase Configuration Availability
|--------------------------------------------------------------------------
*/

const hasFirebaseConfiguration =
    (): boolean => {
        return Boolean(
            env.FIREBASE_PROJECT_ID &&
                env.FIREBASE_CLIENT_EMAIL &&
                env.FIREBASE_PRIVATE_KEY
        );
    };

/*
|--------------------------------------------------------------------------
| Configure Firebase Admin
|--------------------------------------------------------------------------
*/

export const configureFirebase =
    (): void => {
        /*
        |--------------------------------------------------------------------------
        | Validate Configuration
        |--------------------------------------------------------------------------
        */

        validateFirebaseConfiguration();

        /*
        |--------------------------------------------------------------------------
        | Firebase Disabled
        |--------------------------------------------------------------------------
        */

        if (!hasFirebaseConfiguration()) {
            firebaseApp = null;

            isFirebaseConfigured = false;

            isFirebaseVerified = false;

            logger.warn(
                "Firebase Admin is not configured. Firebase-dependent features are unavailable."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Initialization
        |--------------------------------------------------------------------------
        */

        if (firebaseApp) {
            logger.debug(
                "Firebase Admin is already initialized."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Reuse Existing Firebase Application
        |--------------------------------------------------------------------------
        */

        const existingApps =
            getApps();

        if (existingApps.length > 0) {
            firebaseApp =
                existingApps[0];

            isFirebaseConfigured =
                true;

            isFirebaseVerified =
                false;

            logger.info(
                "Existing Firebase Admin application reused."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Initialize Firebase
        |--------------------------------------------------------------------------
        */

        try {
            firebaseApp =
                initializeApp({
                    credential:
                        cert({
                            projectId:
                                env.FIREBASE_PROJECT_ID!,

                            clientEmail:
                                env.FIREBASE_CLIENT_EMAIL!,

                            privateKey:
                                normalizePrivateKey(
                                    env.FIREBASE_PRIVATE_KEY!
                                ),
                        }),
                });

            isFirebaseConfigured =
                true;

            isFirebaseVerified =
                false;

            logger.info(
                {
                    projectId:
                        env.FIREBASE_PROJECT_ID,
                },
                "Firebase Admin initialized successfully."
            );
        } catch (error) {
            firebaseApp = null;

            isFirebaseConfigured =
                false;

            isFirebaseVerified =
                false;

            logger.error(
                {
                    error,
                },
                "Firebase Admin initialization failed."
            );

            throw error;
        }
    };

/*
|--------------------------------------------------------------------------
| Get Firebase Application
|--------------------------------------------------------------------------
*/

export const getFirebaseApp =
    (): App => {
        if (
            !firebaseApp ||
            !isFirebaseConfigured
        ) {
            throw new Error(
                "Firebase Admin is not configured."
            );
        }

        return firebaseApp;
    };

/*
|--------------------------------------------------------------------------
| Verify Firebase Configuration
|--------------------------------------------------------------------------
|
| This verifies that the Admin SDK can actually communicate
| with Firebase rather than only checking whether credentials
| exist.
|
|--------------------------------------------------------------------------
*/

export const verifyFirebaseConnection =
    async (): Promise<boolean> => {
        if (
            !firebaseApp ||
            !isFirebaseConfigured
        ) {
            logger.warn(
                "Firebase verification skipped because Firebase is not configured."
            );

            return false;
        }

        try {
            /*
            |--------------------------------------------------------------------------
            | Firebase Admin App Credential Check
            |--------------------------------------------------------------------------
            |
            | getAccessToken() forces the Admin SDK to obtain/refresh
            | an authenticated access token.
            |
            |--------------------------------------------------------------------------
            */

            await firebaseApp
                .options
                .credential
                ?.getAccessToken();

            isFirebaseVerified =
                true;

            logger.info(
                "Firebase Admin connection verified successfully."
            );

            return true;
        } catch (error) {
            isFirebaseVerified =
                false;

            logger.error(
                {
                    error,
                },
                "Firebase Admin verification failed."
            );

            return false;
        }
    };

/*
|--------------------------------------------------------------------------
| Firebase Configuration Status
|--------------------------------------------------------------------------
*/

export const isFirebaseConfiguredStatus =
    (): boolean => {
        return (
            isFirebaseConfigured &&
            firebaseApp !== null
        );
    };

/*
|--------------------------------------------------------------------------
| Firebase Health
|--------------------------------------------------------------------------
*/

export const isFirebaseHealthy =
    (): boolean => {
        return (
            isFirebaseConfigured &&
            firebaseApp !== null &&
            isFirebaseVerified
        );
    };

/*
|--------------------------------------------------------------------------
| Firebase Public Metadata
|--------------------------------------------------------------------------
|
| Never expose private key or credentials.
|
|--------------------------------------------------------------------------
*/

export const getFirebasePublicConfig =
    () => {
        if (
            !isFirebaseConfigured ||
            !env.FIREBASE_PROJECT_ID
        ) {
            return null;
        }

        return {
            projectId:
                env.FIREBASE_PROJECT_ID,

            configured:
                isFirebaseConfigured,

            verified:
                isFirebaseVerified,
        };
    };