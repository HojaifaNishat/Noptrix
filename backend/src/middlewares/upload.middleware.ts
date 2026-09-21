import {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

import multer, {
    FileFilterCallback,
    Multer,
} from "multer";

/*
|--------------------------------------------------------------------------
| Upload Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_MAX_FILE_SIZE =
    10 * 1024 * 1024; // 10 MB

const DEFAULT_MAX_FILES = 10;

const DEFAULT_MAX_FIELD_SIZE =
    1024 * 1024; // 1 MB

/*
|--------------------------------------------------------------------------
| Allowed MIME Types
|--------------------------------------------------------------------------
*/

export const IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
] as const;

export const DOCUMENT_MIME_TYPES = [
    "application/pdf",
] as const;

export const VIDEO_MIME_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
] as const;

/*
|--------------------------------------------------------------------------
| Combined MIME Types
|--------------------------------------------------------------------------
*/

export const COMMON_UPLOAD_MIME_TYPES = [
    ...IMAGE_MIME_TYPES,
    ...DOCUMENT_MIME_TYPES,
] as const;

/*
|--------------------------------------------------------------------------
| Upload Options
|--------------------------------------------------------------------------
*/

export interface UploadOptions {
    maxFileSize?: number;
    maxFiles?: number;
    maxFieldSize?: number;
    allowedMimeTypes?: readonly string[];
    preservePath?: boolean;
}

/*
|--------------------------------------------------------------------------
| Upload Error
|--------------------------------------------------------------------------
*/

export class UploadError extends Error {
    public readonly code: string;

    public readonly statusCode: number;

    constructor(
        message: string,
        code = "UPLOAD_ERROR",
        statusCode = 400
    ) {
        super(message);

        this.name = "UploadError";
        this.code = code;
        this.statusCode =
            statusCode;

        Object.setPrototypeOf(
            this,
            UploadError.prototype
        );
    }
}

/*
|--------------------------------------------------------------------------
| MIME Type Validation
|--------------------------------------------------------------------------
*/

const isAllowedMimeType = (
    mimeType: string,
    allowedMimeTypes: readonly string[]
): boolean => {
    return allowedMimeTypes.includes(
        mimeType
    );
};

/*
|--------------------------------------------------------------------------
| Safe File Name
|--------------------------------------------------------------------------
|
| Multer memory storage does not write
| files to disk, but we still sanitize
| original names before passing metadata
| downstream.
|
|--------------------------------------------------------------------------
*/

const sanitizeOriginalName = (
    originalName: string
): string => {
    return originalName
        .replace(
            /[/\\]/g,
            "_"
        )
        .replace(
            /[\0-\x1F\x7F]/g,
            ""
        )
        .trim()
        .slice(0, 255);
};

/*
|--------------------------------------------------------------------------
| File Filter Factory
|--------------------------------------------------------------------------
*/

const createFileFilter = (
    allowedMimeTypes: readonly string[]
) => {
    return (
        _req: Request,
        file: Express.Multer.File,
        callback: FileFilterCallback
    ) => {
        const mimeType =
            file.mimetype
                .trim()
                .toLowerCase();

        if (
            !isAllowedMimeType(
                mimeType,
                allowedMimeTypes
            )
        ) {
            callback(
                new UploadError(
                    `File type "${file.mimetype}" is not allowed.`,
                    "INVALID_FILE_TYPE",
                    400
                )
            );

            return;
        }

        /*
         * Sanitize filename metadata.
         */
        file.originalname =
            sanitizeOriginalName(
                file.originalname
            );

        callback(
            null,
            true
        );
    };
};

/*
|--------------------------------------------------------------------------
| Multer Factory
|--------------------------------------------------------------------------
*/

export const createUploadMiddleware = (
    options: UploadOptions = {}
): Multer => {
    const {
        maxFileSize =
            DEFAULT_MAX_FILE_SIZE,

        maxFiles =
            DEFAULT_MAX_FILES,

        maxFieldSize =
            DEFAULT_MAX_FIELD_SIZE,

        allowedMimeTypes =
            COMMON_UPLOAD_MIME_TYPES,

        preservePath = false,
    } = options;

    /*
     * Validate configuration early.
     */
    if (
        !Number.isFinite(
            maxFileSize
        ) ||
        maxFileSize <= 0
    ) {
        throw new Error(
            "Upload maxFileSize must be greater than zero."
        );
    }

    if (
        !Number.isInteger(
            maxFiles
        ) ||
        maxFiles <= 0
    ) {
        throw new Error(
            "Upload maxFiles must be a positive integer."
        );
    }

    if (
        !Number.isFinite(
            maxFieldSize
        ) ||
        maxFieldSize <= 0
    ) {
        throw new Error(
            "Upload maxFieldSize must be greater than zero."
        );
    }

    if (
        allowedMimeTypes.length ===
        0
    ) {
        throw new Error(
            "At least one allowed MIME type is required."
        );
    }

    /*
     * Memory storage is intentional.
     *
     * Cloudinary can receive the file buffer
     * directly without writing to disk.
     */
    const storage =
        multer.memoryStorage();

    return multer({
        storage,

        limits: {
            fileSize:
                maxFileSize,

            files:
                maxFiles,

            fieldSize:
                maxFieldSize,

            fields: 50,

            parts:
                maxFiles + 50,
        },

        fileFilter:
            createFileFilter(
                allowedMimeTypes
            ),

        preservePath,
    });
};

