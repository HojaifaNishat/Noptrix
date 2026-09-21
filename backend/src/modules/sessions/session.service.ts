import {
    Types,
} from "mongoose";

import {
    createHash,
} from "crypto";

import {
    Session,
    SESSION_STATUSES,
} from "./session.model";

import {
    ApiError,
} from "../../utils/ApiError";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface CreateSessionInput {
    readonly userId: string;
    readonly refreshToken: string;

    readonly userAgent?: string;
    readonly ipAddress?: string;
    readonly deviceId?: string;

    readonly expiresAt: Date;
}


/*
|--------------------------------------------------------------------------
| Refresh Token Hash
|--------------------------------------------------------------------------
|
| Raw refresh tokens are never stored in MongoDB.
|
*/

export const hashRefreshToken = (
    refreshToken: string
): string => {
    return createHash("sha256")
        .update(refreshToken)
        .digest("hex");
};


/*
|--------------------------------------------------------------------------
| Validate ObjectId
|--------------------------------------------------------------------------
*/

const validateObjectId = (
    value: string,
    fieldName: string
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName}.`,
            {
                code:
                    "INVALID_OBJECT_ID",
            }
        );
    }

    return new Types.ObjectId(value);
};


/*
|--------------------------------------------------------------------------
| Create Session
|--------------------------------------------------------------------------
*/

export const createSession = async (
    input: CreateSessionInput
) => {
    const userId =
        validateObjectId(
            input.userId,
            "user ID"
        );

    const refreshTokenHash =
        hashRefreshToken(
            input.refreshToken
        );

    return Session.create({
        userId,

        refreshTokenHash,

        status:
            SESSION_STATUSES.ACTIVE,

        userAgent:
            input.userAgent,

        ipAddress:
            input.ipAddress,

        deviceId:
            input.deviceId,

        lastUsedAt:
            new Date(),

        expiresAt:
            input.expiresAt,
    });
};


/*
|--------------------------------------------------------------------------
| Find Active Session By ID
|--------------------------------------------------------------------------
*/

export const findActiveSessionById =
    async (
        sessionId: string
    ) => {
        const _id =
            validateObjectId(
                sessionId,
                "session ID"
            );

        const session =
            await Session.findOne({
                _id,

                status:
                    SESSION_STATUSES.ACTIVE,

                expiresAt: {
                    $gt: new Date(),
                },
            }).select(
                "+refreshTokenHash"
            );

        return session;
    };


/*
|--------------------------------------------------------------------------
| Find Active Session By Refresh Token
|--------------------------------------------------------------------------
*/

export const findSessionByRefreshToken =
    async (
        refreshToken: string
    ) => {
        const refreshTokenHash =
            hashRefreshToken(
                refreshToken
            );

        const session =
            await Session.findOne({
                refreshTokenHash,

                status:
                    SESSION_STATUSES.ACTIVE,

                expiresAt: {
                    $gt: new Date(),
                },
            }).select(
                "+refreshTokenHash"
            );

        return session;
    };


/*
|--------------------------------------------------------------------------
| Require Active Session
|--------------------------------------------------------------------------
*/

export const requireActiveSession =
    async (
        sessionId: string
    ) => {
        const session =
            await findActiveSessionById(
                sessionId
            );

        if (!session) {
            throw ApiError.unauthorized(
                "Session is invalid, expired, or revoked.",
                {
                    code:
                        "INVALID_SESSION",
                }
            );
        }

        return session;
    };


/*
|--------------------------------------------------------------------------
| Update Session Activity
|--------------------------------------------------------------------------
*/

export const touchSession = async (
    sessionId: string
) => {
    const _id =
        validateObjectId(
            sessionId,
            "session ID"
        );

    return Session.findOneAndUpdate(
        {
            _id,

            status:
                SESSION_STATUSES.ACTIVE,

            expiresAt: {
                $gt: new Date(),
            },
        },
        {
            $set: {
                lastUsedAt:
                    new Date(),
            },
        },
        {
            new: true,
        }
    );
};


/*
|--------------------------------------------------------------------------
| Revoke Session
|--------------------------------------------------------------------------
|
| Generic service operation.
| Used internally when ownership has already
| been established.
|
*/

export const revokeSession = async (
    sessionId: string
) => {
    const _id =
        validateObjectId(
            sessionId,
            "session ID"
        );

    return Session.findOneAndUpdate(
        {
            _id,

            status:
                SESSION_STATUSES.ACTIVE,
        },
        {
            $set: {
                status:
                    SESSION_STATUSES.REVOKED,

                revokedAt:
                    new Date(),
            },
        },
        {
            new: true,
        }
    );
};


/*
|--------------------------------------------------------------------------
| Revoke User-Owned Session
|--------------------------------------------------------------------------
|
| Security-sensitive operation.
|
| The userId and sessionId are checked
| together in the database query.
|
*/

export const revokeUserSession =
    async (
        userId: string,
        sessionId: string
    ) => {
        const _userId =
            validateObjectId(
                userId,
                "user ID"
            );

        const _sessionId =
            validateObjectId(
                sessionId,
                "session ID"
            );

        return Session.findOneAndUpdate(
            {
                _id: _sessionId,

                userId: _userId,

                status:
                    SESSION_STATUSES.ACTIVE,
            },
            {
                $set: {
                    status:
                        SESSION_STATUSES.REVOKED,

                    revokedAt:
                        new Date(),
                },
            },
            {
                new: true,
            }
        );
    };


/*
|--------------------------------------------------------------------------
| Revoke All User Sessions
|--------------------------------------------------------------------------
*/

export const revokeAllUserSessions =
    async (
        userId: string
    ) => {
        const _userId =
            validateObjectId(
                userId,
                "user ID"
            );

        return Session.updateMany(
            {
                userId: _userId,

                status:
                    SESSION_STATUSES.ACTIVE,
            },
            {
                $set: {
                    status:
                        SESSION_STATUSES.REVOKED,

                    revokedAt:
                        new Date(),
                },
            }
        );
    };


/*
|--------------------------------------------------------------------------
| Get User Active Sessions
|--------------------------------------------------------------------------
*/

export const getUserActiveSessions =
    async (
        userId: string
    ) => {
        const _userId =
            validateObjectId(
                userId,
                "user ID"
            );

        return Session.find({
            userId: _userId,

            status:
                SESSION_STATUSES.ACTIVE,

            expiresAt: {
                $gt: new Date(),
            },
        })
            .select(
                "-refreshTokenHash"
            )
            .sort({
                lastUsedAt: -1,
            });
    };