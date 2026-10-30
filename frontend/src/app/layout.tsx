import type {
    Metadata,
} from "next";

import "./globals.css";

import {
    AppProvider,
} from "@/providers/AppProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import PlatformFavicon from "@/components/branding/PlatformFavicon";

export const metadata: Metadata = {
    title: "NOPTRIX",
    description: "Professional Ecommerce Platform",
    icons: {
        icon: [
            {
                url: "/favicon.ico?v=4",
                type: "image/x-icon",
            },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider>
                    <AppProvider>
                        <PlatformFavicon />
                        {children}
                    </AppProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}