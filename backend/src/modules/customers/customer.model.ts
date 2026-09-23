import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Customer Status
|--------------------------------------------------------------------------
*/

export const CUSTOMER_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    BLOCKED: "BLOCKED",
} as const;

export type CustomerStatus =
    typeof CUSTOMER_STATUSES[keyof typeof CUSTOMER_STATUSES];

/*
|--------------------------------------------------------------------------
| Customer Interface
|--------------------------------------------------------------------------
*/

export interface ICustomer {
    _id: Types.ObjectId;

    /**
     * Reference to the core User account.
     *
     * User module owns:
     * - name
     * - email
     * - phone
     * - password
     * - authentication state
     *
     * Customer module owns:
     * - shopping/customer-specific data
     */
    userId: Types.ObjectId;

    status: CustomerStatus;

    /**
     * Customer-specific profile information.
     */
    avatar?: string;

    dateOfBirth?: Date;

    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

    /**
     * E-commerce statistics.
     *
     * These are denormalized counters for fast dashboard/query access.
     * They can be updated by order-related services later.
     */
    totalOrders: number;

    totalSpent: number;

    totalRefunded: number;

    /**
     * Customer activity.
     */
    lastOrderAt?: Date;

    lastActiveAt?: Date;

    createdAt: Date;

    updatedAt: Date;
}

export interface ICustomerDocument
    extends ICustomer,
        Document {}

export type CustomerModel =
    Model<ICustomerDocument>;

/*
|--------------------------------------------------------------------------
| Customer Schema
|--------------------------------------------------------------------------
*/

const customerSchema =
    new Schema<ICustomerDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "User ID is required.",
                ],
                unique: true,
                index: true,
            },

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        CUSTOMER_STATUSES
                    ),
                    message:
                        "Invalid customer status.",
                },
                default:
                    CUSTOMER_STATUSES.ACTIVE,
                index: true,
            },

            avatar: {
                type: String,
                trim: true,
                maxlength: [
                    2000,
                    "Avatar URL cannot exceed 2000 characters.",
                ],
            },

            dateOfBirth: {
                type: Date,
            },

            gender: {
                type: String,
                enum: {
                    values: [
                        "MALE",
                        "FEMALE",
                        "OTHER",
                        "PREFER_NOT_TO_SAY",
                    ],
                    message:
                        "Invalid gender.",
                },
            },

            totalOrders: {
                type: Number,
                default: 0,
                min: [
                    0,
                    "Total orders cannot be negative.",
                ],
            },

            totalSpent: {
                type: Number,
                default: 0,
                min: [
                    0,
                    "Total spent cannot be negative.",
                ],
            },

            totalRefunded: {
                type: Number,
                default: 0,
                min: [
                    0,
                    "Total refunded cannot be negative.",
                ],
            },

            lastOrderAt: {
                type: Date,
            },

            lastActiveAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

customerSchema.index(
    {
        status: 1,
        createdAt: -1,
    },
    {
        name: "customer_status_createdAt",
    }
);

customerSchema.index(
    {
        lastActiveAt: -1,
    },
    {
        name: "customer_lastActiveAt",
    }
);

customerSchema.index(
    {
        lastOrderAt: -1,
    },
    {
        name: "customer_lastOrderAt",
    }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Customer =
    model<ICustomerDocument, CustomerModel>(
        "Customer",
        customerSchema
    );