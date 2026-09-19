import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
    timingSafeEqual,
} from "node:crypto";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ALGORITHM = "aes-256-gcm" as const;

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const HASH_ALGORITHM = "sha256" as const;

const ENCRYPTED_VALUE_VERSION = "v1";

const SEPARATOR = ".";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface EncryptedValue {
    readonly version: typeof ENCRYPTED_VALUE_VERSION;
    readonly iv: string;
    readonly authTag: string;
    readonly ciphertext: string;
}

export interface EncryptionOptions {
    readonly key: Buffer;
}

/*
|--------------------------------------------------------------------------
| Key Validation
|--------------------------------------------------------------------------
*/

const validateEncryptionKey = (
    key: Buffer
): void => {
    if (!Buffer.isBuffer(key)) {
        throw new TypeError(
            "Encryption key must be a Buffer."
        );
    }

    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `Encryption key must be exactly ${KEY_LENGTH} bytes.`
        );
    }
};

/*
|--------------------------------------------------------------------------
| Random Key Generation
|--------------------------------------------------------------------------
*/

export const generateEncryptionKey =
    (): Buffer => {
        return randomBytes(KEY_LENGTH);
    };

/*
|--------------------------------------------------------------------------
| Hashing
|--------------------------------------------------------------------------
*/

export const sha256 = (
    value: string | Buffer
): string => {
    return createHash(HASH_ALGORITHM)
        .update(value)
        .digest("hex");
};

export const sha256Base64 = (
    value: string | Buffer
): string => {
    return createHash(HASH_ALGORITHM)
        .update(value)
        .digest("base64");
};

/*
|--------------------------------------------------------------------------
| HMAC-style Safe Comparison
|--------------------------------------------------------------------------
*/

export const safeCompare = (
    first: string,
    second: string
): boolean => {
    const firstBuffer =
        Buffer.from(first);

    const secondBuffer =
        Buffer.from(second);

    if (
        firstBuffer.length !==
        secondBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        firstBuffer,
        secondBuffer
    );
};

/*
|--------------------------------------------------------------------------
| AES-256-GCM Encryption
|--------------------------------------------------------------------------
*/

export const encrypt = (
    plaintext: string,
    options: EncryptionOptions
): string => {
    validateEncryptionKey(options.key);

    if (
        typeof plaintext !== "string"
    ) {
        throw new TypeError(
            "Plaintext must be a string."
        );
    }

    const iv = randomBytes(
        IV_LENGTH
    );

    const cipher = createCipheriv(
        ALGORITHM,
        options.key,
        iv,
        {
            authTagLength:
                AUTH_TAG_LENGTH,
        }
    );

    const ciphertext = Buffer.concat([
        cipher.update(
            plaintext,
            "utf8"
        ),
        cipher.final(),
    ]);

    const authTag =
        cipher.getAuthTag();

    const encryptedValue: EncryptedValue =
        {
            version:
                ENCRYPTED_VALUE_VERSION,
            iv: iv.toString("base64url"),
            authTag:
                authTag.toString(
                    "base64url"
                ),
            ciphertext:
                ciphertext.toString(
                    "base64url"
                ),
        };

    return [
        encryptedValue.version,
        encryptedValue.iv,
        encryptedValue.authTag,
        encryptedValue.ciphertext,
    ].join(SEPARATOR);
};

/*
|--------------------------------------------------------------------------
| AES-256-GCM Decryption
|--------------------------------------------------------------------------
*/

export const decrypt = (
    encryptedValue: string,
    options: EncryptionOptions
): string => {
    validateEncryptionKey(options.key);

    if (
        typeof encryptedValue !==
            "string" ||
        encryptedValue.trim()
            .length === 0
    ) {
        throw new TypeError(
            "Encrypted value must be a non-empty string."
        );
    }

    const parts =
        encryptedValue.split(
            SEPARATOR
        );

    if (parts.length !== 4) {
        throw new Error(
            "Invalid encrypted value format."
        );
    }

    const [
        version,
        ivEncoded,
        authTagEncoded,
        ciphertextEncoded,
    ] = parts;

    if (
        version !==
        ENCRYPTED_VALUE_VERSION
    ) {
        throw new Error(
            `Unsupported encrypted value version: ${version}`
        );
    }

    try {
        const iv = Buffer.from(
            ivEncoded,
            "base64url"
        );

        const authTag = Buffer.from(
            authTagEncoded,
            "base64url"
        );

        const ciphertext =
            Buffer.from(
                ciphertextEncoded,
                "base64url"
            );

        if (
            iv.length !== IV_LENGTH
        ) {
            throw new Error(
                "Invalid encryption IV."
            );
        }

        if (
            authTag.length !==
            AUTH_TAG_LENGTH
        ) {
            throw new Error(
                "Invalid encryption authentication tag."
            );
        }

        const decipher =
            createDecipheriv(
                ALGORITHM,
                options.key,
                iv,
                {
                    authTagLength:
                        AUTH_TAG_LENGTH,
                }
            );

        decipher.setAuthTag(
            authTag
        );

        const plaintext =
            Buffer.concat([
                decipher.update(
                    ciphertext
                ),
                decipher.final(),
            ]);

        return plaintext.toString(
            "utf8"
        );
    } catch {
        throw new Error(
            "Unable to decrypt value. The data may be corrupted or the encryption key may be incorrect."
        );
    }
};

/*
|--------------------------------------------------------------------------
| Structured Encryption Helpers
|--------------------------------------------------------------------------
*/

export const encryptJson = <T>(
    value: T,
    options: EncryptionOptions
): string => {
    const serialized =
        JSON.stringify(value);

    if (
        serialized === undefined
    ) {
        throw new TypeError(
            "Value cannot be serialized to JSON."
        );
    }

    return encrypt(
        serialized,
        options
    );
};

export const decryptJson = <T>(
    encryptedValue: string,
    options: EncryptionOptions
): T => {
    const decrypted = decrypt(
        encryptedValue,
        options
    );

    try {
        return JSON.parse(
            decrypted
        ) as T;
    } catch {
        throw new Error(
            "Decrypted value is not valid JSON."
        );
    }
};

/*
|--------------------------------------------------------------------------
| Key Encoding Helpers
|--------------------------------------------------------------------------
*/

export const encryptionKeyToBase64 =
    (key: Buffer): string => {
        validateEncryptionKey(key);

        return key.toString(
            "base64"
        );
    };

export const encryptionKeyFromBase64 =
    (encodedKey: string): Buffer => {
        if (
            typeof encodedKey !==
                "string" ||
            encodedKey.trim()
                .length === 0
        ) {
            throw new TypeError(
                "Encoded encryption key must be a non-empty string."
            );
        }

        const key = Buffer.from(
            encodedKey,
            "base64"
        );

        validateEncryptionKey(key);

        return key;
    };