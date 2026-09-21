import {
    Request,
    Response,
} from "express";

import {
    asyncHandler,
} from "../../utils/asyncHandler";

import {
    ApiError,
} from "../../utils/ApiError";

import {
    getAuthenticatedUserId,
} from "../../middlewares/userAuth.middleware";

import {
    getUserActiveSessions,
    revokeUserSession,
    revokeAllUserSessions,
} from "./session.service";


/*
|--------------------------------------------------------------------------
| Get My Active Sessions
|--------------------------------------------------------------------------
*/

export const getMySessions =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication is required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const sessions =
                await getUserActiveSessions(
                    userId
                );

            res.status(200).json({
                success: true,
                message:
                    "Active sessions retrieved successfully.",
                data: sessions,
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Revoke My Session
|--------------------------------------------------------------------------
*/

export const revokeMySession =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication is required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const {
                sessionId,
            } = req.params;

            if (
                typeof sessionId !==
                "string"
            ) {
                throw ApiError.badRequest(
                    "Invalid session ID.",
                    {
                        code:
                            "INVALID_SESSION_ID",
                    }
                );
            }

            /*
             * Security:
             *
             * The userId and sessionId
             * are checked together inside
             * the service/database query.
             */
            const session =
                await revokeUserSession(
                    userId,
                    sessionId
                );

            if (!session) {
                throw ApiError.notFound(
                    "Session not found or already revoked.",
                    {
                        code:
                            "SESSION_NOT_FOUND",
                    }
                );
            }

            res.status(200).json({
                success: true,
                message:
                    "Session revoked successfully.",
            });
        }
    );


/*
|--------------------------------------------------------------------------
| Revoke All My Sessions
|--------------------------------------------------------------------------
*/

export const revokeAllMySessions =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const userId =
                getAuthenticatedUserId(
                    req
                );

            if (!userId) {
                throw ApiError.unauthorized(
                    "Authentication is required.",
                    {
                        code:
                            "AUTHENTICATION_REQUIRED",
                    }
                );
            }

            const result =
                await revokeAllUserSessions(
                    userId
                );

            res.status(200).json({
                success: true,
                message:
                    "All active sessions revoked successfully.",
                data: {
                    revokedCount:
                        result.modifiedCount,
                },
            });
        }
    );