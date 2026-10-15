import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { Settings } from "../settings/settings.model";
import {
    Currency,
    type CurrencyStatus,
} from "./currency.model";
import type {
    CreateCurrencyInput,
    ListCurrenciesQuery,
    UpdateCurrencyInput,
} from "./currency.validator";

const DEFAULT_CURRENCY_CODE = "BDT";

function ensureObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest("Invalid currency ID.");
    }
}

function normalizeCode(code: string): string {
    return code.trim().toUpperCase();
}

export async function createCurrency(
    input: CreateCurrencyInput,
) {
    const code = normalizeCode(input.code);

    const existing = await Currency.exists({ code });

    if (existing) {
        throw ApiError.conflict(
            `Currency ${code} already exists.`,
        );
    }

    try {
        return await Currency.create({
            code,
            name: input.name.trim(),
            symbol: input.symbol.trim(),
            decimalPlaces: input.decimalPlaces,
            status: "ACTIVE",
            isDefault: false,
        });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw ApiError.conflict(
                `Currency ${code} already exists.`,
            );
        }

        throw error;
    }
}

export async function listCurrencies(
    query: ListCurrenciesQuery,
    includeInactive = false,
) {
    const filter: {
        status?: CurrencyStatus;
    } = {};

    if (query.status) {
        filter.status = query.status;
    } else if (!includeInactive) {
        filter.status = "ACTIVE";
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
        Currency.find(filter)
            .sort({ code: 1 })
            .skip(skip)
            .limit(query.limit)
            .lean(),

        Currency.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

export async function getCurrencyById(
    currencyId: string,
) {
    ensureObjectId(currencyId);

    const currency = await Currency.findById(currencyId).lean();

    if (!currency) {
        throw ApiError.notFound("Currency not found.");
    }

    return currency;
}

export async function updateCurrency(
    currencyId: string,
    input: UpdateCurrencyInput,
) {
    ensureObjectId(currencyId);

    const currency = await Currency.findById(currencyId);

    if (!currency) {
        throw ApiError.notFound("Currency not found.");
    }

    if (
        input.status === "INACTIVE" &&
        currency.isDefault
    ) {
        throw ApiError.badRequest(
            "The default currency cannot be deactivated. Set another default currency first.",
        );
    }

    if (input.name !== undefined) {
        currency.name = input.name.trim();
    }

    if (input.symbol !== undefined) {
        currency.symbol = input.symbol.trim();
    }

    if (input.decimalPlaces !== undefined) {
        currency.decimalPlaces = input.decimalPlaces;
    }

    if (input.status !== undefined) {
        currency.status = input.status;
    }

    await currency.save();

    return currency;
}

/**
 * Sets a registered ACTIVE currency as the default.
 *
 * The existing default is cleared first to satisfy the
 * partial unique index. This operation is not transactional;
 * if the second write fails, the registry may temporarily
 * have no default. Callers should handle errors and verify
 * the registry before retrying.
 */
/**
 * Changes the default currency and synchronizes the platform
 * currency display settings. This is best-effort recovery,
 * not a cross-collection MongoDB transaction.
 */
export async function setDefaultCurrency(
    currencyId: string,
) {
    ensureObjectId(currencyId);

    const target = await Currency.findById(currencyId);

    if (!target) {
        throw ApiError.notFound("Currency not found.");
    }

    if (target.status !== "ACTIVE") {
        throw ApiError.badRequest(
            "Only an active currency can be set as default.",
        );
    }

    if (target.isDefault) {
        // Repair settings if the registry and settings drifted.
        await Settings.findOneAndUpdate(
            { category: "currency" },
            {
                $set: {
                    "values.defaultCurrency": target.code,
                    "values.displaySymbol": target.symbol,
                    "values.decimalPlaces": target.decimalPlaces,
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
        return target;
    }

    const previous = await Currency.findOne({
        isDefault: true,
    });

    await Currency.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } },
    );

    try {
        target.isDefault = true;
        await target.save();

        await Settings.findOneAndUpdate(
            { category: "currency" },
            {
                $set: {
                    "values.defaultCurrency": target.code,
                    "values.displaySymbol": target.symbol,
                    "values.decimalPlaces": target.decimalPlaces,
                },
            },
            { upsert: true, new: true, runValidators: true },
        );

        return target;
    } catch (error) {
        // Best-effort recovery if the settings write fails.
        try {
            await Currency.updateOne(
                { _id: target._id },
                { $set: { isDefault: false } },
            );

            if (previous) {
                await Currency.updateOne(
                    { _id: previous._id },
                    { $set: { isDefault: true } },
                );
            }
        } catch {
            // Preserve the original error for the error handler.
        }

        throw error;
    }
}

export async function getDefaultCurrency() {
    const currency = await Currency.findOne({
        isDefault: true,
        status: "ACTIVE",
    }).lean();

    if (currency) {
        return currency;
    }

    // Settings currently use BDT as the platform default.
    // This fallback reports BDT only if it exists and is active;
    // it does not create or modify registry records.
    const bdt = await Currency.findOne({
        code: DEFAULT_CURRENCY_CODE,
        status: "ACTIVE",
    }).lean();

    if (bdt) {
        return bdt;
    }

    throw ApiError.notFound(
        "No active default currency is configured. Register BDT or configure a default currency.",
    );
}
