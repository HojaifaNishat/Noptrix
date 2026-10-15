import { Schema, model, models, type Model } from "mongoose";

export const INTEGRATION_STATUSES = [
    "ACTIVE",
    "INACTIVE",
    "ERROR",
] as const;

export interface IIntegration {
    name: string;
    provider: string;
    description?: string;
    status: (typeof INTEGRATION_STATUSES)[number];
    config: Record<string, unknown>;
    secretEnvKeys: string[];
    lastCheckedAt?: Date;
    lastError?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const integrationSchema = new Schema<IIntegration>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        provider: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        status: {
            type: String,
            enum: INTEGRATION_STATUSES,
            default: "INACTIVE",
            required: true,
        },
        config: {
            type: Schema.Types.Mixed,
            default: {},
        },
        secretEnvKeys: {
            type: [String],
            default: [],
            select: false,
        },
        lastCheckedAt: Date,
        lastError: {
            type: String,
            maxlength: 2000,
            select: false,
        },
        createdBy: {
            type: String,
            maxlength: 100,
        },
        updatedBy: {
            type: String,
            maxlength: 100,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: true,
        minimize: false,
    },
);

integrationSchema.index(
    { name: 1 },
    { unique: true },
);

integrationSchema.index({ status: 1, updatedAt: -1 });
integrationSchema.index({ provider: 1, status: 1 });

export const Integration: Model<IIntegration> =
    (models.Integration as Model<IIntegration>) ||
    model<IIntegration>("Integration", integrationSchema);
