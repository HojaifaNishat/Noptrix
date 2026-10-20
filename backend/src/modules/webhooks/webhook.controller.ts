import type {
    Request,
    Response,
    NextFunction,
} from "express";

import { ApiError } from "../../utils/ApiError";
import {
    processGeneralWebhook,
    processSslCommerzIpn,
} from "./webhook.service";

type RequestWithRawBody = Request & {
    rawBody?: Buffer;
};

function getSingleHeader(
    req: Request,
    names: string[],
): string | undefined {
    for (const name of names) {
        const value = req.headers[name];

        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
}

export async function sslCommerzIpnController(
    req: RequestWithRawBody,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const result = await processSslCommerzIpn(req.body);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function generalWebhookController(
    req: RequestWithRawBody,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.rawBody) {
            throw ApiError.badRequest(
                "Raw request body is unavailable. Configure express.json verify callback.",
            );
        }

        const provider = String(req.params.provider ?? "")
            .trim()
            .toLowerCase();

        const signature = getSingleHeader(req, [
            "x-webhook-signature",
            "x-payment-signature",
            "x-signature",
        ]);

        const result = await processGeneralWebhook({
            provider,
            rawBody: req.rawBody,
            signature,
            payload: req.body,
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}
