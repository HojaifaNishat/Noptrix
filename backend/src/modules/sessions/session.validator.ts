import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Session ID
|--------------------------------------------------------------------------
*/

export const sessionIdParamSchema =
    z.object({
        sessionId: z
            .string()
            .trim()
            .min(
                1,
                "Session ID is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
*/

export const refreshTokenSchema =
    z.object({
        refreshToken: z
            .string()
            .trim()
            .min(
                1,
                "Refresh token is required."
            ),
    });


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type SessionIdParam =
    z.infer<
        typeof sessionIdParamSchema
    >;

export type RefreshTokenInput =
    z.infer<
        typeof refreshTokenSchema
    >;