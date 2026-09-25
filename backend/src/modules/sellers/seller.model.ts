import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Seller Status
|--------------------------------------------------------------------------
*/

export const SELLER_STATUSES = [
    "PENDING",
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "REJECTED",
] as const;

export type SellerStatus =
    (typeof SELLER_STATUSES)[number];

/*
|--------------------------------------------------------------------------
| Seller Types
|--------------------------------------------------------------------------
*/

export const SELLER_TYPES = [
    "INDIVIDUAL",
    "BUSINESS",
] as const;

export type SellerType =
    (typeof SELLER_TYPES)[number];

/*
|--------------------------------------------------------------------------
| Seller Document
|--------------------------------------------------------------------------
*/

export interface ISeller extends Document {
    userId: Types.ObjectId;

    sellerCode: string;

    type: SellerType;

    businessName: string;

    legalName?: string;

    email: string;

    phone?: string;

    taxNumber?: string;

    registrationNumber?: string;

    description?: string;

    logoUrl?: string;

    website?: string;

    status: SellerStatus;

    verifiedAt?: Date;

    verifiedBy?: Types.ObjectId;

    suspendedAt?: Date;

    suspendedBy?: Types.ObjectId;

    suspensionReason?: string;

    rejectionReason?: string;

    notes?: string;

    createdBy?: Types.ObjectId;

    updatedBy?: Types.ObjectId;

    createdAt: Date;

    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const sellerSchema = new Schema<ISeller>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        sellerCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            index: true,
            maxlength: 50,
        },

        type: {
            type: String,
            enum: SELLER_TYPES,
            required: true,
            default: "BUSINESS",
            index: true,
        },

        businessName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
            index: true,
        },

        legalName: {
            type: String,
            trim: true,
            maxlength: 200,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 30,
        },

        taxNumber: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        registrationNumber: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 5000,
        },

        logoUrl: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        website: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        status: {
            type: String,
            enum: SELLER_STATUSES,
            required: true,
            default: "PENDING",
            index: true,
        },

        verifiedAt: {
            type: Date,
        },

        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        suspendedAt: {
            type: Date,
        },

        suspendedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        suspensionReason: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 5000,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

sellerSchema.index({
    status: 1,
    createdAt: -1,
});

sellerSchema.index({
    type: 1,
    status: 1,
});

sellerSchema.index({
    businessName: 1,
    status: 1,
});

sellerSchema.index({
    email: 1,
    status: 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Seller: Model<ISeller> =
    model<ISeller>(
        "Seller",
        sellerSchema,
    );