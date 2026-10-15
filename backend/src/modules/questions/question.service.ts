import {
    Types,
} from "mongoose";

import {
    Question,
    type QuestionStatus,
} from "./question.model";

export class QuestionServiceError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(
        message: string,
        statusCode = 400,
        code = "QUESTION_ERROR",
    ) {
        super(message);
        this.name = "QuestionServiceError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

const toObjectId = (
    value: string,
    fieldName: string,
): Types.ObjectId => {
    if (!Types.ObjectId.isValid(value)) {
        throw new QuestionServiceError(
            `Invalid ${fieldName}.`,
            400,
            "INVALID_ID",
        );
    }

    return new Types.ObjectId(value);
};

const assertText = (
    value: string,
    fieldName: string,
    min: number,
    max: number,
): string => {
    const normalized = value.trim();

    if (
        normalized.length < min ||
        normalized.length > max
    ) {
        throw new QuestionServiceError(
            `${fieldName} must contain ${min}-${max} characters.`,
            400,
            "VALIDATION_ERROR",
        );
    }

    return normalized;
};

export interface CreateQuestionInput {
    customerId: string;
    productId: string;
    question: string;
}

export interface AnswerQuestionInput {
    questionId: string;
    answer: string;
    answeredBy: string;
    answeredByRole: "ADMIN" | "SELLER";
}

export interface ListQuestionsInput {
    page?: number;
    limit?: number;
    status?: QuestionStatus;
    productId?: string;
    customerId?: string;
}

interface PublicQuestionFilter {
    productId: Types.ObjectId;
    status: {
        $in: ("APPROVED" | "ANSWERED")[];
    };
}

interface AdminQuestionFilter {
    status?: QuestionStatus;
    productId?: Types.ObjectId;
    customerId?: Types.ObjectId;
}

const pagination = (
    page = 1,
    limit = 20,
) => {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(
        100,
        Math.max(1, Math.floor(limit)),
    );

    return {
        page: safePage,
        limit: safeLimit,
        skip: (safePage - 1) * safeLimit,
    };
};

export const createQuestion = async (
    input: CreateQuestionInput,
) => {
    const customerId = toObjectId(
        input.customerId,
        "customer ID",
    );

    const productId = toObjectId(
        input.productId,
        "product ID",
    );

    const question = assertText(
        input.question,
        "Question",
        5,
        3000,
    );

    return Question.create({
        customerId,
        productId,
        question,
        status: "PENDING",
    });
};

export const getPublicProductQuestions = async (
    productId: string,
    page = 1,
    limit = 20,
) => {
    const productObjectId = toObjectId(
        productId,
        "product ID",
    );

    const paging = pagination(page, limit);

    const filter: PublicQuestionFilter = {
        productId: productObjectId,
        status: {
            $in: ["APPROVED", "ANSWERED"],
        },
    };

    const [items, total] = await Promise.all([
        Question.find(filter)
            .select(
                "productId question status answer createdAt updatedAt",
            )
            .sort({ createdAt: -1 })
            .skip(paging.skip)
            .limit(paging.limit)
            .lean(),

        Question.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page: paging.page,
            limit: paging.limit,
            total,
            totalPages: Math.ceil(total / paging.limit),
        },
    };
};

export const getCustomerQuestions = async (
    customerId: string,
    page = 1,
    limit = 20,
) => {
    const customerObjectId = toObjectId(
        customerId,
        "customer ID",
    );

    const paging = pagination(page, limit);

    const filter = {
        customerId: customerObjectId,
    };

    const [items, total] = await Promise.all([
        Question.find(filter)
            .sort({ createdAt: -1 })
            .skip(paging.skip)
            .limit(paging.limit)
            .lean(),

        Question.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page: paging.page,
            limit: paging.limit,
            total,
            totalPages: Math.ceil(total / paging.limit),
        },
    };
};

export const getAdminQuestions = async (
    input: ListQuestionsInput = {},
) => {
    const paging = pagination(input.page, input.limit);

    const filter: AdminQuestionFilter = {};

    if (input.status) {
        filter.status = input.status;
    }

    if (input.productId) {
        filter.productId = toObjectId(
            input.productId,
            "product ID",
        );
    }

    if (input.customerId) {
        filter.customerId = toObjectId(
            input.customerId,
            "customer ID",
        );
    }

    const [items, total] = await Promise.all([
        Question.find(filter)
            .sort({ createdAt: -1 })
            .skip(paging.skip)
            .limit(paging.limit)
            .lean(),

        Question.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page: paging.page,
            limit: paging.limit,
            total,
            totalPages: Math.ceil(total / paging.limit),
        },
    };
};

export const answerQuestion = async (
    input: AnswerQuestionInput,
) => {
    const questionId = toObjectId(
        input.questionId,
        "question ID",
    );

    const answeredBy = toObjectId(
        input.answeredBy,
        "answering account ID",
    );

    const answer = assertText(
        input.answer,
        "Answer",
        2,
        10000,
    );

    const question = await Question.findById(questionId);

    if (!question) {
        throw new QuestionServiceError(
            "Question not found.",
            404,
            "QUESTION_NOT_FOUND",
        );
    }

    if (question.status === "REJECTED") {
        throw new QuestionServiceError(
            "A rejected question cannot be answered.",
            409,
            "QUESTION_REJECTED",
        );
    }

    question.answer = {
        answer,
        answeredBy,
        answeredByRole: input.answeredByRole,
        answeredAt: new Date(),
    };

    question.status = "ANSWERED";

    await question.save();

    return question;
};

export const moderateQuestion = async (
    questionId: string,
    adminId: string,
    status: "APPROVED" | "REJECTED",
    reason?: string,
) => {
    const id = toObjectId(questionId, "question ID");
    const moderatorId = toObjectId(adminId, "admin ID");

    const normalizedReason = reason?.trim();

    if (
        status === "REJECTED" &&
        (!normalizedReason || normalizedReason.length < 3)
    ) {
        throw new QuestionServiceError(
            "A rejection reason of at least 3 characters is required.",
            400,
            "REJECTION_REASON_REQUIRED",
        );
    }

    const question = await Question.findById(id);

    if (!question) {
        throw new QuestionServiceError(
            "Question not found.",
            404,
            "QUESTION_NOT_FOUND",
        );
    }

    question.status = status;
    question.moderatedBy = moderatorId;
    question.moderatedAt = new Date();
    question.moderationReason =
        status === "REJECTED"
            ? normalizedReason
            : undefined;

    await question.save();

    return question;
};

export const deleteCustomerQuestion = async (
    questionId: string,
    customerId: string,
) => {
    const id = toObjectId(questionId, "question ID");
    const ownerId = toObjectId(customerId, "customer ID");

    const question = await Question.findOne({
        _id: id,
        customerId: ownerId,
    });

    if (!question) {
        throw new QuestionServiceError(
            "Question not found.",
            404,
            "QUESTION_NOT_FOUND",
        );
    }

    if (question.status === "ANSWERED") {
        throw new QuestionServiceError(
            "Answered questions cannot be deleted by the customer.",
            409,
            "QUESTION_ALREADY_ANSWERED",
        );
    }

    await question.deleteOne();

    return { deleted: true };
};