/*
|--------------------------------------------------------------------------
| Default Upload Instance
|--------------------------------------------------------------------------
*/

export const upload =
    createUploadMiddleware();

/*
|--------------------------------------------------------------------------
| Image Upload
|--------------------------------------------------------------------------
*/

export const uploadImage =
    createUploadMiddleware({
        maxFileSize:
            DEFAULT_MAX_FILE_SIZE,

        maxFiles:
            DEFAULT_MAX_FILES,

        allowedMimeTypes:
            IMAGE_MIME_TYPES,
    });

/*
|--------------------------------------------------------------------------
| Single Image Upload
|--------------------------------------------------------------------------
*/

export const uploadSingleImage =
    uploadImage.single(
        "image"
    );

/*
|--------------------------------------------------------------------------
| Multiple Image Upload
|--------------------------------------------------------------------------
*/

export const uploadMultipleImages =
    uploadImage.array(
        "images",
        DEFAULT_MAX_FILES
    );

/*
|--------------------------------------------------------------------------
| Product Image Upload
|--------------------------------------------------------------------------
|
| Product images usually need multiple files.
|
|--------------------------------------------------------------------------
*/

export const productImageUpload =
    createUploadMiddleware({
        maxFileSize:
            DEFAULT_MAX_FILE_SIZE,

        maxFiles:
            20,

        allowedMimeTypes:
            IMAGE_MIME_TYPES,
    });

export const uploadProductImages =
    productImageUpload.array(
        "images",
        20
    );

/*
|--------------------------------------------------------------------------
| Document Upload
|--------------------------------------------------------------------------
*/

export const uploadDocument =
    createUploadMiddleware({
        maxFileSize:
            DEFAULT_MAX_FILE_SIZE,

        maxFiles:
            DEFAULT_MAX_FILES,

        allowedMimeTypes:
            DOCUMENT_MIME_TYPES,
    });

/*
|--------------------------------------------------------------------------
| Single Document Upload
|--------------------------------------------------------------------------
*/

export const uploadSingleDocument =
    uploadDocument.single(
        "document"
    );

/*
|--------------------------------------------------------------------------
| Mixed Common Upload
|--------------------------------------------------------------------------
*/

export const uploadCommon =
    createUploadMiddleware({
        maxFileSize:
            DEFAULT_MAX_FILE_SIZE,

        maxFiles:
            DEFAULT_MAX_FILES,

        allowedMimeTypes:
            COMMON_UPLOAD_MIME_TYPES,
    });

/*
|--------------------------------------------------------------------------
| Validate Uploaded File
|--------------------------------------------------------------------------
*/

export const requireUploadedFile =
    (
        fieldName = "file"
    ): RequestHandler => {
        return (
            req: Request,
            res: Response,
            next: NextFunction
        ) => {
            const file =
                req.file;

            if (!file) {
                res.status(400).json({
                    success: false,
                    message:
                        `No file was uploaded in "${fieldName}".`,
                });

                return;
            }

            next();
        };
    };

/*
|--------------------------------------------------------------------------
| Validate Uploaded Files
|--------------------------------------------------------------------------
*/
export const uploadErrorHandler =
    (
        error: unknown,
        _req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        /*
        |--------------------------------------------------------------------------
        | Custom Upload Error
        |--------------------------------------------------------------------------
        */

        if (
            error instanceof UploadError
        ) {
            res.status(
                error.statusCode
            ).json({
                success: false,
                message:
                    error.message,
                code:
                    error.code,
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Multer Error
        |--------------------------------------------------------------------------
        */

        if (
            error instanceof
            multer.MulterError
        ) {
            const errorCode =
                String(
                    error.code
                );

            let message =
                "File upload failed.";

            switch (
                errorCode
            ) {
                case "LIMIT_FILE_SIZE":
                    message =
                        "Uploaded file is too large.";
                    break;

                case "LIMIT_FILE_COUNT":
                    message =
                        "Too many files were uploaded.";
                    break;

                case "LIMIT_UNEXPECTED_FILE":
                    message =
                        "Unexpected file field.";
                    break;

                case "LIMIT_PART_COUNT":
                    message =
                        "Too many multipart form parts.";
                    break;

                case "LIMIT_FIELD_COUNT":
                    message =
                        "Too many form fields.";
                    break;

                case "LIMIT_FIELD_KEY":
                    message =
                        "Uploaded field name is too long.";
                    break;

                case "LIMIT_FIELD_VALUE":
                    message =
                        "Uploaded field value is too large.";
                    break;

                default:
                    message =
                        error.message ||
                        message;
                    break;
            }

            res.status(400).json({
                success: false,
                message,
                code:
                    errorCode,
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Unknown Error
        |--------------------------------------------------------------------------
        |
        | Forward unknown errors to the global error middleware.
        |
        */

        next(error);
    };