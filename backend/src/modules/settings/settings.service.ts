import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";

import { Settings } from "./settings.model";

import {
  SETTINGS_CATEGORIES,
  type SettingsCategory,
  type SettingsValues,
} from "./settings.types";

import { settingsValueSchemas } from "./settings.validator";

import { DEFAULT_SETTINGS } from "./settings.defaults";

/*
|--------------------------------------------------------------------------
| Settings Service
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Read settings by category.
| - Read all registered categories.
| - Validate category-specific values.
| - Perform atomic partial updates.
| - Keep provider credentials outside general settings.
| - Return stable, predictable response objects.
|
|--------------------------------------------------------------------------
*/

export interface SettingsResult {
  readonly category: SettingsCategory;
  readonly values: SettingsValues;
  readonly updatedAt: Date | null;
  readonly updatedBy: string | null;
}

export interface UpdateSettingsOptions {
  readonly category: SettingsCategory;
  readonly values: SettingsValues;
  readonly actorId: string;
}

const EMPTY_VALUES: SettingsValues = Object.freeze({});

/*
|--------------------------------------------------------------------------
| Safe Settings Projection
|--------------------------------------------------------------------------
*/

const toSettingsResult = (
  category: SettingsCategory,
  document?: {
    values?: unknown;
    updatedAt?: Date;
    updatedBy?: string | null;
  } | null,
): SettingsResult => {
  const values = document?.values;

  return {
    category,

    values: {
      ...DEFAULT_SETTINGS[category],

      ...(values !== null &&
      typeof values === "object" &&
      !Array.isArray(values)
        ? (values as SettingsValues)
        : EMPTY_VALUES),
    },

    updatedAt: document?.updatedAt instanceof Date ? document.updatedAt : null,

    updatedBy:
      typeof document?.updatedBy === "string" ? document.updatedBy : null,
  };
};

/*
|--------------------------------------------------------------------------
| Validate Category Values
|--------------------------------------------------------------------------
*/

const validateCategoryValues = (
  category: SettingsCategory,
  values: SettingsValues,
): SettingsValues => {
  const schema = settingsValueSchemas[category];

  const result = schema.safeParse(values);

  if (!result.success) {
    throw ApiError.badRequest("Invalid settings values.", {
      code: "INVALID_SETTINGS_VALUES",
      details: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    });
  }

  const parsedValues = result.data as SettingsValues;

  if (Object.keys(parsedValues).length === 0) {
    throw ApiError.badRequest("At least one valid setting value is required.", {
      code: "EMPTY_SETTINGS_UPDATE",
    });
  }

  return parsedValues;
};

/*
|--------------------------------------------------------------------------
| Read One Category
|--------------------------------------------------------------------------
*/

export const getSettingsByCategory = async (
  category: SettingsCategory,
): Promise<SettingsResult> => {
  const document = await Settings.findOne({
    category,
  })
    .select("category values updatedAt updatedBy")
    .lean()
    .exec();

  return toSettingsResult(category, document);
};

/*
|--------------------------------------------------------------------------
| Read All Categories
|--------------------------------------------------------------------------
*/

export const getAllSettings = async (): Promise<SettingsResult[]> => {
  const documents = await Settings.find({
    category: {
      $in: [...SETTINGS_CATEGORIES],
    },
  })
    .select("category values updatedAt updatedBy")
    .lean()
    .exec();

  const documentsByCategory = new Map<
    SettingsCategory,
    (typeof documents)[number]
  >();

  for (const document of documents) {
    documentsByCategory.set(document.category as SettingsCategory, document);
  }

  return SETTINGS_CATEGORIES.map((category) =>
    toSettingsResult(category, documentsByCategory.get(category)),
  );
};

/*
|--------------------------------------------------------------------------
| Update One Category
|--------------------------------------------------------------------------
*/

export const updateSettings = async (
  options: UpdateSettingsOptions,
): Promise<SettingsResult> => {
  const { category, values, actorId } = options;

  if (!Types.ObjectId.isValid(actorId)) {
    throw ApiError.badRequest("Invalid settings actor ID.", {
      code: "INVALID_SETTINGS_ACTOR",
    });
  }

  const validatedValues = validateCategoryValues(category, values);

  /*
   * Use $set for each validated key so a partial
   * update does not replace the entire values object.
   *
   * The category has a unique index, so concurrent
   * first-time writes are protected at the database
   * level against duplicate category documents.
   */
  const update: Record<string, unknown> = {
    updatedBy: actorId,
  };

  for (const [key, value] of Object.entries(validatedValues)) {
    update[`values.${key}`] = value;
  }

  try {
    const document = await Settings.findOneAndUpdate(
      {
        category,
      },
      {
        $set: update,

        $setOnInsert: {
          category,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )
      .select("category values updatedAt updatedBy")
      .lean()
      .exec();

    if (!document) {
      throw ApiError.internal("Settings update returned no document.", {
        code: "SETTINGS_UPDATE_FAILED",
      });
    }

    return toSettingsResult(category, document);
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      /*
       * A concurrent upsert may win the unique
       * category insert race. Retry as an update.
       */
      const document = await Settings.findOneAndUpdate(
        {
          category,
        },
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .select("category values updatedAt updatedBy")
        .lean()
        .exec();

      if (document) {
        return toSettingsResult(category, document);
      }
    }

    throw error;
  }
};
