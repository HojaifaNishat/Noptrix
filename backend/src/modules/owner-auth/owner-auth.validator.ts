import { z } from "zod";

import {
    Types,
} from "mongoose";


/*
|--------------------------------------------------------------------------
| OWNER AUTH VALIDATION
|--------------------------------------------------------------------------
|
| Advanced validation layer for the OWNER authentication boundary.
|
| Goals:
|
| 1. Strong password policy (complexity, not just length).
| 2. Strict, format-aware secret-code validation.
| 3. ObjectId-aware sessionId validation (fails fast before
|    hitting the database instead of throwing a generic
|    Mongoose CastError downstream).
| 4. Defense against whitespace / null-byte / control-character
|    injection in security-sensitive fields.
| 5. Reusable primitives so future OWNER-scoped schemas stay
|    consistent instead of re-implementing the same rules.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Shared Primitives
|--------------------------------------------------------------------------
*/

/**
 * Rejects control characters (including null bytes) that have
 * no business being in user-submitted auth fields but can slip
 * through naive `.trim()` validation.
 */
const NO_CONTROL_CHARS_REGEX =
    /^[^\x00-\x1F\x7F]*$/;

const noControlChars = (
    message: string
) =>
    z
        .string()
        .regex(
            NO_CONTROL_CHARS_REGEX,
            message
        );

/**
 * Mongo ObjectId format check.
 *
 * Prevents malformed IDs from reaching the database layer,
 * where they would otherwise surface as an opaque
 * `CastError` instead of a clean 400 response.
 */
const objectIdSchema = (
    fieldName: string
) =>
    z
        .string()
        .trim()
        .refine(
            (value) =>
                Types.ObjectId.isValid(
                    value
                ),
            {
                message: `Invalid ${fieldName}.`,
            }
        );

/**
 * Password complexity policy.
 *
 * Requires at least one:
 * - lowercase letter
 * - uppercase letter
 * - digit
 * - special character
 *
 * This is intentionally stricter for OWNER accounts than a
 * typical end-user account, since OWNER is the highest
 * privileged boundary in the system.
 */
const passwordComplexitySchema = z
    .string()
    .min(
        8,
        "Password must be at least 8 characters."
    )
    .max(
        128,
        "Password cannot exceed 128 characters."
    )
    .refine(
        (value) => /[a-z]/.test(value),
        "Password must contain at least one lowercase letter."
    )
    .refine(
        (value) => /[A-Z]/.test(value),
        "Password must contain at least one uppercase letter."
    )
    .refine(
        (value) => /[0-9]/.test(value),
        "Password must contain at least one digit."
    )
    .refine(
        (value) =>
            /[^A-Za-z0-9]/.test(value),
        "Password must contain at least one special character."
    )
    .refine(
        (value) => !/\s/.test(value),
        "Password cannot contain whitespace."
    );

/**
 * Secret-code policy.
 *
 * The secret code is the OWNER's second authentication factor,
 * so it is validated more strictly than a generic string:
 *
 * - fixed, bounded length range
 * - digits only by default (adjust the regex if your secret
 *   codes are alphanumeric)
 * - no leading/trailing whitespace tolerated after trim
 */
const secretCodeSchema = noControlChars(
    "Secret code contains invalid characters."
)
    .trim()
    .min(
        4,
        "Secret code must be at least 4 characters."
    )
    .max(
        32,
        "Secret code cannot exceed 32 characters."
    )
    .regex(
        /^[A-Za-z0-9]+$/,
        "Secret code may only contain letters and numbers."
    );


/*
|--------------------------------------------------------------------------
| OWNER Login Validation
|--------------------------------------------------------------------------
*/

export const ownerLoginSchema = z
    .object({
        email: noControlChars(
            "Email contains invalid characters."
        )
            .trim()
            .toLowerCase()
            .pipe(
                z
                    .string()
                    .email(
                        "A valid email address is required."
                    )
                    .max(
                        254,
                        "Email address is too long."
                    )
            ),

        password: passwordComplexitySchema,
    })
    .strict();


/*
|--------------------------------------------------------------------------
| OWNER Secret Verification Validation
|--------------------------------------------------------------------------
*/

export const ownerSecretVerificationSchema =
    z
        .object({
            secretCode: secretCodeSchema,
            sessionId: objectIdSchema(
                "session ID"
            ).optional(),
        })
        .strict();


/*
|--------------------------------------------------------------------------
| OWNER Logout Validation
|--------------------------------------------------------------------------
*/

export const ownerLogoutSchema = z
    .object({
        sessionId: objectIdSchema(
            "session ID"
        ),
    })
    .strict();


/*
|--------------------------------------------------------------------------
| OWNER Session-Scoped Secret Verification
|--------------------------------------------------------------------------
|
| Combines sessionId + secretCode in a single schema for routes
| that verify the secret code against an explicit session
| (rather than pulling sessionId from an auth-context middleware).
|
|--------------------------------------------------------------------------
*/

export const ownerSecretVerificationWithSessionSchema =
    z
        .object({
            sessionId: objectIdSchema(
                "session ID"
            ),

            secretCode: secretCodeSchema,
        })
        .strict();


/*
|--------------------------------------------------------------------------
| Safe Parse Helpers
|--------------------------------------------------------------------------
|
| Thin wrappers that flatten Zod's error tree into a single,
| ordered list of human-readable messages — convenient for
| API error payloads without leaking Zod's internal shape.
|
|--------------------------------------------------------------------------
*/

export const formatValidationErrors = (
    error: z.ZodError
): readonly string[] => {
    return error.issues.map(
        (issue) => issue.message
    );
};

export const safeValidate = <
    Schema extends z.ZodTypeAny
>(
    schema: Schema,
    data: unknown
):
    | {
          readonly success: true;
          readonly data: z.infer<Schema>;
      }
    | {
          readonly success: false;
          readonly errors: readonly string[];
      } => {
    const result =
        schema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            errors:
                formatValidationErrors(
                    result.error
                ),
        };
    }

    return {
        success: true,
        data: result.data,
    };
};


/*
|--------------------------------------------------------------------------
| Inferred Types
|--------------------------------------------------------------------------
*/

export type OwnerLoginValidatedInput =
    z.infer<typeof ownerLoginSchema>;

export type OwnerSecretVerificationValidatedInput =
    z.infer<
        typeof ownerSecretVerificationSchema
    >;

export type OwnerSecretVerificationWithSessionValidatedInput =
    z.infer<
        typeof ownerSecretVerificationWithSessionSchema
    >;

export type OwnerLogoutValidatedInput =
    z.infer<typeof ownerLogoutSchema>;
