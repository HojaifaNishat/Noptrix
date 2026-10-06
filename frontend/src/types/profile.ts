/*
|--------------------------------------------------------------------------
| Admin Profile
|--------------------------------------------------------------------------
*/

export interface AdminProfileRole {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly description?: string;
}

export interface AdminProfile {
    readonly adminId: string;
    readonly userId: string;
    readonly name: string;
    readonly email?: string;
    readonly phone?: string;
    readonly avatarUrl?: string;
    readonly avatarPublicId?: string;
    readonly userStatus: string;
    readonly adminStatus: string;
    readonly roleId: string;
    readonly role: AdminProfileRole;
    readonly lastLoginAt?: string;
    readonly passwordChangedAt?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Owner Profile
|--------------------------------------------------------------------------
*/

export interface OwnerProfile {
    readonly ownerId: string;
    readonly userId: string;
    readonly role: "OWNER";
    readonly status: string;
    readonly name: string;
    readonly email?: string;
    readonly phone?: string;
    readonly avatarUrl?: string;
    readonly lastLoginAt?: string;
    readonly lastSecretVerificationAt?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}
