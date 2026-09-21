import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Permission Status
|--------------------------------------------------------------------------
*/

export const PERMISSION_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
} as const;

export type PermissionStatus =
    typeof PERMISSION_STATUSES[
        keyof typeof PERMISSION_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Permission Actions
|--------------------------------------------------------------------------
|
| These are the standard actions supported by
| the permission system.
|
*/

export const PERMISSION_ACTIONS = {
    READ: "read",
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    APPROVE: "approve",
    REJECT: "reject",
    SUSPEND: "suspend",
    ACTIVATE: "activate",
    EXPORT: "export",
    IMPORT: "import",
    REFUND: "refund",
    CANCEL: "cancel",
    MANAGE: "manage",
} as const;

export type PermissionAction =
    typeof PERMISSION_ACTIONS[
        keyof typeof PERMISSION_ACTIONS
    ];

/*
|--------------------------------------------------------------------------
| Permission Interface
|--------------------------------------------------------------------------
*/

export interface IPermission {
    _id: Types.ObjectId;

    /**
     * Resource being protected.
     *
     * Example:
     * products
     * orders
     * inventory
     * staff
     */
    resource: string;

    /**
     * Action allowed on the resource.
     *
     * Example:
     * read
     * create
     * update
     * delete
     */
    action: PermissionAction;

    /**
     * Unique machine-readable permission key.
     *
     * Example:
     * products.read
     * orders.cancel
     * payments.refund
     */
    key: string;

    description?: string;

    /**
     * System permissions are protected
     * application-defined permissions.
     */
    isSystemPermission: boolean;

    status: PermissionStatus;

    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Permission Document
|--------------------------------------------------------------------------
*/

export interface IPermissionDocument
    extends IPermission,
        Document {}

/*
|--------------------------------------------------------------------------
| Permission Model
|--------------------------------------------------------------------------
*/

export type PermissionModel =
    Model<IPermissionDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const permissionSchema =
    new Schema<IPermissionDocument>(
        {
            resource: {
                type: String,
                required: [
                    true,
                    "Permission resource is required.",
                ],
                trim: true,
                lowercase: true,
                minlength: [
                    2,
                    "Permission resource must be at least 2 characters.",
                ],
                maxlength: [
                    100,
                    "Permission resource cannot exceed 100 characters.",
                ],
                match: [
                    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
                    "Permission resource contains invalid characters.",
                ],
            },

            action: {
                type: String,
                required: [
                    true,
                    "Permission action is required.",
                ],
                enum: {
                    values: Object.values(
                        PERMISSION_ACTIONS
                    ),
                    message:
                        "Invalid permission action.",
                },
            },

            key: {
                type: String,
                required: [
                    true,
                    "Permission key is required.",
                ],
                trim: true,
                lowercase: true,
                minlength: [
                    4,
                    "Permission key is too short.",
                ],
                maxlength: [
                    200,
                    "Permission key cannot exceed 200 characters.",
                ],
                match: [
                    /^[a-z0-9]+(?:[-_][a-z0-9]+)*\.[a-z]+$/,
                    "Permission key must follow the format resource.action.",
                ],
            },

            description: {
                type: String,
                trim: true,
                maxlength: [
                    500,
                    "Permission description cannot exceed 500 characters.",
                ],
            },

            isSystemPermission: {
                type: Boolean,
                default: false,
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        PERMISSION_STATUSES
                    ),
                    message:
                        "Invalid permission status.",
                },
                default:
                    PERMISSION_STATUSES.ACTIVE,
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

permissionSchema.index(
    {
        resource: 1,
        action: 1,
    },
    {
        unique: true,
        name: "permission_resource_action_unique",
    }
);

permissionSchema.index(
    {
        key: 1,
    },
    {
        unique: true,
        name: "permission_key_unique",
    }
);

permissionSchema.index(
    {
        status: 1,
        resource: 1,
    },
    {
        name: "permission_status_resource",
    }
);

permissionSchema.index(
    {
        isSystemPermission: 1,
        status: 1,
    },
    {
        name: "permission_system_status",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Permission =
    model<
        IPermissionDocument,
        PermissionModel
    >(
        "Permission",
        permissionSchema
    );