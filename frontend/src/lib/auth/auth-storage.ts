const AUTH_STATE_KEY =
    "noptrix-auth-state";

export interface StoredAuthState {
    accountType: string;

    userId: string;

    role?: string;
}

export const authStorage = {
    get(): StoredAuthState | null {
        if (
            typeof window === "undefined"
        ) {
            return null;
        }

        try {
            const value =
                window.localStorage.getItem(
                    AUTH_STATE_KEY,
                );

            if (!value) {
                return null;
            }

            return JSON.parse(
                value,
            ) as StoredAuthState;
        } catch {
            return null;
        }
    },

    set(
        state: StoredAuthState,
    ): void {
        if (
            typeof window === "undefined"
        ) {
            return;
        }

        window.localStorage.setItem(
            AUTH_STATE_KEY,
            JSON.stringify(state),
        );
    },

    clear(): void {
        if (
            typeof window === "undefined"
        ) {
            return;
        }

        window.localStorage.removeItem(
            AUTH_STATE_KEY,
        );
    },
};