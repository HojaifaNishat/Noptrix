import js from "@eslint/js";
import tseslint from "typescript-eslint";

const nodeGlobals = {
    process: "readonly",
    Buffer: "readonly",
    console: "readonly",
    __dirname: "readonly",
    __filename: "readonly",
    require: "readonly",
    module: "readonly",
    exports: "readonly",
    global: "readonly",
    setTimeout: "readonly",
    clearTimeout: "readonly",
    setInterval: "readonly",
    clearInterval: "readonly",
    queueMicrotask: "readonly",
    structuredClone: "readonly",
    fetch: "readonly",
    URL: "readonly",
    URLSearchParams: "readonly",
    AbortController: "readonly",
    TextEncoder: "readonly",
    TextDecoder: "readonly",
};

export default tseslint.config(
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "coverage/**",
        ],
    },
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        ...js.configs.recommended,
        languageOptions: {
            ...js.configs.recommended.languageOptions,
            globals: nodeGlobals,
        },
    },
    {
        files: ["**/*.ts"],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        languageOptions: {
            globals: nodeGlobals,
        },
        rules: {
            "no-undef": "off",

            // Express Request type augmentation uses declaration namespaces.
            "@typescript-eslint/no-namespace": [
                "error",
                { "allowDeclarations": true },
            ],

            // Used intentionally for input sanitization and control-character checks.
            "no-control-regex": "off",
        },
    },
);
