const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
    throw new Error(
        "Missing required environment variable: NEXT_PUBLIC_API_URL",
    );
}

export const env = {
    apiUrl,

    appUrl:
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000",

    appName:
        process.env.NEXT_PUBLIC_APP_NAME ??
        "NOPTRIX",
} as const;