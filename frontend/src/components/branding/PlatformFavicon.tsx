"use client";

import { useEffect } from "react";

const applyFavicon = (): void => {
    const faviconPath = "/favicon.ico?v=4";
    const iconLinks = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
    );

    if (iconLinks.length === 0) {
        const link = document.createElement("link");
        link.rel = "icon";
        link.dataset.platformFavicon = "true";
        document.head.append(link);
        iconLinks.push(link);
    }

    for (const link of iconLinks) {
        link.dataset.platformFavicon = "true";
        link.href = faviconPath;
    }
};

export default function PlatformFavicon() {
    useEffect(() => {
        applyFavicon();
    }, []);

    return null;
}
