import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Role Status
|--------------------------------------------------------------------------
*/

export const ROLE_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
} as const;

export type RoleStatus =
    typeof ROLE_STATUSES[
        keyof typeof ROLE_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Role Interface
|--------------------------------------------------------------------------
*/

export interface IRole {
    _id: Types.ObjectId;

    name: string;
    slug: string;
    description?: string;

    /**
     * System roles are protected roles
     * created by the application.
     *
     * Custom roles can be created/managed
     * by authorized administrators.
     */
    isSystemRole: boolean;

    status: RoleStatus;

    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Role Document
|--------------------------------------------------------------------------
*/

export interface IRoleDocument
    extends IRole,
        Document {}

/*
|--------------------------------------------------------------------------
| Role Model
|--------------------------------------------------------------------------
*/

export type RoleModel =
    Model<IRoleDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const roleSchema =
    new Schema<IRoleDocument>(
        {
            name: {
                type: String,
                required: [
                    true,
                    "Role name is required.",
                ],
                trim: true,
                minlength: [
                    2,
                    "Role name must be at least 2 characters.",
                ],
                maxlength: [
                    100,
                    "Role name cannot exceed 100 characters.",
                ],
            },

            slug: {
                type: String,
                required: [
                    true,
                    "Role slug is required.",
                ],
                trim: true,
                lowercase: true,
                minlength: [
                    2,
                    "Role slug must be at least 2 characters.",
                ],
                maxlength: [
                    100,
                    "Role slug cannot exceed 100 characters.",
                ],
                match: [
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    "Role slug can only contain lowercase letters, numbers, and hyphens.",
                ],
            },

            description: {
                type: String,
                trim: true,
                maxlength: [
                    500,
                    "Role description cannot exceed 500 characters.",
                ],
            },

            isSystemRole: {
                type: Boolean,
                default: false,
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        ROLE_STATUSES
                    ),
                    message:
                        "Invalid role status.",
                },
                default:
                    ROLE_STATUSES.ACTIVE,
                index: true,
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
        }
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

roleSchema.index(
    { slug: 1 },
    {
        unique: true,
        name: "role_slug_unique",
    }
);

roleSchema.index(
    { status: 1, createdAt: -1 },
    {
        name: "role_status_createdAt",
    }
);

roleSchema.index(
    { isSystemRole: 1, status: 1 },
    {
        name: "role_system_status",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Role =
    model<IRoleDocument, RoleModel>(
        "Role",
        roleSchema
    );