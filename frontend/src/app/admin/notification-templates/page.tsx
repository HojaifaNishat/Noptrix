"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Eye,
    Mail,
    MessageSquare,
    Plus,
    RefreshCw,
    Search,
    Smartphone,
    Trash2,
    XCircle,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

import {
    AdminAuthGuard,
} from "@/components/common/AdminAuthGuard";

import {
    Badge,
} from "@/components/ui/Badge";

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
    Select,
} from "@/components/ui/Select";

import {
    useAuthStore,
} from "@/stores/auth.store";

import {
    hasPermission,
} from "@/lib/permissions/permission";

import {
    notificationTemplatesApi,
} from "@/services/api/notification-templates.api";

import {
    NOTIFICATION_TEMPLATE_CHANNELS,
    NOTIFICATION_TEMPLATE_STATUSES,
    type NotificationTemplate,
    type NotificationTemplateChannel,
    type NotificationTemplateQuery,
} from "@/features/notification-templates/notification-template.types";

const PAGE_SIZE = 20;

const getChannelIcon = (
    channel: NotificationTemplateChannel,
) => {
    if (channel === "email") {
        return <Mail size={15} />;
    }

    if (channel === "push") {
        return <Smartphone size={15} />;
    }

    return <MessageSquare size={15} />;
};

const formatDate = (
    value: string,
): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(date);
};

