"use client";

import Link from "next/link";

import type {
    Category,
} from "@/services/api/categories.api";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface CategoryGridProps {
    readonly categories: readonly Category[];
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CategoryGrid({
    categories,
}: CategoryGridProps) {
    if (categories.length === 0) {
        return (
            <section
                aria-label="Categories"
                style={{
                    padding: "24px 0",
                }}
            >
                <p>No categories available.</p>
            </section>
        );
    }

    return (
        <section
            aria-labelledby="categories-heading"
            style={{
                padding: "32px 0",
            }}
        >
            <div
                style={{
                    marginBottom: "24px",
                }}
            >
                <h2
                    id="categories-heading"
                    style={{
                        margin: 0,
                        fontSize: "28px",
                        fontWeight: 700,
                    }}
                >
                    Shop by Category
                </h2>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "20px",
                }}
            >
                {categories.map((category) => (
                    <Link
                        key={category._id}
                        href={`/categories/${category.slug}`}
                        style={{
                            display: "block",
                            textDecoration: "none",
                            color: "inherit",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "#ffffff",
                        }}
                    >
                        {category.image?.secureUrl ? (
                            <img
                                src={
                                    category.image
                                        .secureUrl
                                }
                                alt={category.name}
                                loading="lazy"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "180px",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <div
                                aria-hidden="true"
                                style={{
                                    width: "100%",
                                    height: "180px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                        "center",
                                    background:
                                        "#f3f4f6",
                                    color: "#6b7280",
                                }}
                            >
                                No Image
                            </div>
                        )}

                        <div
                            style={{
                                padding: "16px",
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "18px",
                                    fontWeight: 600,
                                }}
                            >
                                {category.name}
                            </h3>

                            {category.description && (
                                <p
                                    style={{
                                        margin:
                                            "8px 0 0",
                                        fontSize:
                                            "14px",
                                        lineHeight:
                                            1.5,
                                        color:
                                            "#6b7280",
                                    }}
                                >
                                    {
                                        category.description
                                    }
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
