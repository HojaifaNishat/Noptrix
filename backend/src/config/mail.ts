import nodemailer, {
    type Transporter,
} from "nodemailer";

import { env } from "./env";
import { logger } from "../utils/logger";

/*
|--------------------------------------------------------------------------
| Mail Configuration
|--------------------------------------------------------------------------
*/

export interface MailConfig {
    readonly host: string;
    readonly port: number;
    readonly secure: boolean;
    readonly from: string;
}

/*
|--------------------------------------------------------------------------
| Mail Runtime State
|--------------------------------------------------------------------------
*/

let mailTransporter:
    | Transporter
    | null = null;

let isMailConfigured = false;

let isMailVerified = false;

let verificationPromise:
    | Promise<boolean>
    | null = null;

/*
|--------------------------------------------------------------------------
| Validate SMTP Configuration
|--------------------------------------------------------------------------
*/

const validateMailConfiguration =
    (): void => {
        const values = [
            env.SMTP_HOST,
            env.SMTP_USER,
            env.SMTP_PASSWORD,
        ];

        const configuredCount =
            values.filter(
                (value) =>
                    typeof value === "string" &&
                    value.trim().length > 0
            ).length;

        /*
        |--------------------------------------------------------------------------
        | SMTP Disabled
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
                "Incomplete SMTP configuration. SMTP_HOST, SMTP_USER and SMTP_PASSWORD must all be provided."
            );
        }
    };

/*
|--------------------------------------------------------------------------
| Resolve Sender Address
|--------------------------------------------------------------------------
*/

const resolveMailFrom = (): string => {
    if (env.SMTP_FROM) {
        return env.SMTP_FROM;
    }

    if (env.SMTP_USER) {
        return env.SMTP_USER;
    }

    throw new Error(
        "SMTP_FROM or SMTP_USER must be configured before sending email."
    );
};

/*
|--------------------------------------------------------------------------
| Build Mail Configuration
|--------------------------------------------------------------------------
*/

const buildMailConfig =
    (): MailConfig => {
        if (!env.SMTP_HOST) {
            throw new Error(
                "SMTP_HOST is not configured."
            );
        }

        return Object.freeze({
            host: env.SMTP_HOST,

            port: env.SMTP_PORT,

            secure:
                env.SMTP_PORT === 465,

            from:
                resolveMailFrom(),
        });
    };

/*
|--------------------------------------------------------------------------
| Create SMTP Transporter
|--------------------------------------------------------------------------
*/

const createMailTransporter =
    (): Transporter => {
        if (
            !env.SMTP_HOST ||
            !env.SMTP_USER ||
            !env.SMTP_PASSWORD
        ) {
            throw new Error(
                "SMTP configuration is incomplete."
            );
        }

        return nodemailer.createTransport({
            host: env.SMTP_HOST,

            port: env.SMTP_PORT,

            /*
            |--------------------------------------------------------------------------
            | Port 465
            |--------------------------------------------------------------------------
            |
            | TLS from the beginning.
            |
            |--------------------------------------------------------------------------
            */

            secure:
                env.SMTP_PORT === 465,

            auth: {
                user:
                    env.SMTP_USER,

                pass:
                    env.SMTP_PASSWORD,
            },

            /*
            |--------------------------------------------------------------------------
            | Connection Pool
            |--------------------------------------------------------------------------
            */

            pool: true,

            maxConnections: 5,

            maxMessages: 100,

            /*
            |--------------------------------------------------------------------------
            | Timeouts
            |--------------------------------------------------------------------------
            */

            connectionTimeout:
                10_000,

            greetingTimeout:
                10_000,

            socketTimeout:
                30_000,

            /*
            |--------------------------------------------------------------------------
            | TLS
            |--------------------------------------------------------------------------
            */

            tls: {
                minVersion:
                    "TLSv1.2",
            },

            /*
            |--------------------------------------------------------------------------
            | Disable DNS-related surprises
            |--------------------------------------------------------------------------
            */

            disableFileAccess: true,

            disableUrlAccess: true,
        });
    };

/*
|--------------------------------------------------------------------------
| Configure Mail
|--------------------------------------------------------------------------
*/

export const configureMail =
    (): void => {
        /*
        |--------------------------------------------------------------------------
        | Validate Environment
        |--------------------------------------------------------------------------
        */

        validateMailConfiguration();

        /*
        |--------------------------------------------------------------------------
        | SMTP Disabled
        |--------------------------------------------------------------------------
        */

        if (
            !env.SMTP_HOST &&
            !env.SMTP_USER &&
            !env.SMTP_PASSWORD
        ) {
            mailTransporter = null;

            isMailConfigured = false;

            isMailVerified = false;

            logger.warn(
                "SMTP is not configured. Email delivery is unavailable."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Initialization
        |--------------------------------------------------------------------------
        */

        if (
            mailTransporter &&
            isMailConfigured
        ) {
            logger.debug(
                "SMTP mail transporter is already configured."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Build Configuration
        |--------------------------------------------------------------------------
        */

        const config =
            buildMailConfig();

        /*
        |--------------------------------------------------------------------------
        | Create Transporter
        |--------------------------------------------------------------------------
        */

        mailTransporter =
            createMailTransporter();

        isMailConfigured = true;

        isMailVerified = false;

        logger.info(
            {
                host:
                    config.host,

                port:
                    config.port,

                secure:
                    config.secure,
            },
            "SMTP mail transporter configured successfully."
        );
    };

/*
|--------------------------------------------------------------------------
| Get Mail Transporter
|--------------------------------------------------------------------------
*/

export const getMailTransporter =
    (): Transporter => {
        if (
            !mailTransporter ||
            !isMailConfigured
        ) {
            throw new Error(
                "Mail transporter is not configured."
            );
        }

        return mailTransporter;
    };

/*
|--------------------------------------------------------------------------
| Get Mail Configuration
|--------------------------------------------------------------------------
|
| No SMTP password is ever returned.
|
|--------------------------------------------------------------------------
*/

export const getMailConfig =
    (): MailConfig => {
        return buildMailConfig();
    };

/*
|--------------------------------------------------------------------------
| Get Sender Address
|--------------------------------------------------------------------------
*/

export const getMailFrom =
    (): string => {
        return resolveMailFrom();
    };

/*
|--------------------------------------------------------------------------
| Verify SMTP Connection
|--------------------------------------------------------------------------
*/

export const verifyMailConnection =
    async (): Promise<boolean> => {
        /*
        |--------------------------------------------------------------------------
        | Not Configured
        |--------------------------------------------------------------------------
        */

        if (
            !mailTransporter ||
            !isMailConfigured
        ) {
            logger.warn(
                "SMTP verification skipped because mail is not configured."
            );

            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | Already Verified
        |--------------------------------------------------------------------------
        */

        if (isMailVerified) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | Reuse Concurrent Verification
        |--------------------------------------------------------------------------
        */

        if (verificationPromise) {
            return verificationPromise;
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Transporter
        |--------------------------------------------------------------------------
        */

        verificationPromise =
            mailTransporter
                .verify()
                .then(() => {
                    isMailVerified =
                        true;

                    logger.info(
                        "SMTP connection verified successfully."
                    );

                    return true;
                })
                .catch((error) => {
                    isMailVerified =
                        false;

                    logger.error(
                        {
                            error,
                        },
                        "SMTP connection verification failed."
                    );

                    return false;
                })
                .finally(() => {
                    verificationPromise =
                        null;
                });

        return verificationPromise;
    };

/*
|--------------------------------------------------------------------------
| Mail Configuration Status
|--------------------------------------------------------------------------
*/

export const isMailConfiguredStatus =
    (): boolean => {
        return (
            isMailConfigured &&
            mailTransporter !== null
        );
    };

/*
|--------------------------------------------------------------------------
| Mail Health
|--------------------------------------------------------------------------
*/

export const isMailHealthy =
    (): boolean => {
        return (
            isMailConfigured &&
            isMailVerified &&
            mailTransporter !== null
        );
    };

/*
|--------------------------------------------------------------------------
| Close Mail Transporter
|--------------------------------------------------------------------------
*/

export const closeMailTransporter =
    (): void => {
        if (!mailTransporter) {
            return;
        }

        try {
            mailTransporter.close();

            logger.info(
                "SMTP mail transporter closed successfully."
            );
        } catch (error) {
            logger.error(
                {
                    error,
                },
                "Failed to close SMTP mail transporter."
            );
        } finally {
            mailTransporter = null;

            isMailConfigured = false;

            isMailVerified = false;

            verificationPromise =
                null;
        }
    };