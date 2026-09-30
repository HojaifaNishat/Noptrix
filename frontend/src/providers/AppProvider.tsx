"use client";

import {
    type ReactNode,
} from "react";

import {
    AuthProvider,
} from "./AuthProvider";

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({
    children,
}: AppProviderProps) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}