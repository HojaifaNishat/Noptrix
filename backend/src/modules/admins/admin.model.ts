import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";


/*
|--------------------------------------------------------------------------
| Admin Status
|--------------------------------------------------------------------------
*/

export const ADMIN_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    BLOCKED: "BLOCKED",
} as const;

export type AdminStatus =
    typeof ADMIN_STATUSES[
        keyof typeof ADMIN_STATUSES
    ];


/*
|--------------------------------------------------------------------------
| Admin Interface
|--------------------------------------------------------------------------
*/

export interface IAdmin {
    _id: Types.ObjectId;

    userId: Types.ObjectId;

    roleId: Types.ObjectId;

    status: AdminStatus;

    lastLoginAt?: Date;

    lastLoginIp?: string;

    passwordChangedAt?: Date;

    failedLoginAttempts: number;

    lockedUntil?: Date;

    createdBy?: Types.ObjectId;

    updatedBy?: Types.ObjectId;

    createdAt: Date;

    updatedAt: Date;
}


/*
|--------------------------------------------------------------------------
| Admin Document
|--------------------------------------------------------------------------
*/

export interface IAdminDocument
    extends IAdmin,
        Document {}


/*
|--------------------------------------------------------------------------
| Admin Model
|--------------------------------------------------------------------------
*/

export type AdminModel =
    Model<IAdminDocument>;


/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const adminSchema =
    new Schema<IAdminDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "User ID is required.",
                ],
                unique: true,
                index: true,
            },

            roleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                required: [
                    true,
                    "Role ID is required.",
                ],
                index: true,
            },

            status: {
                type: String,
                enum: Object.values(
                    ADMIN_STATUSES,
                ),
                default:
                    ADMIN_STATUSES.ACTIVE,
                index: true,
            },

            lastLoginAt: {
                type: Date,
            },

            lastLoginIp: {
                type: String,
                trim: true,
                maxlength: 100,
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

            createdBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },

            updatedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );


/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

adminSchema.index(
    {
        roleId: 1,
        status: 1,
    },
    {
        name: "admin_role_status",
    },
);

adminSchema.index(
    {
        status: 1,
        createdAt: -1,
    },
    {
        name: "admin_status_createdAt",
    },
);


/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Admin =
    model<
        IAdminDocument,
        AdminModel
    >(
        "Admin",
        adminSchema,
    );