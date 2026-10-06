import {
    connectDatabase,
    disconnectDatabase,
} from "../src/config/database";

import {
    Types,
} from "mongoose";

import bcrypt from "bcryptjs";

import {
    Permission,
} from "../src/modules/permissions/permission.model";

import {
    Role,
} from "../src/modules/roles/role.model";

import {
    RolePermission,
} from "../src/modules/role-permissions/role.permission.model";

import {
    Owner,
} from "../src/modules/owners/owner.model";

import {
    User,
    type IUserDocument,
} from "../src/modules/users/user.model";

import {
    createUser,
} from "../src/modules/users/user.service";

import {
    seedNotificationTemplates,
} from "./seed-notification-templates";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const PASSWORD_SALT_ROUNDS = 12;

/*
|--------------------------------------------------------------------------
| System Permissions
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| These are permission definitions only.
|
| They do NOT automatically grant access to ADMIN,
| SUPER ADMIN, MANAGER, or any other role.
|
| OWNER does not depend on these assignments at all.
|
| Owner can explicitly assign these permissions to roles.
|
|--------------------------------------------------------------------------
*/

const permissions = [
    /*
    |--------------------------------------------------------------------------
    | Employee Management
    |--------------------------------------------------------------------------
    */

    [
        "employees",
        "read",
        "employees.read",
    ],

    [
        "employees",
        "create",
        "employees.create",
    ],

    [
        "employees",
        "update",
        "employees.update",
    ],

    [
        "employees",
        "delete",
        "employees.delete",
    ],

    [
        "employees",
        "manage",
        "employees.manage",
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Template Management
    |--------------------------------------------------------------------------
    |
    | Owner-controlled notification template permissions.
    |
    |--------------------------------------------------------------------------
    */

    [
        "notification_templates",
        "read",
        "notification_templates.read",
    ],

    [
        "notification_templates",
        "create",
        "notification_templates.create",
    ],

    [
        "notification_templates",
        "update",
        "notification_templates.update",
    ],

    [
        "notification_templates",
        "delete",
        "notification_templates.delete",
    ],
] as const;

/*
|--------------------------------------------------------------------------
| System Roles
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Roles are seeded as system roles.
|
| No role receives automatic access to every permission.
|
| Permission assignment is controlled separately by OWNER.
|
|--------------------------------------------------------------------------
*/

const roles = [
    {
        name: "Super Administrator",
        slug: "super-admin",
        hierarchyLevel: 100,
        description:
            "Highest non-owner administrative role. Access is explicitly assigned by the OWNER.",
    },

    {
        name: "Administrator",
        slug: "admin",
        hierarchyLevel: 90,
        description:
            "Administrative access explicitly assigned by the OWNER.",
    },

    {
        name: "Manager",
        slug: "manager",
        hierarchyLevel: 70,
        description:
            "Management access explicitly assigned by the OWNER.",
    },

    {
        name: "Product Manager",
        slug: "product-manager",
        hierarchyLevel: 60,
        description:
            "Product management access explicitly assigned by the OWNER.",
    },

    {
        name: "Order Manager",
        slug: "order-manager",
        hierarchyLevel: 60,
        description:
            "Order management access explicitly assigned by the OWNER.",
    },

    {
        name: "Inventory Manager",
        slug: "inventory-manager",
        hierarchyLevel: 60,
        description:
            "Inventory management access explicitly assigned by the OWNER.",
    },

    {
        name: "Delivery Manager",
        slug: "delivery-manager",
        hierarchyLevel: 60,
        description:
            "Delivery management access explicitly assigned by the OWNER.",
    },

    {
        name: "Support",
        slug: "support",
        hierarchyLevel: 40,
        description:
            "Customer support access explicitly assigned by the OWNER.",
    },

    {
        name: "Rider",
        slug: "rider",
        hierarchyLevel: 20,
        description:
            "Rider administrative access explicitly assigned by the OWNER.",
    },
] as const;

/*
|--------------------------------------------------------------------------
| Seed System Permissions
|--------------------------------------------------------------------------
*/

const seedPermissions = async (): Promise<
    Map<string, Types.ObjectId>
> => {
    const permissionDocuments =
        new Map<
            string,
            Types.ObjectId
        >();

    for (const [
        resource,
        action,
        key,
    ] of permissions) {
        const permission =
            await Permission.findOneAndUpdate(
                {
                    key,
                },
                {
                    $set: {
                        resource,
                        action,
                        key,
                        description:
                            `${resource} ${action} permission.`,
                        isSystemPermission:
                            true,
                        status:
                            "ACTIVE",
                    },
                },
                {
                    upsert: true,
                    returnDocument:
                        "after",
                    setDefaultsOnInsert:
                        true,
                },
            )
                .select("_id")
                .exec();

        if (!permission) {
            throw new Error(
                `Failed to seed permission: ${key}`,
            );
        }

        permissionDocuments.set(
            key,
            permission._id,
        );
    }

    console.log(
        `System permissions seeded: ${permissionDocuments.size}`,
    );

    return permissionDocuments;
};

/*
|--------------------------------------------------------------------------
| Seed System Roles
|--------------------------------------------------------------------------
*/

const seedRoles = async (): Promise<
    Map<string, Types.ObjectId>
> => {
    const roleDocuments =
        new Map<
            string,
            Types.ObjectId
        >();

    for (const roleInput of roles) {
        const role =
            await Role.findOneAndUpdate(
                {
                    slug:
                        roleInput.slug,
                },
                {
                    $set: {
                        ...roleInput,

                        isSystemRole:
                            true,

                        status:
                            "ACTIVE",
                    },
                },
                {
                    upsert: true,
                    returnDocument:
                        "after",
                    setDefaultsOnInsert:
                        true,
                },
            )
                .select("_id")
                .exec();

        if (!role) {
            throw new Error(
                `Failed to seed role: ${roleInput.slug}`,
            );
        }

        roleDocuments.set(
            roleInput.slug,
            role._id,
        );
    }

    console.log(
        `System roles seeded: ${roleDocuments.size}`,
    );

    return roleDocuments;
};

/*
|--------------------------------------------------------------------------
| Seed Default Role Permissions
|--------------------------------------------------------------------------
|
| IMPORTANT SECURITY RULE
|--------------------------------------------------------------------------
|
| There is intentionally NO:
|
|     Super Administrator → all permissions
|
| and NO:
|
|     Manager → automatic permissions
|
| here.
|
| OWNER is the only unrestricted authority.
|
| Every other role must receive permissions explicitly
| through OWNER-controlled role-permission management.
|
|--------------------------------------------------------------------------
*/

const seedRolePermissions = async (
    _permissionDocuments: Map<
        string,
        Types.ObjectId
    >,
    _roleDocuments: Map<
        string,
        Types.ObjectId
    >,
): Promise<void> => {
    /*
    |--------------------------------------------------------------------------
    | Intentionally empty
    |--------------------------------------------------------------------------
    |
    | Do NOT automatically assign permissions to any role.
    |
    | This prevents a newly seeded permission from silently
    | becoming available to every administrator.
    |
    |--------------------------------------------------------------------------
    */

    console.log(
        "Role permissions seeded: 0 automatic assignments.",
    );

    console.log(
        "All non-owner permissions remain OWNER-controlled.",
    );
};

/*
|--------------------------------------------------------------------------
| Seed Owner
|--------------------------------------------------------------------------
*/

const seedOwner = async (): Promise<Types.ObjectId> => {
    const ownerName =
        process.env.OWNER_NAME
            ?.trim();

    const ownerEmail =
        process.env.OWNER_EMAIL
            ?.trim()
            .toLowerCase();

    const ownerPassword =
        process.env.OWNER_PASSWORD;

    const ownerCode =
        process.env.OWNER_CODE
            ?.trim();

    if (
        !ownerName ||
        !ownerEmail ||
        !ownerPassword ||
        !ownerCode
    ) {
        throw new Error(
            "OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD, and OWNER_CODE are required.",
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Existing User
    |--------------------------------------------------------------------------
    */

    let ownerUser:
        | IUserDocument
        | null =
        await User.findOne({
            email:
                ownerEmail,
        })
            .select("+password")
            .exec();

    /*
    |--------------------------------------------------------------------------
    | Create Owner User
    |--------------------------------------------------------------------------
    */

    if (!ownerUser) {
        ownerUser =
            await createUser({
                name:
                    ownerName,

                email:
                    ownerEmail,

                password:
                    ownerPassword,
            });

        console.log(
            `Owner user created: ${ownerEmail}`,
        );
    }

    if (!ownerUser) {
        throw new Error(
            "Failed to create or retrieve owner user.",
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Synchronize Owner Password
    |--------------------------------------------------------------------------
    */

    const passwordMatches =
        await bcrypt.compare(
            ownerPassword,
            ownerUser.password,
        );

    if (!passwordMatches) {
        ownerUser.password =
            await bcrypt.hash(
                ownerPassword,
                PASSWORD_SALT_ROUNDS,
            );

        ownerUser.passwordChangedAt =
            new Date();

        await ownerUser.save();

        console.log(
            `Owner password updated for ${ownerEmail}.`,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Owner
    |--------------------------------------------------------------------------
    */

    const existingOwner =
        await Owner.findOne({
            userId:
                ownerUser._id,
        }).exec();

    if (existingOwner) {
        const secretCodeHash =
            await bcrypt.hash(
                ownerCode,
                PASSWORD_SALT_ROUNDS,
            );

        existingOwner.secretCodeHash =
            secretCodeHash;

        existingOwner.status =
            "ACTIVE";

        await existingOwner.save();

        console.log(
            "Owner account already exists; synchronized credentials and status.",
        );

        return ownerUser._id;
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Owner Secret Code
    |--------------------------------------------------------------------------
    */

    const secretCodeHash =
        await bcrypt.hash(
            ownerCode,
            PASSWORD_SALT_ROUNDS,
        );

    /*
    |--------------------------------------------------------------------------
    | Create Owner Profile
    |--------------------------------------------------------------------------
    */

    await Owner.create({
        userId:
            ownerUser._id,

        role:
            "OWNER",

        secretCodeHash,

        status:
            "ACTIVE",
    });

    console.log(
        `Owner profile created for ${ownerEmail}.`,
    );

    return ownerUser._id;
};

/*
|--------------------------------------------------------------------------
| Main Seed
|--------------------------------------------------------------------------
*/

const seed = async (): Promise<void> => {
    await connectDatabase();

    console.log(
        "Starting NOPTRIX database seed...",
    );

    /*
    |--------------------------------------------------------------------------
    | Permission Catalog
    |--------------------------------------------------------------------------
    */

    const permissionDocuments =
        await seedPermissions();

    /*
    |--------------------------------------------------------------------------
    | System Roles
    |--------------------------------------------------------------------------
    */

    const roleDocuments =
        await seedRoles();

    /*
    |--------------------------------------------------------------------------
    | Explicit Role Permissions
    |--------------------------------------------------------------------------
    |
    | No automatic assignments.
    |
    |--------------------------------------------------------------------------
    */

    await seedRolePermissions(
        permissionDocuments,
        roleDocuments,
    );

    /*
    |--------------------------------------------------------------------------
    | OWNER
    |--------------------------------------------------------------------------
    */

    const ownerUserId =
        await seedOwner();

    /*
    |--------------------------------------------------------------------------
    | Notification Templates
    |--------------------------------------------------------------------------
    |
    | 33 event keys × 4 channels = 132 templates.
    |
    |--------------------------------------------------------------------------
    */

    await seedNotificationTemplates(
        ownerUserId,
    );

    console.log(
        "NOPTRIX database seed completed successfully.",
    );
};

/*
|--------------------------------------------------------------------------
| Execute Seed
|--------------------------------------------------------------------------
*/

seed()
    .catch((error: unknown) => {
        console.error(
            "NOPTRIX seed failed.",
            error,
        );

        process.exitCode = 1;
    })
    .finally(
        async () => {
            await disconnectDatabase();
        },
    );
