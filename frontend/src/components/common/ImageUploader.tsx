"use client";

import {
    ChangeEvent,
    DragEvent,
    useEffect,
    useRef,
    useState,
} from "react";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface ImageUploaderProps {
    readonly value?: File | null;
    readonly previewUrl?: string | null;
    readonly onChange: (
        file: File | null,
    ) => void;
    readonly onRemove?: () => void;
    readonly accept?: string;
    readonly maxSizeMB?: number;
    readonly disabled?: boolean;
    readonly label?: string;
    readonly description?: string;
}


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_ACCEPT =
    "image/jpeg,image/png,image/webp,image/gif,image/avif";

const DEFAULT_MAX_SIZE_MB = 10;


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function ImageUploader({
    value,
    previewUrl,
    onChange,
    onRemove,
    accept = DEFAULT_ACCEPT,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    disabled = false,
    label = "Image",
    description,
}: ImageUploaderProps) {
    const inputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const [
        internalPreview,
        setInternalPreview,
    ] = useState<string | null>(
        previewUrl ?? null,
    );

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );


    /*
    |--------------------------------------------------------------------------
    | Preview lifecycle
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (previewUrl) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInternalPreview(
                previewUrl,
            );
        }
    }, [previewUrl]);


    useEffect(() => {
        if (!value) {
            return;
        }

        const objectUrl =
            URL.createObjectURL(value);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInternalPreview(
            objectUrl,
        );

        return () => {
            URL.revokeObjectURL(
                objectUrl,
            );
        };
    }, [value]);


    /*
    |--------------------------------------------------------------------------
    | File validation
    |--------------------------------------------------------------------------
    */

    const validateFile =
        (
            file: File,
        ): boolean => {
            setError(null);

            const maxBytes =
                maxSizeMB *
                1024 *
                1024;

            if (
                file.size >
                maxBytes
            ) {
                setError(
                    `Image must be ${maxSizeMB} MB or smaller.`,
                );

                return false;
            }

            if (
                !file.type.startsWith(
                    "image/",
                )
            ) {
                setError(
                    "Please select a valid image file.",
                );

                return false;
            }

            return true;
        };


    /*
    |--------------------------------------------------------------------------
    | Select file
    |--------------------------------------------------------------------------
    */

    const handleFile =
        (
            file: File | null,
        ) => {
            if (!file) {
                return;
            }

            if (
                !validateFile(
                    file,
                )
            ) {
                return;
            }

            onChange(file);
        };


    /*
    |--------------------------------------------------------------------------
    | Input change
    |--------------------------------------------------------------------------
    */

    const handleInputChange =
        (
            event: ChangeEvent<HTMLInputElement>,
        ) => {
            const file =
                event.target.files?.[0] ??
                null;

            handleFile(file);
        };


    /*
    |--------------------------------------------------------------------------
    | Drag events
    |--------------------------------------------------------------------------
    */

    const handleDragOver =
        (
            event: DragEvent<HTMLDivElement>,
        ) => {
            event.preventDefault();
        };


    const handleDrop =
        (
            event: DragEvent<HTMLDivElement>,
        ) => {
            event.preventDefault();

            if (disabled) {
                return;
            }

            const file =
                event.dataTransfer.files?.[0] ??
                null;

            handleFile(file);
        };


    /*
    |--------------------------------------------------------------------------
    | Remove
    |--------------------------------------------------------------------------
    */

    const handleRemove =
        () => {
            setError(null);
            setInternalPreview(null);

            if (
                inputRef.current
            ) {
                inputRef.current.value =
                    "";
            }

            onChange(null);

            onRemove?.();
        };


    /*
    |--------------------------------------------------------------------------
    | Open picker
    |--------------------------------------------------------------------------
    */

    const openPicker =
        () => {
            if (disabled) {
                return;
            }

            inputRef.current?.click();
        };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>

                {description && (
                    <p className="mt-1 text-xs text-gray-500">
                        {description}
                    </p>
                )}
            </div>


            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={
                    handleInputChange
                }
                disabled={disabled}
                className="hidden"
            />


            <div
                onDragOver={
                    handleDragOver
                }
                onDrop={
                    handleDrop
                }
                className={[
                    "rounded-xl border-2 border-dashed p-5 transition",
                    disabled
                        ? "cursor-not-allowed bg-gray-50 opacity-60"
                        : "border-gray-300 bg-gray-50 hover:border-gray-500 hover:bg-white",
                ].join(" ")}
            >
                {internalPreview ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <img
                                src={
                                    internalPreview
                                }
                                alt="Image preview"
                                className="h-40 w-40 object-cover"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={
                                    openPicker
                                }
                                disabled={
                                    disabled
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Replace Image
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleRemove
                                }
                                disabled={
                                    disabled
                                }
                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Remove Image
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={
                            openPicker
                        }
                        disabled={
                            disabled
                        }
                        className="flex min-h-40 w-full flex-col items-center justify-center rounded-lg px-4 text-center disabled:cursor-not-allowed"
                    >
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xl">
                            ↑
                        </div>

                        <p className="text-sm font-semibold text-gray-800">
                            Click to upload
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            or drag and drop an image here
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                            JPEG, PNG, WebP, GIF or AVIF
                            {" • "}
                            Max {maxSizeMB} MB
                        </p>
                    </button>
                )}
            </div>


            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
