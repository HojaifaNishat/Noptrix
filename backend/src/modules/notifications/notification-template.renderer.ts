/*
|--------------------------------------------------------------------------
| Notification Template Renderer
|--------------------------------------------------------------------------
|
| Renders {{variable}} placeholders from notification templates.
|
| Supported:
|   {{name}}
|   {{vacancyTitle}}
|   {{status}}
|
| Unknown variables are intentionally preserved.
| This prevents silent data loss when an administrator creates
| a template containing a variable that the event did not provide.
|
|--------------------------------------------------------------------------
*/

export interface NotificationTemplateVariables {
    readonly [key: string]: unknown;
}


/*
|--------------------------------------------------------------------------
| Variable Extraction
|--------------------------------------------------------------------------
*/

export const extractTemplateVariables = (
    text: string,
): string[] => {
    if (!text) {
        return [];
    }

    const variables = new Set<string>();

    const pattern =
        /{{\s*([a-zA-Z0-9._-]+)\s*}}/g;

    let match: RegExpExecArray | null;

    while (
        (match = pattern.exec(text)) !== null
    ) {
        variables.add(
            match[1].trim(),
        );
    }

    return [...variables];
};


/*
|--------------------------------------------------------------------------
| Value Normalization
|--------------------------------------------------------------------------
*/

const stringifyTemplateValue = (
    value: unknown,
): string => {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    if (
        value instanceof Date
    ) {
        return value.toISOString();
    }

    if (
        typeof value === "string"
    ) {
        return value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint"
    ) {
        return String(value);
    }

    if (
        Array.isArray(value)
    ) {
        return value
            .map((item) =>
                stringifyTemplateValue(item),
            )
            .join(", ");
    }

    try {
        return JSON.stringify(value);
    } catch {
        return "";
    }
};


/*
|--------------------------------------------------------------------------
| Template Rendering
|--------------------------------------------------------------------------
*/

export const renderNotificationTemplate = (
    template: string,
    variables: NotificationTemplateVariables,
): string => {
    if (!template) {
        return "";
    }

    return template.replace(
        /{{\s*([a-zA-Z0-9._-]+)\s*}}/g,
        (
            _match: string,
            variableName: string,
        ) => {
            const key = variableName.trim();

            const resolvedKey =
                Object.prototype.hasOwnProperty.call(variables, key)
                    ? key
                    : Object.keys(variables).find(
                          (candidate) =>
                              candidate.toLowerCase() === key.toLowerCase(),
                      );

            if (resolvedKey === undefined) {
                return `{{${variableName}}}`;
            }

            return stringifyTemplateValue(variables[resolvedKey]);
        },
    );
};


/*
|--------------------------------------------------------------------------
| Template Validation
|--------------------------------------------------------------------------
*/

export interface TemplateValidationResult {
    readonly valid: boolean;
    readonly missingVariables: string[];
    readonly unusedVariables: string[];
}


/*
|--------------------------------------------------------------------------
| Validate Template Variables
|--------------------------------------------------------------------------
*/

export const validateNotificationTemplateVariables = (
    template: string,
    declaredVariables: readonly string[],
): TemplateValidationResult => {
    const usedVariables =
        extractTemplateVariables(
            template,
        );

    const declaredByNormalizedName = new Map(
        declaredVariables
            .map((variable) => variable.trim())
            .filter(Boolean)
            .map((variable) => [
                variable.toLowerCase(),
                variable,
            ]),
    );

    const usedNormalizedNames = new Set(
        usedVariables.map((variable) =>
            variable.toLowerCase(),
        ),
    );

    const missingVariables =
        usedVariables.filter(
            (variable) =>
                !declaredByNormalizedName.has(
                    variable.toLowerCase(),
                ),
        );

    const unusedVariables =
        [...declaredByNormalizedName.entries()]
            .filter(
                ([normalizedName]) =>
                    !usedNormalizedNames.has(normalizedName),
            )
            .map(([, originalName]) => originalName);

    return {
        valid:
            missingVariables.length === 0,

        missingVariables,

        unusedVariables,
    };
};


/*
|--------------------------------------------------------------------------
| Render Notification Content
|--------------------------------------------------------------------------
*/

export interface RenderedNotificationContent {
    readonly title: string;
    readonly message: string;
}


export const renderNotificationContent = (
    titleTemplate: string,
    bodyTemplate: string,
    variables: NotificationTemplateVariables,
): RenderedNotificationContent => {
    return {
        title:
            renderNotificationTemplate(
                titleTemplate,
                variables,
            ),

        message:
            renderNotificationTemplate(
                bodyTemplate,
                variables,
            ),
    };
};
