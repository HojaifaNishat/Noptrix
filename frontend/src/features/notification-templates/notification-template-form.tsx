"use client";

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    Check,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

import {
    Button,
} from "@/components/ui/Button";

import {
    Card,
} from "@/components/ui/Card";

import {
    Input,
} from "@/components/ui/Input";

import {
    Label,
} from "@/components/ui/Label";

import {
    Select,
} from "@/components/ui/Select";

import {
    Textarea,
} from "@/components/ui/Textarea";

import {
    NotificationTemplatePreview,
} from "./notification-template-preview";

import {
    NOTIFICATION_TEMPLATE_CHANNELS,
    NOTIFICATION_TEMPLATE_STATUSES,
    type NotificationTemplate,
    type NotificationTemplateChannel,
    type NotificationTemplateFormValues,
} from "./notification-template.types";

interface NotificationTemplateFormProps {
    mode: "create" | "edit";
    initialData?: NotificationTemplate | null;
    submitting?: boolean;
    onSubmit: (
        values: NotificationTemplateFormValues,
    ) => Promise<void> | void;
    onCancel: () => void;
}

const extractVariables = (
    value: string,
): string[] => {
    const found = new Set<string>();

    const regex =
        /{{\s*([a-zA-Z0-9._-]+)\s*}}/g;

    let match: RegExpExecArray | null;

    while (
        (match = regex.exec(value)) !== null
    ) {
        found.add(
            match[1]
                .trim()
                .toLowerCase(),
        );
    }

    return Array.from(found);
};

const normalizeEvent = (
    value: string,
): string =>
    value
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

const normalizeKey = (
    value: string,
): string =>
    value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

const getInitialValues = (
    data?: NotificationTemplate | null,
): NotificationTemplateFormValues => ({
    key: data?.key ?? "",
    name: data?.name ?? "",
    description: data?.description ?? "",
    event: data?.event ?? "",
    channel: data?.channel ?? "email",
    locale: data?.locale ?? "en",
    title: data?.title ?? "",
    body: data?.body ?? "",
    status: data?.status ?? "ACTIVE",
    variables: data?.variables ?? [],
});

