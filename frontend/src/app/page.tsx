"use client";

import { useEffect, useState } from "react";

import {
    categoriesApi,
    type Category,
} from "@/services/api/categories.api";

import { env } from "@/config/env";

import CategoryGrid from "@/components/category/CategoryGrid";

export default function HomePage() {
    const [categories, setCategories] =
        useState<Category[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response =
                    await categoriesApi.listActive();

                setCategories(response.data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(
                        `${error.name}: ${error.message}`,
                    );
                } else {
                    setError(String(error));
                }
            } finally {
                setLoading(false);
            }
        };

        void loadCategories();
    }, []);

    return (
        <main
            style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "24px",
                fontFamily: "Arial, sans-serif",
                wordBreak: "break-word",
            }}
        >
            <header
                style={{
                    padding: "24px 0",
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: "36px",
                        fontWeight: 800,
                    }}
                >
                    NOPTRIX
                </h1>

                <p
                    style={{
                        margin: "8px 0 0",
                        color: "#6b7280",
                    }}
                >
                    Professional Ecommerce
                </p>

                <p
                    style={{
                        margin: "8px 0 0",
                        fontSize: "13px",
                        color: "#9ca3af",
                    }}
                >
                    API: {env.apiUrl}
                </p>
            </header>

            <hr />

            {loading && (
                <section
                    style={{
                        padding: "40px 0",
                    }}
                >
                    <p>Loading categories...</p>
                </section>
            )}

            {error && (
                <section
                    style={{
                        padding: "40px 0",
                    }}
                >
                    <h2>
                        Unable to load categories
                    </h2>

                    <p>{error}</p>
                </section>
            )}

            {!loading && !error && (
                <CategoryGrid
                    categories={categories}
                />
            )}
        </main>
    );
}
