import { Schema, model, models, type Model } from "mongoose";

export interface IMaintenanceState {
    enabled: boolean;
    message: string;
    startsAt?: Date;
    endsAt?: Date;
    updatedBy?: string;
    updatedAt: Date;
}

const maintenanceSchema = new Schema<IMaintenanceState>(
    {
        enabled: {
            type: Boolean,
            default: false,
            required: true,
        },
        message: {
            type: String,
            default: "The service is temporarily unavailable for maintenance.",
            maxlength: 1000,
        },
        startsAt: Date,
        endsAt: Date,
        updatedBy: {
            type: String,
            maxlength: 100,
        },
    },
    {
        timestamps: {
            createdAt: false,
            updatedAt: true,
        },
        versionKey: false,
    },
);

export const MaintenanceState: Model<IMaintenanceState> =
    (models.MaintenanceState as Model<IMaintenanceState>) ||
    model<IMaintenanceState>(
        "MaintenanceState",
        maintenanceSchema,
    );