export function NotificationTemplateForm({
    mode,
    initialData,
    submitting = false,
    onSubmit,
    onCancel,
}: NotificationTemplateFormProps) {
    const [values, setValues] =
        useState<NotificationTemplateFormValues>(
            getInitialValues(initialData),
        );

    const [newVariable, setNewVariable] =
        useState("");

    const [error, setError] =
        useState("");

    useEffect(() => {
        setValues(
            getInitialValues(initialData),
        );
    }, [initialData]);

    const detectedVariables = useMemo(
        () =>
            Array.from(
                new Set([
                    ...extractVariables(
                        values.title,
                    ),
                    ...extractVariables(
                        values.body,
                    ),
                ]),
            ),
        [values.title, values.body],
    );

    const allVariables = useMemo(
        () =>
            Array.from(
                new Set([
                    ...values.variables.map(
                        (item) =>
                            item
                                .trim()
                                .toLowerCase(),
                    ),
                    ...detectedVariables,
                ]),
            ),
        [
            values.variables,
            detectedVariables,
        ],
    );

    const setField = <
        K extends keyof NotificationTemplateFormValues,
    >(
        field: K,
        value: NotificationTemplateFormValues[K],
    ) => {
        setValues(
            (current) => ({
                ...current,
                [field]: value,
            }),
        );
    };

    const addVariable = () => {
        const variable = newVariable
            .trim()
            .toLowerCase();

        if (!variable) {
            return;
        }

        if (
            !/^[a-zA-Z0-9_.-]+$/.test(
                variable,
            )
        ) {
            setError(
                "Variable may contain only letters, numbers, dots, underscores, and hyphens.",
            );
            return;
        }

        if (
            !values.variables.includes(
                variable,
            )
        ) {
            setValues(
                (current) => ({
                    ...current,
                    variables: [
                        ...current.variables,
                        variable,
                    ],
                }),
            );
        }

        setNewVariable("");
        setError("");
    };

    const removeVariable = (
        variable: string,
    ) => {
        setValues(
            (current) => ({
                ...current,
                variables:
                    current.variables.filter(
                        (item) =>
                            item !== variable,
                    ),
            }),
        );
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError("");

        const key = normalizeKey(
            values.key,
        );

        const eventName =
            normalizeEvent(
                values.event,
            );

        if (!key) {
            setError(
                "Template key is required.",
            );
            return;
        }

        if (!values.name.trim()) {
            setError(
                "Template name is required.",
            );
            return;
        }

        if (!eventName) {
            setError(
                "Event is required.",
            );
            return;
        }

        if (!values.locale.trim()) {
            setError(
                "Locale is required.",
            );
            return;
        }

        if (!values.title.trim()) {
            setError(
                "Template title is required.",
            );
            return;
        }

        if (!values.body.trim()) {
            setError(
                "Template body is required.",
            );
            return;
        }

        try {
            await onSubmit({
                ...values,
                key,
                event: eventName,
                locale:
                    values.locale
                        .trim()
                        .toLowerCase(),
                variables: allVariables,
            });
        } catch (submissionError) {
            setError(
                submissionError instanceof Error
                    ? submissionError.message
                    : "Failed to save notification template.",
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            {error ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                    />

                    <p>{error}</p>

                    <button
                        type="button"
                        className="ml-auto"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-6">
                    <Card className="p-5">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-gray-900">
                                Template Identity
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Define how this notification template is identified.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="template-key">
                                    Template Key
                                </Label>

                                <Input
                                    id="template-key"
                                    value={values.key}
                                    onChange={(event) =>
                                        setField(
                                            "key",
                                            event.target.value.toLowerCase(),
                                        )
                                    }
                                    disabled={
                                        mode ===
                                        "edit"
                                    }
                                    placeholder="employee.invitation.created"
                                />

                                <p className="mt-1.5 text-xs text-gray-500">
                                    Lowercase letters, numbers, dots, underscores and hyphens.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="template-name">
                                    Name
                                </Label>

                                <Input
                                    id="template-name"
                                    value={values.name}
                                    onChange={(event) =>
                                        setField(
                                            "name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Employee Invitation"
                                />
                            </div>

                            <div>
                                <Label htmlFor="template-event">
                                    Event
                                </Label>

                                <Input
                                    id="template-event"
                                    value={values.event}
                                    onChange={(event) =>
                                        setField(
                                            "event",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="EMPLOYEE_INVITATION_CREATED"
                                />
                            </div>

                            <div>
                                <Label htmlFor="template-locale">
                                    Locale
                                </Label>

                                <Input
                                    id="template-locale"
                                    value={values.locale}
                                    onChange={(event) =>
                                        setField(
                                            "locale",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="en"
                                />
                            </div>

                            <div>
                                <Label htmlFor="template-channel">
                                    Channel
                                </Label>

                                <Select
                                    id="template-channel"
                                    value={values.channel}
                                    onChange={(event) =>
                                        setField(
                                            "channel",
                                            event.target.value as NotificationTemplateChannel,
                                        )
                                    }
                                >
                                    {NOTIFICATION_TEMPLATE_CHANNELS.map(
                                        (channel) => (
                                            <option
                                                key={channel}
                                                value={channel}
                                            >
                                                {channel}
                                            </option>
                                        ),
                                    )}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="template-status">
                                    Status
                                </Label>

                                <Select
                                    id="template-status"
                                    value={values.status}
                                    onChange={(event) =>
                                        setField(
                                            "status",
                                            event.target.value as NotificationTemplateFormValues["status"],
                                        )
                                    }
                                >
                                    {NOTIFICATION_TEMPLATE_STATUSES.map(
                                        (status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </option>
                                        ),
                                    )}
                                </Select>
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="template-description">
                                    Description
                                </Label>

                                <Textarea
                                    id="template-description"
                                    value={
                                        values.description
                                    }
                                    onChange={(event) =>
                                        setField(
                                            "description",
                                            event.target.value,
                                        )
                                    }
                                    rows={3}
                                    placeholder="Describe when this template is used."
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-gray-900">
                                Content
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Use {"{{variable}}"} placeholders for dynamic content.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <Label htmlFor="template-title">
                                    Title
                                </Label>

                                <Input
                                    id="template-title"
                                    value={values.title}
                                    onChange={(event) =>
                                        setField(
                                            "title",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Your application has been selected"
                                />
                            </div>

                            <div>
                                <Label htmlFor="template-body">
                                    Body
                                </Label>

                                <Textarea
                                    id="template-body"
                                    value={values.body}
                                    onChange={(event) =>
                                        setField(
                                            "body",
                                            event.target.value,
                                        )
                                    }
                                    rows={12}
                                    placeholder="Hello {{name}}, your application for {{vacancyTitle}} has been selected."
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-gray-900">
                                Variables
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Variables used in the title/body are detected automatically.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newVariable}
                                onChange={(event) =>
                                    setNewVariable(
                                        event.target.value,
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        event.preventDefault();
                                        addVariable();
                                    }
                                }}
                                placeholder="employeeName"
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={
                                    addVariable
                                }
                            >
                                <Plus
                                    size={16}
                                />
                                Add
                            </Button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {allVariables.length >
                            0 ? (
                                allVariables.map(
                                    (
                                        variable,
                                    ) => {
                                        const detected =
                                            detectedVariables.includes(
                                                variable,
                                            );

                                        return (
                                            <span
                                                key={
                                                    variable
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-700"
                                            >
                                                {"{{"}
                                                {
                                                    variable
                                                }
                                                {"}}"}

                                                {detected ? (
                                                    <Check
                                                        size={
                                                            13
                                                        }
                                                        className="text-green-600"
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeVariable(
                                                                variable,
                                                            )
                                                        }
                                                        className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
                                                    >
                                                        <X
                                                            size={
                                                                12
                                                            }
                                                        />
                                                    </button>
                                                )}
                                            </span>
                                        );
                                    },
                                )
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No variables detected.
                                </p>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:sticky lg:top-6 lg:self-start">
                    <NotificationTemplatePreview
                        channel={
                            values.channel
                        }
                        title={
                            values.title
                        }
                        body={
                            values.body
                        }
                        variables={
                            allVariables
                        }
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    disabled={submitting}
                >
                    <Save size={16} />

                    {submitting
                        ? "Saving..."
                        : mode ===
                            "create"
                          ? "Create Template"
                          : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
