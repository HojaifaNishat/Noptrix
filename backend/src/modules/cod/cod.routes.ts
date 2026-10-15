import { Router } from "express";

import {
    getMyCodRecordById,
    getMyCodRecords,
} from "./cod.controller";

import {
    codRecordIdParamsSchema,
    listMyCodRecordsQuerySchema,
} from "./cod.validator";

import {
    userAuth,
    requireUser,
} from "../../middlewares/userAuth.middleware";

import {
    validateRequest,
} from "../../middlewares/validation.middleware";

const router = Router();

router.use(userAuth, requireUser);

router.get(
    "/my",
    validateRequest({
        query: listMyCodRecordsQuerySchema,
    }),
    getMyCodRecords,
);

router.get(
    "/my/:recordId",
    validateRequest({
        params: codRecordIdParamsSchema,
    }),
    getMyCodRecordById,
);

export default router;
