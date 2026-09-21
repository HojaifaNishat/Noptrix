import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Role Permission Interface
|--------------------------------------------------------------------------
*/

export interface IRolePermission {
    _id: Types.ObjectId;

    roleId: Types.ObjectId;
    permissionId: Types.ObjectId;

    createdBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Role Permission Document
|--------------------------------------------------------------------------
*/

export interface IRolePermissionDocument
    extends IRolePermission,
        Document {}

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export type RolePermissionModel =
    Model<IRolePermissionDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const rolePermissionSchema =
    new Schema<IRolePermissionDocument>(
        {
            roleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                required: [
                    true,
                    "Role ID is required.",
                ],
            },

            permissionId: {
                type: Schema.Types.ObjectId,
                ref: "Permission",
                required: [
                    true,
                    "Permission ID is required.",
                ],
            },

            createdBy: {
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
| Unique Relationship
|--------------------------------------------------------------------------
|
| The same permission cannot be assigned
| to the same role more than once.
|
*/

rolePermissionSchema.index(
    {
        roleId: 1,
        permissionId: 1,
    },
    {
        unique: true,
        name: "role_permission_unique",
    }
);

/*
|--------------------------------------------------------------------------
| Reverse Lookup
|--------------------------------------------------------------------------
|
| Find all roles containing a permission.
|
*/

rolePermissionSchema.index(
    {
        permissionId: 1,
    },
    {
        name: "role_permission_permission",
    }
);

/*
|--------------------------------------------------------------------------
| Role Lookup
|--------------------------------------------------------------------------
|
| Find all permissions assigned to a role.
|
*/

rolePermissionSchema.index(
    {
        roleId: 1,
    },
    {
        name: "role_permission_role",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const RolePermission =
    model<
        IRolePermissionDocument,
        RolePermissionModel
    >(
        "RolePermission",
        rolePermissionSchema
    );