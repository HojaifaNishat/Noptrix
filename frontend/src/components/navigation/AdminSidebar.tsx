"use client";

import Link from "next/link";
import {
    ArrowLeftRight,
    Award,
    BadgeDollarSign,
    Bike,
    BriefcaseBusiness,
    Boxes,
    Calculator,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    CreditCard,
    FileCheck,
    FileText,
    FolderTree,
    Gift,
    HeartHandshake,
    Image,
    LayoutDashboard,
    Layers3,
    LogOut,
    Map,
    MapPinned,
    MessageCircleQuestion,
    Package,
    PackageSearch,
    Percent,
    Receipt,
    RotateCcw,
    Settings,
    ShoppingBasket,
    ShoppingCart,
    Star,
    Tag,
    Tags,
    TicketPercent,
    Truck,
    UserPlus,
    Users,
    Wallet,
    XCircle,
    Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
    useState,
    type ComponentType,
} from "react";

import { adminAuthApi } from "@/services/api/admin-auth.api";
import { ownerAuthApi } from "@/services/api/owner-auth.api";

import { useAuthStore } from "@/stores/auth.store";

import { authStorage } from "@/lib/auth/auth-storage";
import { tokenStorage } from "@/lib/auth/token-storage";


/*
|--------------------------------------------------------------------------
| Navigation Types
|--------------------------------------------------------------------------
*/

interface NavigationItem {
    label: string;
    href: string;
    icon: ComponentType<{
        size?: number;
        strokeWidth?: number;
    }>;
    permission?: string;
    ownerOnly?: boolean;
}

interface NavigationSection {
    id: string;
    label: string;
    icon: ComponentType<{
        size?: number;
        strokeWidth?: number;
    }>;
    items: NavigationItem[];
    ownerOnly?: boolean;
}


/*
|--------------------------------------------------------------------------
| Navigation Configuration
|--------------------------------------------------------------------------
*/

