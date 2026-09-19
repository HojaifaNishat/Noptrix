import {
    v2 as cloudinary,
    type ConfigOptions,
    type UploadApiResponse,
} from "cloudinary";

import { env } from "./env";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Cloudinary Configuration State
|--------------------------------------------------------------------------
*/

let isCloudinaryConfigured = false;
let isCloudinaryVerified = false;

/*
|--------------------------------------------------------------------------
| Cloudinary Configuration Type
|--------------------------------------------------------------------------
*/

export interface CloudinaryConfig {
    readonly cloudName: string;
    readonly apiKey: string;
    readonly secure: boolean;
}

/*
|--------------------------------------------------------------------------
| Check Cloudinary Configuration
|--------------------------------------------------------------------------
*/

const hasCloudinaryConfiguration = (): boolean => {
    return Boolean(
        env.CLOUDINARY_CLOUD_NAME &&
            env.CLOUDINARY_API_KEY &&
            env.CLOUDINARY_API_SECRET
    );
};

/*
|--------------------------------------------------------------------------
| Validate Cloudinary Environment
|--------------------------------------------------------------------------
*/

const validateCloudinaryEnvironment =
    (): void => {
        const values = [
            env.CLOUDINARY_CLOUD_NAME,
            env.CLOUDINARY_API_KEY,
            env.CLOUDINARY_API_SECRET,
        ];

        const configuredCount =
            values.filter(
                (value) =>
                    typeof value === "string" &&
                    value.trim().length > 0
            ).length;

        /*
        |--------------------------------------------------------------------------
        | Completely Disabled
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
                "Incomplete Cloudinary configuration. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must all be provided."
            );
        }
    };

/*
|--------------------------------------------------------------------------
| Build Cloudinary Configuration
|--------------------------------------------------------------------------
*/

const buildCloudinaryConfig =
    (): CloudinaryConfig => {
        if (
            !env.CLOUDINARY_CLOUD_NAME ||
            !env.CLOUDINARY_API_KEY ||
            !env.CLOUDINARY_API_SECRET
        ) {
            throw new Error(
                "Cloudinary credentials are not configured."
            );
        }

        return Object.freeze({
            cloudName:
                env.CLOUDINARY_CLOUD_NAME,

            apiKey:
                env.CLOUDINARY_API_KEY,

            secure: true,
        });
    };

/*
|--------------------------------------------------------------------------
| Configure Cloudinary
|--------------------------------------------------------------------------
*/

export const configureCloudinary =
    (): void => {
        /*
        |--------------------------------------------------------------------------
        | Validate Environment
        |--------------------------------------------------------------------------
        */

        validateCloudinaryEnvironment();

        /*
        |--------------------------------------------------------------------------
        | Cloudinary Disabled
        |--------------------------------------------------------------------------
        */

        if (!hasCloudinaryConfiguration()) {
            isCloudinaryConfigured = false;
            isCloudinaryVerified = false;

            logger.warn(
                "Cloudinary is not configured. Cloud-based file operations are unavailable."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Configuration
        |--------------------------------------------------------------------------
        */

        if (isCloudinaryConfigured) {
            logger.debug(
                "Cloudinary is already configured."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Build Configuration
        |--------------------------------------------------------------------------
        */

        const config =
            buildCloudinaryConfig();

        /*
        |--------------------------------------------------------------------------
        | Configure Cloudinary SDK
        |--------------------------------------------------------------------------
        */

        const sdkConfig: ConfigOptions = {
            cloud_name:
                config.cloudName,

            api_key:
                config.apiKey,

            api_secret:
                env.CLOUDINARY_API_SECRET,

            secure:
                config.secure,
        };

        cloudinary.config(
            sdkConfig
        );

        isCloudinaryConfigured = true;
        isCloudinaryVerified = false;

        logger.info(
            {
                cloudName:
                    config.cloudName,
                secure:
                    config.secure,
            },
            "Cloudinary SDK configured successfully."
        );
    };

/*
|--------------------------------------------------------------------------
| Get Cloudinary Client
|--------------------------------------------------------------------------
*/

export const getCloudinary = () => {
    if (!isCloudinaryConfigured) {
        throw new Error(
            "Cloudinary is not configured. Configure Cloudinary before using cloud services."
        );
    }

    return cloudinary;
};

/*
|--------------------------------------------------------------------------
| Verify Cloudinary Connection
|--------------------------------------------------------------------------
|
| This performs an authenticated API request.
|
|--------------------------------------------------------------------------
*/

export const verifyCloudinaryConnection =
    async (): Promise<boolean> => {
        if (!isCloudinaryConfigured) {
            logger.warn(
                "Cloudinary verification skipped because Cloudinary is not configured."
            );

            return false;
        }

        try {
            /*
            |--------------------------------------------------------------------------
            | Lightweight Authenticated Request
            |--------------------------------------------------------------------------
            */

            await cloudinary.api.ping();

            isCloudinaryVerified = true;

            logger.info(
                "Cloudinary connection verified successfully."
            );

            return true;
        } catch (error) {
            isCloudinaryVerified = false;

            logger.error(
                {
                    error,
                },
                "Cloudinary connection verification failed."
            );

            return false;
        }
    };

/*
|--------------------------------------------------------------------------
| Configuration Status
|--------------------------------------------------------------------------
*/

export const isCloudinaryConfiguredAndReady =
    (): boolean => {
        return (
            isCloudinaryConfigured &&
            isCloudinaryVerified
        );
    };

/*
|--------------------------------------------------------------------------
| Basic Configuration Status
|--------------------------------------------------------------------------
*/

export const isCloudinaryConfiguredStatus =
    (): boolean => {
        return isCloudinaryConfigured;
    };

/*
|--------------------------------------------------------------------------
| Health Status
|--------------------------------------------------------------------------
*/

export const isCloudinaryHealthy =
    (): boolean => {
        return (
            isCloudinaryConfigured &&
            isCloudinaryVerified
        );
    };

/*
|--------------------------------------------------------------------------
| Public Configuration Metadata
|--------------------------------------------------------------------------
|
| NEVER return API secret from here.
|
|--------------------------------------------------------------------------
*/

export const getCloudinaryPublicConfig =
    (): CloudinaryConfig | null => {
        if (!isCloudinaryConfigured) {
            return null;
        }

        return buildCloudinaryConfig();
    };