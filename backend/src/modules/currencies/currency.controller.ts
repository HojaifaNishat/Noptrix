import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    createCurrency,
    getCurrencyById,
    getDefaultCurrency,
    listCurrencies,
    setDefaultCurrency,
    updateCurrency,
} from "./currency.service";

import {
    createCurrencySchema,
    currencyIdParamsSchema,
    listCurrenciesQuerySchema,
    updateCurrencySchema,
} from "./currency.validator";

function sendSuccess<T>(
    res: Response,
    message: string,
    data: T,
    statusCode = 200,
) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

export async function createCurrencyController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const input = createCurrencySchema.parse(req.body);
        const currency = await createCurrency(input);

        return sendSuccess(
            res,
            "Currency created successfully.",
            currency,
            201,
        );
    } catch (error) {
        return next(error);
    }
}

export async function listCurrenciesController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const parsedQuery = listCurrenciesQuerySchema.parse({
            status: req.query.status,
            page: req.query.page,
            limit: req.query.limit,
        });

        const isManagementPath =
            req.path === "/manage" ||
            req.path.startsWith("/manage/");

        const query = isManagementPath
            ? parsedQuery
            : { ...parsedQuery, status: "ACTIVE" as const };

        const includeInactive =
            isManagementPath &&
            req.query.includeInactive === "true";

        const result = await listCurrencies(
            query,
            includeInactive,
        );

        return sendSuccess(
            res,
            "Currencies retrieved successfully.",
            result,
        );
    } catch (error) {
        return next(error);
    }
}

export async function getCurrencyController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { currencyId } =
            currencyIdParamsSchema.parse(req.params);

        const currency = await getCurrencyById(currencyId);

        return sendSuccess(
            res,
            "Currency retrieved successfully.",
            currency,
        );
    } catch (error) {
        return next(error);
    }
}

export async function updateCurrencyController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { currencyId } =
            currencyIdParamsSchema.parse(req.params);

        const input = updateCurrencySchema.parse(req.body);

        const currency = await updateCurrency(
            currencyId,
            input,
        );

        return sendSuccess(
            res,
            "Currency updated successfully.",
            currency,
        );
    } catch (error) {
        return next(error);
    }
}

export async function setDefaultCurrencyController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { currencyId } =
            currencyIdParamsSchema.parse(req.params);

        const currency = await setDefaultCurrency(currencyId);

        return sendSuccess(
            res,
            "Default currency updated successfully.",
            currency,
        );
    } catch (error) {
        return next(error);
    }
}

export async function getDefaultCurrencyController(
    _req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const currency = await getDefaultCurrency();

        return sendSuccess(
            res,
            "Default currency retrieved successfully.",
            currency,
        );
    } catch (error) {
        return next(error);
    }
}
