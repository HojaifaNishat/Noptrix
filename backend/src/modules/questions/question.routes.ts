import { Router } from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    sellerAuth,
} from "../../middlewares/sellerAuth.middleware";

import {
    adminAuth,
} from "../../middlewares/adminAuth.middleware";

import {
    validateRequest,
} from "../../middlewares/validation.middleware";

import {
    createQuestionSchema,
    productQuestionsParamsSchema,
    questionIdParamsSchema,
    myQuestionsQuerySchema,
    adminQuestionsQuerySchema,
    answerQuestionSchema,
    moderateQuestionSchema,
} from "./question.validator";

import {
    createProductQuestionController,
    getPublicProductQuestionsController,
    getMyQuestionsController,
    deleteMyQuestionController,
    getAdminQuestionsController,
    adminAnswerQuestionController,
    moderateQuestionController,
    sellerAnswerQuestionController,
} from "./question.controller";

const router = Router();

/*
|--------------------------------------------------------------------------
| Public Product Questions
|--------------------------------------------------------------------------
*/

router.get(
    "/products/:productId",
    validateRequest({
        params: productQuestionsParamsSchema.shape.params,
        query: productQuestionsParamsSchema.shape.query,
    }),
    getPublicProductQuestionsController,
);

/*
|--------------------------------------------------------------------------
| Customer Questions
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    userAuth,
    validateRequest({
        body: createQuestionSchema.shape.body,
    }),
    createProductQuestionController,
);

router.get(
    "/mine",
    userAuth,
    validateRequest({
        query: myQuestionsQuerySchema.shape.query,
    }),
    getMyQuestionsController,
);

router.delete(
    "/:questionId",
    userAuth,
    validateRequest({
        params: questionIdParamsSchema.shape.params,
    }),
    deleteMyQuestionController,
);

/*
|--------------------------------------------------------------------------
| Admin Question Management
|--------------------------------------------------------------------------
*/

router.get(
    "/admin",
    adminAuth,
    validateRequest({
        query: adminQuestionsQuerySchema.shape.query,
    }),
    getAdminQuestionsController,
);

router.post(
    "/admin/:questionId/answer",
    adminAuth,
    validateRequest({
        params: answerQuestionSchema.shape.params,
        body: answerQuestionSchema.shape.body,
    }),
    adminAnswerQuestionController,
);

router.patch(
    "/admin/:questionId/moderate",
    adminAuth,
    validateRequest({
        params: moderateQuestionSchema.shape.params,
        body: moderateQuestionSchema.shape.body,
    }),
    moderateQuestionController,
);

/*
|--------------------------------------------------------------------------
| Seller Answers
|--------------------------------------------------------------------------
|
| Seller answer submission stays guarded until product ownership
| verification is integrated with the products module.
|
*/

router.post(
    "/seller/:questionId/answer",
    sellerAuth,
    validateRequest({
        params: questionIdParamsSchema.shape.params,
        body: answerQuestionSchema.shape.body,
    }),
    sellerAnswerQuestionController,
);

export default router;
