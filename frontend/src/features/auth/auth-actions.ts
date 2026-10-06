import {
    authApi,
} from "@/services/api/auth.api";

import {
    adminAuthApi,
} from "@/services/api/admin-auth.api";

import {
    customerAuthApi,
} from "@/services/api/customer-auth.api";

import {
    ownerAuthApi,
} from "@/services/api/owner-auth.api";

import {
    riderAuthApi,
} from "@/services/api/rider-auth.api";

import {
    sellerAuthApi,
} from "@/services/api/seller-auth.api";

import {
    useAuthStore,
} from "@/stores/auth.store";

import {
    authStorage,
} from "@/lib/auth/auth-storage";

import {
    tokenStorage,
} from "@/lib/auth/token-storage";

import type {
    AuthUser,
    LoginInput,
    RegisterInput,
} from "@/types/auth";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const saveAuthenticatedUser = (
    user: AuthUser,
): AuthUser => {
    useAuthStore
        .getState()
        .setUser(user);

    authStorage.set({
        accountType:
            user.accountType,

        userId:
            user.id,

        role:
            user.role,
    });

    return user;
};


/*
|--------------------------------------------------------------------------
| Owner
|--------------------------------------------------------------------------
*/

export const ownerLogin = async (
    input: LoginInput,
): Promise<AuthUser> => {
    const response =
        await ownerAuthApi.login(input);

    tokenStorage.set(
        response.accessToken,
    );

    const user: AuthUser = {
        id:
            response.userId,

        email:
            input.email,

        accountType:
            "OWNER",

        role:
            "OWNER",

        isVerified:
            false,

        secretVerified:
            false,
    };

    return saveAuthenticatedUser(
        user,
    );
};


export const ownerVerifySecret = async (
    secretCode: string,
): Promise<AuthUser> => {
    const response =
        await ownerAuthApi.verifySecret({
            secretCode,
        });

    tokenStorage.set(
        response.accessToken,
    );

    const user: AuthUser = {
        id:
            response.userId,

        email:
            useAuthStore
                .getState()
                .user?.email ?? "",

        accountType:
            "OWNER",

        role:
            "OWNER",

        isVerified:
            true,

        secretVerified:
            true,
    };

    return saveAuthenticatedUser(
        user,
    );
};


/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

export const adminLogin = async (
    input: LoginInput,
): Promise<AuthUser> => {
    const response =
        await adminAuthApi.login(input);

    if (response.accessToken) {
        tokenStorage.set(
            response.accessToken,
        );
    }

    return saveAuthenticatedUser(
        response.user,
    );
};


/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

export const customerLogin = async (
    input: LoginInput,
): Promise<AuthUser> => {
    const response =
        await customerAuthApi.login(input);

    if (response.accessToken) {
        tokenStorage.set(
            response.accessToken,
        );
    }

    return saveAuthenticatedUser(
        response.user,
    );
};


export const customerRegister =
    async (
        input: RegisterInput,
    ): Promise<AuthUser> => {
        const response =
            await customerAuthApi.register(
                input,
            );

        if (response.accessToken) {
            tokenStorage.set(
                response.accessToken,
            );
        }

        return saveAuthenticatedUser(
            response.user,
        );
    };


/*
|--------------------------------------------------------------------------
| Seller
|--------------------------------------------------------------------------
*/

export const sellerLogin = async (
    input: LoginInput,
): Promise<AuthUser> => {
    const response =
        await sellerAuthApi.login(input);

    if (response.accessToken) {
        tokenStorage.set(
            response.accessToken,
        );
    }

    return saveAuthenticatedUser(
        response.user,
    );
};


/*
|--------------------------------------------------------------------------
| Rider
|--------------------------------------------------------------------------
*/

export const riderLogin = async (
    input: LoginInput,
): Promise<AuthUser> => {
    const response =
        await riderAuthApi.login(input);

    if (response.accessToken) {
        tokenStorage.set(
            response.accessToken,
        );
    }

    return saveAuthenticatedUser(
        response.user,
    );
};


/*
|--------------------------------------------------------------------------
| Current Session
|--------------------------------------------------------------------------
*/

export const restoreAuthSession =
    async (): Promise<AuthUser> => {

        const stored =
            authStorage.get();

        if (!stored) {
            throw new Error(
                "No stored authentication state.",
            );
        }

        let user: AuthUser;

        switch (
            stored.accountType
        ) {
            case "ADMIN": {
                const response =
                    await adminAuthApi.refresh();

                tokenStorage.set(
                    response.accessToken,
                );

                user =
                    response.user;

                break;
            }

            case "USER":
                user =
                    await customerAuthApi.getMe();
                break;

            case "SELLER":
                user =
                    await sellerAuthApi.getMe();
                break;

            case "RIDER":
                user =
                    await riderAuthApi.getMe();
                break;

            case "OWNER":
                throw new Error(
                    "Owner session restoration requires secret verification.",
                );

            default:
                throw new Error(
                    "Unsupported account type.",
                );
        }

        return saveAuthenticatedUser(
            user,
        );
    };


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const logout = async (): Promise<void> => {
    try {
        const user =
            useAuthStore
                .getState()
                .user;

        switch (
            user?.accountType
        ) {
            case "OWNER":
                await ownerAuthApi.logout();
                break;

            case "ADMIN":
                await adminAuthApi.logout();
                break;

            case "USER":
                if (user.id) {
                    await customerAuthApi.logout(
                        user.id,
                    );
                }
                break;

            case "SELLER":
                await sellerAuthApi.logout();
                break;

            case "RIDER":
                await riderAuthApi.logout();
                break;

            default:
                await authApi.logout();
                break;
        }
    } finally {
        tokenStorage.clear();

        authStorage.clear();

        useAuthStore
            .getState()
            .clearAuth();
    }
};
