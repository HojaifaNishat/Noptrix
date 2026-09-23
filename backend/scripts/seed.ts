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
*/

const permissions = [
    ["employees", "read", "employees.read"],
    ["employees", "create", "employees.create"],
    ["employees", "update", "employees.update"],
    ["employees", "delete", "employees.delete"],
    ["employees", "manage", "employees.manage"],
] as const;

/*
|--------------------------------------------------------------------------
| System Roles
|--------------------------------------------------------------------------
*/

const roles = [
    {
        name: "Super Administrator",
        slug: "super-admin",
        description:
            "Full administrative access except ownership controls.",
    },
    {
        name: "Administrator",
        slug: "admin",
        description:
            "Administrative system access.",
    },
    {
        name: "Manager",
        slug: "manager",
        description:
            "Management access.",
    },
    {
        name: "Product Manager",
        slug: "product-manager",
        description:
            "Product management access.",
    },
    {
        name: "Order Manager",
        slug: "order-manager",
        description:
            "Order management access.",
    },
    {
        name: "Inventory Manager",
        slug: "inventory-manager",
        description:
            "Inventory management access.",
    },
    {
        name: "Delivery Manager",
        slug: "delivery-manager",
        description:
            "Delivery management access.",
    },
    {
        name: "Support",
        slug: "support",
        description:
            "Customer support access.",
    },
    {
        name: "Rider",
        slug: "rider",
        description:
            "Delivery rider access.",
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
                { key },
                {
                    $set: {
                        resource,
                        action,
                        key,
                        description:
                            `${resource} ${action} permission.`,
                        isSystemPermission:
                            true,
                        status: "ACTIVE",
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert:
                        true,
                }
            )
                .select("_id")
                .exec();

        if (!permission) {
            throw new Error(
                `Failed to seed permission: ${key}`
            );
        }

        permissionDocuments.set(
            key,
            permission._id
        );
    }

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
                    slug: roleInput.slug,
                },
                {
                    $set: {
                        ...roleInput,
                        isSystemRole:
                            true,
                        status: "ACTIVE",
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert:
                        true,
                }
            )
                .select("_id")
                .exec();

        if (!role) {
            throw new Error(
                `Failed to seed role: ${roleInput.slug}`
            );
        }

        roleDocuments.set(
            roleInput.slug,
            role._id
        );
    }

    return roleDocuments;
};

/*
|--------------------------------------------------------------------------
| Seed Role Permissions
|--------------------------------------------------------------------------
*/

const seedRolePermissions = async (
    permissionDocuments: Map<
        string,
        Types.ObjectId
    >,
    roleDocuments: Map<
        string,
        Types.ObjectId
    >
): Promise<void> => {
    /*
    |--------------------------------------------------------------------------
    | Super Admin
    |--------------------------------------------------------------------------
    */

    const superAdminRoleId =
        roleDocuments.get(
            "super-admin"
        );

    if (superAdminRoleId) {
        for (const permissionId of permissionDocuments.values()) {
            await RolePermission.updateOne(
                {
                    roleId:
                        superAdminRoleId,
                    permissionId,
                },
                {
                    $setOnInsert: {
                        roleId:
                            superAdminRoleId,
                        permissionId,
                    },
                },
                {
                    upsert: true,
                }
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Manager
    |--------------------------------------------------------------------------
    */

    const managerRoleId =
        roleDocuments.get(
            "manager"
        );

    const managerPermissions = [
        permissionDocuments.get(
            "employees.read"
        ),
        permissionDocuments.get(
            "employees.update"
        ),
    ].filter(
        (
            permissionId
        ): permissionId is Types.ObjectId =>
            Boolean(permissionId)
    );

    if (managerRoleId) {
        for (const permissionId of managerPermissions) {
            await RolePermission.updateOne(
                {
                    roleId:
                        managerRoleId,
                    permissionId,
                },
                {
                    $setOnInsert: {
                        roleId:
                            managerRoleId,
                        permissionId,
                    },
                },
                {
                    upsert: true,
                }
            );
        }
    }
};

/*
|--------------------------------------------------------------------------
| Seed Owner
|--------------------------------------------------------------------------
*/

const seedOwner = async (): Promise<void> => {
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
            "OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD, and OWNER_CODE are required."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Existing User
    |--------------------------------------------------------------------------
    */

    let ownerUser: IUserDocument | null =
        await User.findOne({
            email: ownerEmail,
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
                name: ownerName,
                email: ownerEmail,
                password: ownerPassword,
            });

        console.log(
            `Owner user created: ${ownerEmail}`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Sync Owner Password
    |--------------------------------------------------------------------------
    */

    if (!ownerUser) {
        throw new Error(
            "Failed to create or retrieve owner user."
        );
    }

    const passwordMatches =
        await bcrypt.compare(
            ownerPassword,
            ownerUser.password
        );

    if (!passwordMatches) {
        ownerUser.password =
            await bcrypt.hash(
                ownerPassword,
                PASSWORD_SALT_ROUNDS
            );

        ownerUser.passwordChangedAt =
            new Date();

        await ownerUser.save();

        console.log(
            `Owner password updated for ${ownerEmail}.`
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
                PASSWORD_SALT_ROUNDS
            );

        existingOwner.secretCodeHash =
            secretCodeHash;

        existingOwner.status =
            "ACTIVE";

        await existingOwner.save();

        console.log(
            "Owner account already exists; synchronized credentials and status."
        );

        return;
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Owner Secret Code
    |--------------------------------------------------------------------------
    */

    const secretCodeHash =
        await bcrypt.hash(
            ownerCode,
            PASSWORD_SALT_ROUNDS
        );

    /*
    |--------------------------------------------------------------------------
    | Create Owner Profile
    |--------------------------------------------------------------------------
    */

    await Owner.create({
        userId:
            ownerUser._id,

        role: "OWNER",

        secretCodeHash,

        status: "ACTIVE",
    });

    console.log(
        `Owner profile created for ${ownerEmail}.`
    );
};

/*
|--------------------------------------------------------------------------
| Main Seed
|--------------------------------------------------------------------------
*/

const seed = async (): Promise<void> => {
    await connectDatabase();

    console.log(
        "Starting NOPTRIX database seed..."
    );

    const permissionDocuments =
        await seedPermissions();

    const roleDocuments =
        await seedRoles();

    await seedRolePermissions(
        permissionDocuments,
        roleDocuments
    );

    await seedOwner();

    console.log(
        "NOPTRIX database seed completed successfully."
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
            error
        );

        process.exitCode = 1;
    })
    .finally(
        async () => {
            await disconnectDatabase();
        }
    );