"use client";

import { useEffect, useState } from "react";

import {
    healthApi,
    type HealthResponse,
} from "@/services/api/health.api";

import { env } from "@/config/env";

export default function HomePage() {
    const [status, setStatus] =
        useState("Starting request...");

    const [health, setHealth] =
        useState<HealthResponse | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const checkBackend = async () => {
            setStatus("Request started...");

            try {
                const response =
                    await healthApi.check();

                setStatus("Request completed.");

                setHealth(response);
            } catch (error) {
                setStatus("Request failed.");

                if (error instanceof Error) {
                    setError(
                        `${error.name}: ${error.message}`,
                    );
                } else {
                    setError(String(error));
                }
            }
        };

        void checkBackend();
    }, []);

    return (
        <main
            style={{
                padding: "24px",
                fontFamily: "Arial, sans-serif",
                wordBreak: "break-word",
            }}
        >
            <h1>NOPTRIX</h1>

            <h2>Backend Connection Debug</h2>

            <hr />

            <p>
                <strong>API URL:</strong>
            </p>

            <p>{env.apiUrl}</p>

            <hr />

            <p>
                <strong>Status:</strong>
            </p>

            <p>{status}</p>

            {health && (
                <>
                    <hr />

                    <h3>✅ Backend Connected</h3>

                    <p>
                        <strong>Message:</strong>{" "}
                        {health.message}
                    </p>

                    <p>
                        <strong>Timestamp:</strong>{" "}
                        {health.timestamp}
                    </p>
                </>
            )}

            {error && (
                <>
                    <hr />

                    <h3>❌ Backend Connection Failed</h3>

                    <p>
                        <strong>Error:</strong>
                    </p>

                    <p>{error}</p>
                </>
            )}
        </main>
    );
}