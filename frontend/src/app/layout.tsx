import type {
    Metadata,
} from "next";

import "./globals.css";

import {
    AppProvider,
} from "@/providers/AppProvider";

export const metadata: Metadata = {
    title: "NOPTRIX",
    description: "Professional Ecommerce Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}