const NAVIGATION_SECTIONS: NavigationSection[] = [

    /*
    |--------------------------------------------------------------------------
    | Administration
    |--------------------------------------------------------------------------
    */

    {
        id: "administration",
        label: "Administration",
        icon: Settings,
        ownerOnly: true,

        items: [
            {
                label: "Admins",
                href: "/admin/admins",
                icon: Users,
                permission: "admins.read",
                ownerOnly: true,
            },
            {
                label: "Invitations",
                href: "/admin/invitations",
                icon: FileCheck,
                permission: "invitations.read",
                ownerOnly: true,
            },
            {
                label: "Roles & Permissions",
                href: "/admin/roles",
                icon: Award,
                permission: "roles.read",
                ownerOnly: true,
            },
            {
                label: "Employees",
                href: "/admin/employees",
                icon: Users,
                permission: "employees.read",
                ownerOnly: true,
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | People
    |--------------------------------------------------------------------------
    */

    {
        id: "people",
        label: "People",
        icon: Users,

        items: [
            {
                label: "Users",
                href: "/admin/users",
                icon: Users,
                permission: "users.read",
            },
            {
                label: "Customers",
                href: "/admin/customers",
                icon: Users,
                permission: "customers.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Sellers
    |--------------------------------------------------------------------------
    */

    {
        id: "sellers",
        label: "Sellers",
        icon: ShoppingBasket,

        items: [
            {
                label: "Sellers",
                href: "/admin/sellers",
                icon: ShoppingBasket,
                permission: "sellers.read",
            },
            {
                label: "Seller Applications",
                href: "/admin/seller-applications",
                icon: FileCheck,
                permission: "seller-applications.read",
            },
            {
                label: "Seller Products",
                href: "/admin/seller-products",
                icon: Package,
                permission: "seller-products.read",
            },
            {
                label: "Seller Orders",
                href: "/admin/seller-orders",
                icon: ShoppingCart,
                permission: "seller-orders.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Riders
    |--------------------------------------------------------------------------
    */

    {
        id: "riders",
        label: "Riders",
        icon: Bike,

        items: [
            {
                label: "Riders",
                href: "/admin/riders",
                icon: Bike,
                permission: "riders.read",
            },
            {
                label: "Rider Applications",
                href: "/admin/rider-applications",
                icon: FileCheck,
                permission: "rider-applications.read",
            },
            {
                label: "Rider Earnings",
                href: "/admin/rider-earnings",
                icon: Wallet,
                permission: "rider-earnings.read",
            },
            {
                label: "Tracking",
                href: "/admin/tracking",
                icon: MapPinned,
                permission: "tracking.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Catalog
    |--------------------------------------------------------------------------
    */

    {
        id: "catalog",
        label: "Catalog",
        icon: Package,

        items: [
            {
                label: "Products",
                href: "/admin/products",
                icon: Package,
                permission: "products.read",
            },
            {
                label: "Categories",
                href: "/admin/categories",
                icon: FolderTree,
                permission: "categories.read",
            },
            {
                label: "Subcategories",
                href: "/admin/subcategories",
                icon: FolderTree,
                permission: "subcategories.read",
            },
            {
                label: "Brands",
                href: "/admin/brands",
                icon: Tags,
                permission: "brands.read",
            },
            {
                label: "Collections",
                href: "/admin/collections",
                icon: Layers3,
                permission: "collections.read",
            },
            {
                label: "Attributes",
                href: "/admin/attributes",
                icon: Tag,
                permission: "attributes.read",
            },
            {
                label: "Product Variants",
                href: "/admin/product-variants",
                icon: Layers3,
                permission: "product-variants.read",
            },
            {
                label: "Product Images",
                href: "/admin/product-images",
                icon: Image,
                permission: "product-images.read",
            },
            {
                label: "Product Tags",
                href: "/admin/product-tags",
                icon: Tag,
                permission: "product-tags.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Sales
    |--------------------------------------------------------------------------
    */

    {
        id: "sales",
        label: "Sales",
        icon: ShoppingCart,

        items: [
            {
                label: "Orders",
                href: "/admin/orders",
                icon: ShoppingCart,
                permission: "orders.read",
            },
            {
                label: "Cancellations",
                href: "/admin/cancellations",
                icon: XCircle,
                permission: "cancellations.read",
            },
            {
                label: "Returns",
                href: "/admin/returns",
                icon: RotateCcw,
                permission: "returns.read",
            },
            {
                label: "Refunds",
                href: "/admin/refunds",
                icon: BadgeDollarSign,
                permission: "refunds.read",
            },
            {
                label: "Reviews",
                href: "/admin/reviews",
                icon: Star,
                permission: "reviews.read",
            },
            {
                label: "Ratings",
                href: "/admin/ratings",
                icon: Star,
                permission: "ratings.read",
            },
            {
                label: "Questions",
                href: "/admin/questions",
                icon: MessageCircleQuestion,
                permission: "questions.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Promotions
    |--------------------------------------------------------------------------
    */

    {
        id: "promotions",
        label: "Promotions",
        icon: Percent,

        items: [
            {
                label: "Coupons",
                href: "/admin/coupons",
                icon: TicketPercent,
                permission: "coupons.read",
            },
            {
                label: "Discounts",
                href: "/admin/discounts",
                icon: Percent,
                permission: "discounts.read",
            },
            {
                label: "Flash Sales",
                href: "/admin/flash-sales",
                icon: Zap,
                permission: "flash-sales.read",
            },
            {
                label: "Promotions",
                href: "/admin/promotions",
                icon: Percent,
                permission: "promotions.read",
            },
            {
                label: "Gift Cards",
                href: "/admin/gift-cards",
                icon: Gift,
                permission: "gift-cards.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    {
        id: "inventory",
        label: "Inventory",
        icon: Boxes,

        items: [
            {
                label: "Inventory",
                href: "/admin/inventory",
                icon: Boxes,
                permission: "inventory.read",
            },
            {
                label: "Purchases",
                href: "/admin/purchases",
                icon: ShoppingBasket,
                permission: "purchases.read",
            },
            {
                label: "Purchase Returns",
                href: "/admin/purchase-returns",
                icon: RotateCcw,
                permission: "purchase-returns.read",
            },
            {
                label: "Stock Movements",
                href: "/admin/stock-movements",
                icon: ArrowLeftRight,
                permission: "stock-movements.read",
            },
            {
                label: "Stock Transfers",
                href: "/admin/stock-transfers",
                icon: Truck,
                permission: "stock-transfers.read",
            },
            {
                label: "Low Stock",
                href: "/admin/low-stock",
                icon: PackageSearch,
                permission: "low-stock.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Payments & Accounting
    |--------------------------------------------------------------------------
    */

    {
        id: "payments-accounting",
        label: "Payments & Accounting",
        icon: CreditCard,

        items: [
            {
                label: "Payments",
                href: "/admin/payments",
                icon: CreditCard,
                permission: "payments.read",
            },
            {
                label: "Payment Methods",
                href: "/admin/payment-methods",
                icon: CreditCard,
                permission: "payment-methods.read",
            },
            {
                label: "Invoices",
                href: "/admin/invoices",
                icon: FileText,
                permission: "invoices.read",
            },
            {
                label: "Receipts",
                href: "/admin/receipts",
                icon: Receipt,
                permission: "receipts.read",
            },
            {
                label: "Accounting",
                href: "/admin/accounting",
                icon: Calculator,
                permission: "accounting.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Delivery
    |--------------------------------------------------------------------------
    */

    {
        id: "delivery",
        label: "Delivery",
        icon: Truck,

        items: [
            {
                label: "Delivery",
                href: "/admin/delivery",
                icon: Truck,
                permission: "delivery.read",
            },
            {
                label: "Delivery Zones",
                href: "/admin/delivery-zones",
                icon: Map,
                permission: "delivery-zones.read",
            },
            {
                label: "Delivery Fees",
                href: "/admin/delivery-fees",
                icon: BadgeDollarSign,
                permission: "delivery-fees.read",
            },
            {
                label: "Shipping",
                href: "/admin/shipping",
                icon: Truck,
                permission: "shipping.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Jobs
    |--------------------------------------------------------------------------
    */

    {
        id: "jobs",
        label: "Jobs",
        icon: BriefcaseBusiness,

        items: [
            {
                label: "Job Vacancies",
                href: "/admin/job-vacancies",
                icon: BriefcaseBusiness,
                permission: "job-vacancies.read",
            },
            {
                label: "Job Applications",
                href: "/admin/job-applications",
                icon: ClipboardList,
                permission: "job-applications.read",
            },
        ],
    },


    /*
    |--------------------------------------------------------------------------
    | Customer Programs
    |--------------------------------------------------------------------------
    */

    {
        id: "customer-programs",
        label: "Customer Programs",
        icon: Award,

        items: [
            {
                label: "Referrals",
                href: "/admin/referrals",
                icon: UserPlus,
                permission: "referrals.read",
            },
            {
                label: "Reward Points",
                href: "/admin/reward-points",
                icon: Award,
                permission: "reward-points.read",
            },
            {
                label: "Loyalty",
                href: "/admin/loyalty",
                icon: HeartHandshake,
                permission: "loyalty.read",
            },
        ],
    },
];


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const user = useAuthStore(
        (state) => state.user,
    );

    const clearAuth = useAuthStore(
        (state) => state.clearAuth,
    );


    /*
    |--------------------------------------------------------------------------
    | UI State
    |--------------------------------------------------------------------------
    */

    const [
        collapsed,
        setCollapsed,
    ] = useState(false);

    const [
        openSections,
        setOpenSections,
    ] = useState<Record<string, boolean>>(
        {},
    );

    const [
        isLoggingOut,
        setIsLoggingOut,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Account
    |--------------------------------------------------------------------------
    */

    const accountType =
        user?.accountType;

    const isOwner =
        accountType === "OWNER";

    const isAdmin =
        accountType === "ADMIN";

    const permissions =
        user?.permissions ?? [];


    /*
    |--------------------------------------------------------------------------
    | Permission
    |--------------------------------------------------------------------------
    */

    const hasPermission = (
        permission?: string,
    ): boolean => {
        if (!permission) {
            return true;
        }

        /*
         * OWNER has full system access.
         *
         * OWNER does not depend on
         * RolePermission mapping.
         */

        if (isOwner) {
            return true;
        }

        return permissions.includes(
            permission,
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Visibility
    |--------------------------------------------------------------------------
    */

    const canShowItem = (
        item: NavigationItem,
    ): boolean => {
        if (
            item.ownerOnly &&
            !isOwner
        ) {
            return false;
        }

        return hasPermission(
            item.permission,
        );
    };


    const visibleSections =
        NAVIGATION_SECTIONS
            .map((section) => ({
                ...section,

                items: section.items.filter(
                    canShowItem,
                ),
            }))
            .filter((section) => {
                if (
                    section.ownerOnly &&
                    !isOwner
                ) {
                    return false;
                }

                return (
                    section.items.length > 0
                );
            });


    /*
    |--------------------------------------------------------------------------
    | Section Toggle
    |--------------------------------------------------------------------------
    */

    const toggleSection = (
        sectionId: string,
    ) => {
        setOpenSections(
            (current) => ({
                ...current,

                [sectionId]:
                    !current[
                        sectionId
                    ],
            }),
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Active Route
    |--------------------------------------------------------------------------
    */

    const isItemActive = (
        href: string,
    ): boolean => {
        return (
            pathname === href ||
            pathname.startsWith(
                `${href}/`,
            )
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const handleLogout = async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            if (isOwner) {
                await ownerAuthApi.logout();
            }

            if (isAdmin) {
                await adminAuthApi.logout();
            }
        } catch {
            /*
             * Local authentication state
             * is cleared even if backend
             * logout fails.
             */
        } finally {
            tokenStorage.clear();
            authStorage.clear();
            clearAuth();

            router.replace(
                isOwner
                    ? "/owner/login"
                    : "/admin/login",
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <aside
            className={[
                "flex min-h-screen flex-col",
                "border-r border-gray-200",
                "bg-white",
                "transition-all duration-200",

                collapsed
                    ? "w-20"
                    : "w-72",
            ].join(" ")}
        >

            {/*
            |--------------------------------------------------------------------------
            | Header
            |--------------------------------------------------------------------------
            */}

            <div
                className={[
                    "flex h-16 shrink-0 items-center",
                    "border-b border-gray-200",

                    collapsed
                        ? "justify-center"
                        : "justify-between px-4",
                ].join(" ")}
            >
                {!collapsed && (
                    <Link
                        href="/admin"
                        className="text-xl font-bold tracking-tight text-gray-900"
                    >
                        NOPTRIX
                    </Link>
                )}

                <button
                    type="button"
                    onClick={() =>
                        setCollapsed(
                            (value) =>
                                !value,
                        )
                    }
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                >
                    {collapsed ? (
                        <ChevronRight
                            size={20}
                        />
                    ) : (
                        <ChevronLeft
                            size={20}
                        />
                    )}
                </button>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Account
            |--------------------------------------------------------------------------
            */}

            <div
                className={[
                    "shrink-0 border-b border-gray-200",

                    collapsed
                        ? "px-2 py-4"
                        : "px-4 py-4",
                ].join(" ")}
            >
                <div
                    className={[
                        "rounded-xl bg-gray-50",

                        collapsed
                            ? "flex justify-center p-2"
                            : "px-3 py-3",
                    ].join(" ")}
                >
                    {collapsed ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                            {isOwner
                                ? "O"
                                : "A"}
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Account
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {isOwner
                                    ? "Owner"
                                    : "Administrator"}
                            </p>

                            {isAdmin &&
                                user?.role && (
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {user.role}
                                    </p>
                                )}
                        </>
                    )}
                </div>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Navigation
            |--------------------------------------------------------------------------
            */}

            <nav className="flex-1 overflow-y-auto px-3 py-4">

                {/*
                |--------------------------------------------------------------------------
                | Dashboard
                |--------------------------------------------------------------------------
                */}

                <Link
                    href="/admin"
                    className={[
                        "mb-3 flex items-center rounded-lg",
                        "text-sm font-medium transition",

                        collapsed
                            ? "justify-center p-3"
                            : "gap-3 px-3 py-2.5",

                        pathname === "/admin"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    ].join(" ")}
                    title={
                        collapsed
                            ? "Dashboard"
                            : undefined
                    }
                >
                    <LayoutDashboard
                        size={19}
                        strokeWidth={1.8}
                    />

                    {!collapsed && (
                        <span>
                            Dashboard
                        </span>
                    )}
                </Link>


                {/*
                |--------------------------------------------------------------------------
                | Sections
                |--------------------------------------------------------------------------
                */}

                <div className="space-y-1">
                    {visibleSections.map(
                        (section) => {
                            const SectionIcon =
                                section.icon;

                            const isSectionActive =
                                section.items.some(
                                    (
                                        item,
                                    ) =>
                                        isItemActive(
                                            item.href,
                                        ),
                                );

                            const isOpen =
                                openSections[
                                    section.id
                                ] ??
                                isSectionActive;


                            /*
                            |--------------------------------------------------------------------------
                            | Collapsed Sidebar
                            |--------------------------------------------------------------------------
                            */

                            if (collapsed) {
                                return (
                                    <div
                                        key={
                                            section.id
                                        }
                                        className="space-y-1"
                                    >
                                        {section.items.map(
                                            (
                                                item,
                                            ) => {
                                                const Icon =
                                                    item.icon;

                                                return (
                                                    <Link
                                                        key={
                                                            item.href
                                                        }
                                                        href={
                                                            item.href
                                                        }
                                                        title={
                                                            item.label
                                                        }
                                                        className={[
                                                            "flex items-center justify-center rounded-lg p-3",
                                                            "text-gray-700 transition",

                                                            isItemActive(
                                                                item.href,
                                                            )
                                                                ? "bg-gray-100 text-gray-900"
                                                                : "hover:bg-gray-100 hover:text-gray-900",
                                                        ].join(
                                                            " ",
                                                        )}
                                                    >
                                                        <Icon
                                                            size={
                                                                19
                                                            }
                                                            strokeWidth={
                                                                1.8
                                                            }
                                                        />
                                                    </Link>
                                                );
                                            },
                                        )}
                                    </div>
                                );
                            }


                            /*
                            |--------------------------------------------------------------------------
                            | Expanded Sidebar
                            |--------------------------------------------------------------------------
                            */

                            return (
                                <div
                                    key={
                                        section.id
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleSection(
                                                section.id,
                                            )
                                        }
                                        className={[
                                            "flex w-full items-center rounded-lg",
                                            "px-3 py-2.5",
                                            "text-sm font-medium",
                                            "transition",

                                            isSectionActive
                                                ? "text-gray-900"
                                                : "text-gray-700",

                                            "hover:bg-gray-100 hover:text-gray-900",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        <SectionIcon
                                            size={
                                                18
                                            }
                                            strokeWidth={
                                                1.8
                                            }
                                        />

                                        <span className="ml-3 flex-1 text-left">
                                            {
                                                section.label
                                            }
                                        </span>

                                        {isOpen ? (
                                            <ChevronDown
                                                size={
                                                    16
                                                }
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={
                                                    16
                                                }
                                            />
                                        )}
                                    </button>


                                    {isOpen && (
                                        <div className="ml-3 mt-1 space-y-1 border-l border-gray-200 pl-3">
                                            {section.items.map(
                                                (
                                                    item,
                                                ) => {
                                                    const Icon =
                                                        item.icon;

                                                    const active =
                                                        isItemActive(
                                                            item.href,
                                                        );

                                                    return (
                                                        <Link
                                                            key={
                                                                item.href
                                                            }
                                                            href={
                                                                item.href
                                                            }
                                                            className={[
                                                                "flex items-center rounded-lg",
                                                                "px-3 py-2",
                                                                "text-sm transition",

                                                                active
                                                                    ? "bg-gray-100 font-medium text-gray-900"
                                                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                                            ].join(
                                                                " ",
                                                            )}
                                                        >
                                                            <Icon
                                                                size={
                                                                    17
                                                                }
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />

                                                            <span className="ml-3">
                                                                {
                                                                    item.label
                                                                }
                                                            </span>
                                                        </Link>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        },
                    )}
                </div>
            </nav>


            {/*
            |--------------------------------------------------------------------------
            | System
            |--------------------------------------------------------------------------
            */}

            <div
                className={[
                    "shrink-0 border-t border-gray-200",

                    collapsed
                        ? "p-3"
                        : "p-4",
                ].join(" ")}
            >

                {/*
                |--------------------------------------------------------------------------
                | Settings
                |--------------------------------------------------------------------------
                */}

                <Link
                    href="/admin/settings"
                    title={
                        collapsed
                            ? "Settings"
                            : undefined
                    }
                    className={[
                        "mb-2 flex items-center rounded-lg",
                        "text-sm font-medium",
                        "text-gray-700 transition",
                        "hover:bg-gray-100 hover:text-gray-900",

                        collapsed
                            ? "justify-center p-3"
                            : "gap-3 px-3 py-2.5",
                    ].join(" ")}
                >
                    <Settings
                        size={19}
                        strokeWidth={1.8}
                    />

                    {!collapsed && (
                        <span>
                            Settings
                        </span>
                    )}
                </Link>


                {/*
                |--------------------------------------------------------------------------
                | Logout
                |--------------------------------------------------------------------------
                */}

                <button
                    type="button"
                    onClick={
                        handleLogout
                    }
                    disabled={
                        isLoggingOut
                    }
                    title={
                        collapsed
                            ? "Logout"
                            : undefined
                    }
                    className={[
                        "flex w-full items-center rounded-lg",
                        "text-sm font-medium",
                        "text-red-600 transition",
                        "hover:bg-red-50",
                        "disabled:cursor-not-allowed",
                        "disabled:opacity-50",

                        collapsed
                            ? "justify-center p-3"
                            : "gap-3 px-3 py-2.5",
                    ].join(" ")}
                >
                    <LogOut
                        size={19}
                        strokeWidth={1.8}
                    />

                    {!collapsed && (
                        <span>
                            {isLoggingOut
                                ? "Logging out..."
                                : "Logout"}
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
}