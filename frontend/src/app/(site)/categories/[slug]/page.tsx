import Link from "next/link";

import {
    categoriesApi,
} from "@/services/api/categories.api";

interface CategoryPageProps {
    readonly params: Promise<{
        slug: string;
    }>;
}

export default async function CategoryPage({
    params,
}: CategoryPageProps) {
    const { slug } = await params;

    let category = null;
    let errorMessage: string | null = null;

    try {
        const response =
            await categoriesApi.getBySlug(slug);

        category = response.data;
    } catch (error) {
        if (error instanceof Error) {
            errorMessage =
                `${error.name}: ${error.message}`;
        } else {
            errorMessage = String(error);
        }
    }

    if (!category) {
        return (
            <main
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "40px 24px",
                    fontFamily:
                        "Arial, sans-serif",
                }}
            >
                <h1>
                    Category not found
                </h1>

                <p>
                    We could not load this
                    category.
                </p>

                {errorMessage && (
                    <p>{errorMessage}</p>
                )}

                <Link href="/">
                    ← Back to home
                </Link>
            </main>
        );
    }

    return (
        <main
            style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "40px 24px",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >
            <p>
                <Link href="/">
                    ← Back to home
                </Link>
            </p>

            <article
                style={{
                    marginTop: "24px",
                }}
            >
                {category.image?.secureUrl && (
                    <img
                        src={
                            category.image.secureUrl
                        }
                        alt={category.name}
                        style={{
                            display: "block",
                            width: "100%",
                            maxWidth: "800px",
                            height: "360px",
                            objectFit: "cover",
                            borderRadius: "16px",
                        }}
                    />
                )}

                <div
                    style={{
                        marginTop: "24px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "36px",
                        }}
                    >
                        {category.name}
                    </h1>

                    {category.description && (
                        <p
                            style={{
                                marginTop: "12px",
                                fontSize: "17px",
                                lineHeight: 1.6,
                                color:
                                    "#6b7280",
                            }}
                        >
                            {category.description}
                        </p>
                    )}

                    <p
                        style={{
                            marginTop: "16px",
                            fontSize: "14px",
                            color: "#9ca3af",
                        }}
                    >
                        Status: {category.status}
                    </p>
                </div>
            </article>
        </main>
    );
}
