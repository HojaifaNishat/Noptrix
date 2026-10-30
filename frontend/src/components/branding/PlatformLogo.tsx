"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
    PLATFORM_BRANDING_UPDATED_EVENT,
    settingsApi,
} from "@/services/api/settings.api";

interface PlatformLogoProps {
    readonly className?: string;
    readonly fallbackClassName?: string;
    readonly fallbackText?: string;
}

export default function PlatformLogo({
    className = "h-9 w-9",
    fallbackClassName = "flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white dark:bg-white dark:text-black",
    fallbackText = "N",
}: PlatformLogoProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;

        const loadBranding = () => {
            void settingsApi
                .getPublicBranding()
                .then((branding) => {
                    if (active) {
                        setLogoUrl(branding.logoUrl || null);
                        setLoaded(true);
                    }
                })
                .catch((error: unknown) => {
                    console.error("Unable to load platform branding.", error);
                    if (active) {
                        setLoaded(true);
                    }
                });
        };

        loadBranding();
        window.addEventListener(
            PLATFORM_BRANDING_UPDATED_EVENT,
            loadBranding,
        );

        return () => {
            active = false;
            window.removeEventListener(
                PLATFORM_BRANDING_UPDATED_EVENT,
                loadBranding,
            );
        };
    }, []);

    if (logoUrl) {
        return (
            <Image
                src={logoUrl}
                alt="Platform logo"
                width={144}
                height={144}
                unoptimized
                className={`${className} shrink-0 object-contain`}
                onError={() => setLogoUrl(null)}
            />
        );
    }

    if (!loaded) {
        return (
            <div
                aria-hidden="true"
                className={`${fallbackClassName} shrink-0`}
            />
        );
    }

    return (
        <div
            aria-label="Platform logo"
            role="img"
            className={`${fallbackClassName} shrink-0`}
        >
            {fallbackText}
        </div>
    );
}
