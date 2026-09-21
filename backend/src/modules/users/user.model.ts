import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| User Status
|--------------------------------------------------------------------------
*/

export const USER_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    BLOCKED: "BLOCKED",
} as const;

export type UserStatus =
    typeof USER_STATUSES[
        keyof typeof USER_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| User Interface
|--------------------------------------------------------------------------
*/

export interface IUser {
    _id: Types.ObjectId;

    name: string;

    email?: string;

    phone?: string;

    password: string;

    status: UserStatus;

    isEmailVerified: boolean;

    isPhoneVerified: boolean;

    lastLoginAt?: Date;

    passwordChangedAt?: Date;

    failedLoginAttempts: number;

    lockedUntil?: Date;

    createdAt: Date;

    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| User Document
|--------------------------------------------------------------------------
*/

export interface IUserDocument
    extends IUser,
        Document {}

/*
|--------------------------------------------------------------------------
| User Model
|--------------------------------------------------------------------------
*/

export type UserModel =
    Model<IUserDocument>;

/*
|--------------------------------------------------------------------------
| User Schema
|--------------------------------------------------------------------------
*/

const userSchema =
    new Schema<IUserDocument>(
        {
            name: {
                type: String,

                required: [
                    true,
                    "User name is required.",
                ],

                trim: true,

                minlength: [
                    2,
                    "User name must be at least 2 characters.",
                ],

                maxlength: [
                    100,
                    "User name cannot exceed 100 characters.",
                ],
            },

            email: {
                type: String,

                trim: true,

                lowercase: true,

                sparse: true,

                index: true,

                validate: {
                    validator: (
                        value?: string
                    ) => {
                        if (!value) {
                            return true;
                        }

                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                            value
                        );
                    },

                    message:
                        "Please provide a valid email address.",
                },
            },

            phone: {
                type: String,

                trim: true,

                sparse: true,

                index: true,
            },

            password: {
                type: String,

                required: [
                    true,
                    "Password is required.",
                ],

                select: false,
            },

            status: {
                type: String,

                enum: {
                    values: Object.values(
                        USER_STATUSES
                    ),

                    message:
                        "Invalid user status.",
                },

                default:
                    USER_STATUSES.ACTIVE,

                index: true,
            },

            isEmailVerified: {
                type: Boolean,

                default: false,
            },

            isPhoneVerified: {
                type: Boolean,

                default: false,
            },

            lastLoginAt: {
                type: Date,
            },

            passwordChangedAt: {
                type: Date,
            },

            failedLoginAttempts: {
                type: Number,

                default: 0,

                min: 0,
            },

            lockedUntil: {
                type: Date,
            },
        },

        {
            timestamps: true,

            versionKey: false,
        }
    );

/*
|--------------------------------------------------------------------------
| Schema Indexes
|--------------------------------------------------------------------------
*/

userSchema.index(
    {
        email: 1,
    },
    {
        unique: true,

        sparse: true,

        name: "user_email_unique",
    }
);

userSchema.index(
    {
        phone: 1,
    },
    {
        unique: true,

        sparse: true,

        name: "user_phone_unique",
    }
);

userSchema.index(
    {
        status: 1,

        createdAt: -1,
    },
    {
        name: "user_status_createdAt",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const User =
    model<IUserDocument, UserModel>(
        "User",
        userSchema
    );