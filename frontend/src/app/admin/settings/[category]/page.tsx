"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Save, Settings2 } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
    SETTINGS_CATEGORIES,
    SETTINGS_CATEGORY_CONFIG,
    type SettingsCategory,
    type SettingsRecord,
} from "@/features/settings/settings.types";
import { settingsApi } from "@/services/api/settings.api";

const getErrorMessage = (error: unknown): string => {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            }
        ).response;

        if (response?.data?.message) {
            return response.data.message;
        }
    }

    return error instanceof Error
        ? error.message
        : "Unable to complete the settings request.";
};

const isSettingsCategory = (
    value: string,
): value is SettingsCategory =>
    SETTINGS_CATEGORIES.some((category) => category === value);

const displayValue = (value: unknown): string =>
    typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";

const MAX_LOGO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

export default function AdminSettingsCategoryPage() {
    const params = useParams<{ category: string }>();
    const category = params.category;
    const validCategory = isSettingsCategory(category);
    const config = validCategory
        ? SETTINGS_CATEGORY_CONFIG[category]
        : null;

    const [record, setRecord] = useState<SettingsRecord | null>(null);
    const [values, setValues] = useState<Record<string, unknown>>({});
    const [loadStatus, setLoadStatus] = useState<{
        readonly category: string;
        readonly error: string | null;
    } | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!validCategory) {
            return;
        }

        let active = true;
        void settingsApi
            .getCategory(category)
            .then((result) => {
                if (!active) {
                    return;
                }
                setRecord(result);
                setValues(result.values);
                setError(null);
                setSaved(false);
                setLoadStatus({
                    category,
                    error: null,
                });
            })
            .catch((requestError: unknown) => {
                if (!active) {
                    return;
                }
                const message = getErrorMessage(requestError);
                setError(message);
                setLoadStatus({
                    category,
                    error: message,
                });
            });

        return () => {
            active = false;
        };
    }, [category, validCategory]);

    const loading =
        validCategory &&
        loadStatus?.category !== category &&
        record?.category !== category;
    const settingsLoaded = record?.category === category;

    const changedValues = useMemo(() => {
        if (!config) {
            return {};
        }

        return Object.fromEntries(
            config.fields.flatMap((field) => {
                const value = values[field.key];
                if (value === undefined || value === null || value === "") {
                    return [];
                }
                if (typeof value === "string" && value === record?.values[field.key]) {
                    return [];
                }
                if (typeof value === "boolean" && value === record?.values[field.key]) {
                    return [];
                }
                if (typeof value === "number" && value === record?.values[field.key]) {
                    return [];
                }

                return [[field.key, value]];
            }),
        );
    }, [config, record, values]);

    const updateField = (key: string, value: unknown) => {
        setValues((current) => ({ ...current, [key]: value }));
        setSaved(false);
    };

    const saveSettings = async () => {
        if (!validCategory || Object.keys(changedValues).length === 0) {
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSaved(false);
            const result = await settingsApi.updateCategory(
                category,
                changedValues,
            );
            setRecord(result);
            setValues(result.values);
            setSaved(true);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setSaving(false);
        }
    };

    const uploadLogo = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            setError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
            if (logoInputRef.current) {
                logoInputRef.current.value = "";
            }
            return;
        }

        if (file.size > MAX_LOGO_SIZE_BYTES) {
            setError("The logo image must be 10 MB or smaller.");
            if (logoInputRef.current) {
                logoInputRef.current.value = "";
            }
            return;
        }

        try {
            setUploadingLogo(true);
            setError(null);
            setSaved(false);
            const result = await settingsApi.uploadLogo(file);
            setRecord(result);
            setValues(result.values);
            setSaved(true);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) {
                logoInputRef.current.value = "";
            }
        }
    };

    const uploadFavicon = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            setError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
            if (faviconInputRef.current) {
                faviconInputRef.current.value = "";
            }
            return;
        }

        if (file.size > MAX_LOGO_SIZE_BYTES) {
            setError("The favicon image must be 10 MB or smaller.");
            if (faviconInputRef.current) {
                faviconInputRef.current.value = "";
            }
            return;
        }

        try {
            setUploadingFavicon(true);
            setError(null);
            setSaved(false);
            const result = await settingsApi.uploadFavicon(file);
            setRecord(result);
            setValues(result.values);
            setSaved(true);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setUploadingFavicon(false);
            if (faviconInputRef.current) {
                faviconInputRef.current.value = "";
            }
        }
    };

    if (!config) {
        return (
            <main className="p-6 lg:p-10">
                <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                    This settings category is not supported by the backend.
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-10">
            <div className="mx-auto max-w-4xl space-y-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Settings2 size={16} />
                            Admin settings
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {config.label} settings
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            {config.description}
                        </p>
                    </div>
                    <Button
                        onClick={() => void saveSettings()}
                        loading={saving}
                        disabled={
                            loading ||
                            !settingsLoaded ||
                            Object.keys(changedValues).length === 0
                        }
                    >
                        <Save size={16} />
                        Save changes
                    </Button>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                        <AlertCircle className="mt-0.5 shrink-0" size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {saved && (
                    <div
                        role="status"
                        className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                    >
                        <CheckCircle2 size={18} />
                        Settings saved successfully.
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{config.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="py-6 text-sm text-muted-foreground">
                                Loading settings...
                            </p>
                        ) : !settingsLoaded ? (
                            <p className="py-6 text-sm text-muted-foreground">
                                Settings could not be loaded. Resolve the error above and reload the page.
                            </p>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2">
                                {config.fields.map((field) => {
                                    const value = values[field.key];
                                    const id = `setting-${field.key}`;

                                    return (
                                        <div
                                            key={field.key}
                                            className={
                                                field.type === "boolean"
                                                    ? "flex items-start gap-3 rounded-lg border border-border p-4"
                                                    : "space-y-2"
                                            }
                                        >
                                            {field.type === "boolean" ? (
                                                <>
                                                    <input
                                                        id={id}
                                                        type="checkbox"
                                                        className="mt-1 h-4 w-4 accent-primary"
                                                        checked={value === true}
                                                        onChange={(event) =>
                                                            updateField(
                                                                field.key,
                                                                event.target.checked,
                                                            )
                                                        }
                                                    />
                                                    <div>
                                                        <Label htmlFor={id}>
                                                            {field.label}
                                                        </Label>
                                                        {field.description && (
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {field.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Label htmlFor={id}>
                                                        {field.label}
                                                    </Label>
                                                    {field.type === "choice" ? (
                                                        <Select
                                                            id={id}
                                                            value={displayValue(value)}
                                                            onChange={(event) =>
                                                                updateField(
                                                                    field.key,
                                                                    event.target.value,
                                                                )
                                                            }
                                                        >
                                                            {field.choices?.map((choice) => (
                                                                <option
                                                                    key={choice.value}
                                                                    value={choice.value}
                                                                >
                                                                    {choice.label}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            id={id}
                                                            type={field.type === "number" ? "number" : field.type}
                                                            value={displayValue(value)}
                                                            min={field.min}
                                                            max={field.max}
                                                            step={field.type === "number" ? "any" : undefined}
                                                            onChange={(event) => {
                                                                const nextValue =
                                                                    field.type === "number" &&
                                                                    event.target.value !== ""
                                                                        ? Number(event.target.value)
                                                                        : event.target.value;
                                                                updateField(field.key, nextValue);
                                                            }}
                                                        />
                                                    )}
                                                    {field.description && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {field.description}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
                {category === "general" && settingsLoaded && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform logo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <div className="flex h-24 w-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted p-3">
                                    {typeof record.values.logoUrl === "string" &&
                                    record.values.logoUrl ? (
                                        <Image
                                            src={record.values.logoUrl}
                                            alt="Current platform logo"
                                            width={400}
                                            height={200}
                                            unoptimized
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            No logo uploaded
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="platform-logo">
                                            Upload a logo
                                        </Label>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            PNG, JPEG, WebP, GIF or AVIF, up to 10 MB. Uploading replaces the current logo and updates its URL automatically.
                                        </p>
                                    </div>
                                    <input
                                        ref={logoInputRef}
                                        id="platform-logo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                        disabled={uploadingLogo}
                                        onChange={(event) =>
                                            void uploadLogo(event.target.files?.[0])
                                        }
                                        className="block w-full max-w-sm text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-primary-foreground hover:file:opacity-90 disabled:opacity-50"
                                    />
                                    {uploadingLogo && (
                                        <p className="text-sm text-muted-foreground">
                                            Uploading logo...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {category === "general" && settingsLoaded && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Website favicon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted p-3">
                                    {typeof record.values.faviconUrl === "string" &&
                                    record.values.faviconUrl ? (
                                        <Image
                                            src={record.values.faviconUrl}
                                            alt="Current website favicon"
                                            width={64}
                                            height={64}
                                            unoptimized
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-center text-xs text-muted-foreground">
                                            No favicon
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="website-favicon">
                                            Upload browser tab icon
                                        </Label>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            This icon appears in the browser tab and bookmarks. PNG, JPEG, WebP, GIF or AVIF, up to 10 MB.
                                        </p>
                                    </div>
                                    <input
                                        ref={faviconInputRef}
                                        id="website-favicon"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                        disabled={uploadingFavicon}
                                        onChange={(event) =>
                                            void uploadFavicon(
                                                event.target.files?.[0],
                                            )
                                        }
                                        className="block w-full max-w-sm text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-primary-foreground hover:file:opacity-90 disabled:opacity-50"
                                    />
                                    {uploadingFavicon && (
                                        <p className="text-sm text-muted-foreground">
                                            Uploading favicon...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {record?.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(record.updatedAt).toLocaleString()}
                    </p>
                )}
            </div>
        </main>
    );
}