export default function NotificationTemplatesPage() {
    const router = useRouter();

    const user = useAuthStore(
        (state) => state.user,
    );

    const canRead = hasPermission(
        user,
        "notification_templates.read",
    );

    const canCreate = hasPermission(
        user,
        "notification_templates.create",
    );

    const canUpdate = hasPermission(
        user,
        "notification_templates.update",
    );

    const canDelete = hasPermission(
        user,
        "notification_templates.delete",
    );

    const [items, setItems] =
        useState<NotificationTemplate[]>(
            [],
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState<
            "" |
            (typeof NOTIFICATION_TEMPLATE_STATUSES)[number]
        >("");

    const [channel, setChannel] =
        useState<
            "" |
            NotificationTemplateChannel
        >("");

    const [locale, setLocale] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(0);

    const [total, setTotal] =
        useState(0);

    const [actionId, setActionId] =
        useState("");

    const [searchInput, setSearchInput] =
        useState("");

    const loadTemplates =
        useCallback(
            async () => {
                if (!canRead) {
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError("");

                try {
                    const params: NotificationTemplateQuery =
                        {
                            page,
                            limit:
                                PAGE_SIZE,
                            sortBy:
                                "updatedAt",
                            sortOrder:
                                "desc",
                        };

                    if (
                        search.trim()
                    ) {
                        params.search =
                            search.trim();
                    }

                    if (status) {
                        params.status =
                            status;
                    }

                    if (channel) {
                        params.channel =
                            channel;
                    }

                    if (
                        locale.trim()
                    ) {
                        params.locale =
                            locale
                                .trim()
                                .toLowerCase();
                    }

                    const result =
                        await notificationTemplatesApi.getAll(
                            params,
                        );

                    setItems(
                        result.items,
                    );

                    setTotal(
                        result
                            .pagination
                            .total,
                    );

                    setTotalPages(
                        result
                            .pagination
                            .totalPages,
                    );
                } catch (
                    requestError
                ) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Failed to load notification templates.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                canRead,
                channel,
                locale,
                page,
                search,
                status,
            ],
        );

    useEffect(() => {
        void loadTemplates();
    }, [loadTemplates]);

    const activeCount =
        useMemo(
            () =>
                items.filter(
                    (item) =>
                        item.status ===
                        "ACTIVE",
                ).length,
            [items],
        );

    const handleSearch =
        () => {
            setPage(1);
            setSearch(
                searchInput.trim(),
            );
        };

    const handleDelete =
        async (
            template: NotificationTemplate,
        ) => {
            if (!canDelete) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Delete "${template.name}"? This action cannot be undone.`,
                );

            if (!confirmed) {
                return;
            }

            setActionId(
                template._id,
            );

            try {
                await notificationTemplatesApi.remove(
                    template._id,
                );

                await loadTemplates();
            } catch (
                requestError
            ) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Failed to delete template.",
                );
            } finally {
                setActionId("");
            }
        };

    const handleToggleStatus =
        async (
            template: NotificationTemplate,
        ) => {
            if (!canUpdate) {
                return;
            }

            setActionId(
                template._id,
            );

            try {
                if (
                    template.status ===
                    "ACTIVE"
                ) {
                    await notificationTemplatesApi.deactivate(
                        template._id,
                    );
                } else {
                    await notificationTemplatesApi.activate(
                        template._id,
                    );
                }

                await loadTemplates();
            } catch (
                requestError
            ) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Failed to update template status.",
                );
            } finally {
                setActionId("");
            }
        };

    return (
        <AdminAuthGuard>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Notification Templates
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage reusable email, SMS, push and in-app notification templates.
                        </p>
                    </div>

                    {canCreate ? (
                        <Button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/admin/notification-templates/create",
                                )
                            }
                        >
                            <Plus size={17} />
                            Create Template
                        </Button>
                    ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-5">
                        <p className="text-sm text-gray-500">
                            Total Templates
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {total}
                        </p>
                    </Card>

                    <Card className="p-5">
                        <p className="text-sm text-gray-500">
                            Active on Current Page
                        </p>

                        <p className="mt-2 text-2xl font-bold text-green-600">
                            {activeCount}
                        </p>
                    </Card>

                    <Card className="p-5">
                        <p className="text-sm text-gray-500">
                            Current Page
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-900">
                            {page}
                            {totalPages
                                ? ` / ${totalPages}`
                                : ""}
                        </p>
                    </Card>
                </div>

                <Card className="p-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_150px_120px_auto]">
                        <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <Input
                                    value={
                                        searchInput
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setSearchInput(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    onKeyDown={(
                                        event,
                                    ) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="Search name, key, event..."
                                    className="pl-9"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={
                                    handleSearch
                                }
                            >
                                Search
                            </Button>
                        </div>

                        <Select
                            value={channel}
                            onChange={(
                                event,
                            ) => {
                                setPage(1);
                                setChannel(
                                    event
                                        .target
                                        .value as typeof channel,
                                );
                            }}
                        >
                            <option value="">
                                All Channels
                            </option>

                            {NOTIFICATION_TEMPLATE_CHANNELS.map(
                                (
                                    item,
                                ) => (
                                    <option
                                        key={
                                            item
                                        }
                                        value={
                                            item
                                        }
                                    >
                                        {item}
                                    </option>
                                ),
                            )}
                        </Select>

                        <Select
                            value={status}
                            onChange={(
                                event,
                            ) => {
                                setPage(1);
                                setStatus(
                                    event
                                        .target
                                        .value as typeof status,
                                );
                            }}
                        >
                            <option value="">
                                All Statuses
                            </option>

                            {NOTIFICATION_TEMPLATE_STATUSES.map(
                                (
                                    item,
                                ) => (
                                    <option
                                        key={
                                            item
                                        }
                                        value={
                                            item
                                        }
                                    >
                                        {item}
                                    </option>
                                ),
                            )}
                        </Select>

                        <Input
                            value={locale}
                            onChange={(
                                event,
                            ) => {
                                setPage(1);
                                setLocale(
                                    event
                                        .target
                                        .value,
                                );
                            }}
                            placeholder="en"
                        />

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                void loadTemplates()
                            }
                            disabled={
                                loading
                            }
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        </Button>
                    </div>
                </Card>

                {error ? (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{error}</span>
                    </div>
                ) : null}

                <Card className="overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-sm text-gray-500">
                            Loading notification templates...
                        </div>
                    ) : items.length ===
                      0 ? (
                        <div className="p-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                <Eye
                                    size={20}
                                    className="text-gray-500"
                                />
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-gray-900">
                                No templates found
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Try changing your filters or create a new template.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left">
                                    <thead className="border-b border-gray-200 bg-gray-50">
                                        <tr>
                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Template
                                            </th>

                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Event
                                            </th>

                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Channel
                                            </th>

                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Locale
                                            </th>

                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Status
                                            </th>

                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Updated
                                            </th>

                                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {items.map(
                                            (
                                                template,
                                            ) => (
                                                <tr
                                                    key={
                                                        template._id
                                                    }
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="max-w-[300px]">
                                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                                {
                                                                    template.name
                                                                }
                                                            </p>

                                                            <p className="mt-1 truncate font-mono text-xs text-gray-500">
                                                                {
                                                                    template.key
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-xs text-gray-600">
                                                            {
                                                                template.event
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                            {getChannelIcon(
                                                                template.channel,
                                                            )}
                                                            {
                                                                template.channel
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                                                            {
                                                                template.locale
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <Badge
                                                            variant={
                                                                template.status ===
                                                                "ACTIVE"
                                                                    ? "success"
                                                                    : "outline"
                                                            }
                                                        >
                                                            {
                                                                template.status
                                                            }
                                                        </Badge>
                                                    </td>

                                                    <td className="px-5 py-4 text-xs text-gray-500">
                                                        {formatDate(
                                                            template.updatedAt,
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-1.5">
                                                            {canUpdate ? (
                                                                <button
                                                                    type="button"
                                                                    title={
                                                                        template.status ===
                                                                        "ACTIVE"
                                                                            ? "Deactivate"
                                                                            : "Activate"
                                                                    }
                                                                    disabled={
                                                                        actionId ===
                                                                        template._id
                                                                    }
                                                                    onClick={() =>
                                                                        void handleToggleStatus(
                                                                            template,
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                                                                >
                                                                    {template.status ===
                                                                    "ACTIVE" ? (
                                                                        <XCircle
                                                                            size={
                                                                                17
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <CheckCircle2
                                                                            size={
                                                                                17
                                                                            }
                                                                        />
                                                                    )}
                                                                </button>
                                                            ) : null}

                                                            {canUpdate ? (
                                                                <button
                                                                    type="button"
                                                                    title="Edit"
                                                                    onClick={() =>
                                                                        router.push(
                                                                            `/admin/notification-templates/${template._id}`,
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                                                >
                                                                    <Edit3
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            ) : null}

                                                            {canDelete ? (
                                                                <button
                                                                    type="button"
                                                                    title="Delete"
                                                                    disabled={
                                                                        actionId ===
                                                                        template._id
                                                                    }
                                                                    onClick={() =>
                                                                        void handleDelete(
                                                                            template,
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    {
                                        items.length
                                    }{" "}
                                    of{" "}
                                    {total}{" "}
                                    templates
                                </p>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            page <=
                                                1 ||
                                            loading
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    current,
                                                ) =>
                                                    Math.max(
                                                        1,
                                                        current -
                                                            1,
                                                    ),
                                            )
                                        }
                                    >
                                        <ChevronLeft
                                            size={
                                                16
                                            }
                                        />
                                        Previous
                                    </Button>

                                    <span className="min-w-20 text-center text-sm text-gray-600">
                                        {page}
                                        {totalPages
                                            ? ` / ${totalPages}`
                                            : ""}
                                    </span>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            totalPages ===
                                                0 ||
                                            page >=
                                                totalPages ||
                                            loading
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    current,
                                                ) =>
                                                    current +
                                                    1,
                                            )
                                        }
                                    >
                                        Next
                                        <ChevronRight
                                            size={
                                                16
                                            }
                                        />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </AdminAuthGuard>
    );
}
