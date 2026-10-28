import { Schema, model, models, type InferSchemaType } from "mongoose";

import { SETTINGS_CATEGORIES } from "./settings.types";

/*
|--------------------------------------------------------------------------
| Settings Schema
|--------------------------------------------------------------------------
|
| One document per category.
|
| Provider credentials, API secrets, passwords and private keys
| must never be stored in this general settings document.
|
|--------------------------------------------------------------------------
*/

const settingsSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: SETTINGS_CATEGORIES,
      unique: true,
      immutable: true,
      trim: true,
    },

    values: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },

    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
    minimize: false,
  },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;

export const Settings = models.Settings ?? model("Settings", settingsSchema);
