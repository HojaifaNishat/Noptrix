import {
    Document,
    Schema,
    Types,
    model,
    models,
} from "mongoose";

export interface IPendingCustomerRegistration
    extends Document {
    name: string;
    email: string;
    phone?: string;
    passwordHash: string;
    codeHash: string;
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    resendAvailableAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const pendingCustomerRegistrationSchema =
    new Schema<IPendingCustomerRegistration>(
        {
            name: {
                type: String,
                required: true,
                trim: true,
                minlength: 2,
                maxlength: 100,
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
                maxlength: 11,
            },
            passwordHash: {
                type: String,
                required: true,
                select: false,
            },
            codeHash: {
                type: String,
                required: true,
                select: false,
            },
            attempts: {
                type: Number,
                default: 0,
                min: 0,
            },
            maxAttempts: {
                type: Number,
                required: true,
                min: 1,
                max: 20,
            },
            expiresAt: {
                type: Date,
                required: true,
            },
            resendAvailableAt: {
                type: Date,
                required: true,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );

pendingCustomerRegistrationSchema.index(
    { email: 1 },
    {
        unique: true,
        name: "pending_customer_registration_email_unique",
    },
);

pendingCustomerRegistrationSchema.index(
    { phone: 1 },
    {
        unique: true,
        sparse: true,
        name: "pending_customer_registration_phone_unique",
    },
);

pendingCustomerRegistrationSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        name: "pending_customer_registration_expiry_ttl",
    },
);

export const PendingCustomerRegistration =
    models.PendingCustomerRegistration ??
    model<IPendingCustomerRegistration>(
        "PendingCustomerRegistration",
        pendingCustomerRegistrationSchema,
    );

export type PendingCustomerRegistrationId =
    Types.ObjectId;
