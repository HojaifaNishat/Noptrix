import type { Request, Response, NextFunction, RequestHandler } from "express";

import {
  answerQuestion,
  createQuestion,
  deleteCustomerQuestion,
  getAdminQuestions,
  getCustomerQuestions,
  getPublicProductQuestions,
  moderateQuestion,
  QuestionServiceError,
} from "./question.service";

const asyncHandler = (
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
};

const sendSuccess = (res: Response, data: unknown, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const getParam = (req: Request, key: string): string => {
  const value = req.params[key];

  if (typeof value !== "string" || !value) {
    throw new QuestionServiceError(
      `Missing or invalid route parameter: ${key}.`,
      400,
      "MISSING_PARAMETER",
    );
  }

  return value;
};

const getPage = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const getBodyString = (body: unknown, key: string): string => {
  if (typeof body !== "object" || body === null || !(key in body)) {
    throw new QuestionServiceError(
      `${key} is required.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  const value = (body as Record<string, unknown>)[key];

  if (typeof value !== "string") {
    throw new QuestionServiceError(
      `${key} must be a string.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return value;
};

const requireCustomerId = (req: Request): string => {
  const customerId = req.userAuth?.userId;

  if (!customerId) {
    throw new QuestionServiceError(
      "Customer authentication is required.",
      401,
      "UNAUTHENTICATED",
    );
  }

  return customerId;
};

const requireAdmin = (req: Request) => {
  const admin = req.adminAuth;

  if (!admin?.adminId) {
    throw new QuestionServiceError(
      "Admin authentication is required.",
      401,
      "UNAUTHENTICATED",
    );
  }

  const role = admin.role?.toUpperCase();
  const isOwner = role === "OWNER";
  const canManageQuestions =
    admin.permissions.includes("questions.manage") ||
    admin.permissions.includes("*");

  if (!isOwner && !canManageQuestions) {
    throw new QuestionServiceError(
      "You do not have permission to manage questions.",
      403,
      "FORBIDDEN",
    );
  }

  return admin;
};

export const createProductQuestionController = asyncHandler(
  async (req, res) => {
    const customerId = requireCustomerId(req);

    const question = await createQuestion({
      customerId,
      productId: getBodyString(req.body, "productId"),
      question: getBodyString(req.body, "question"),
    });

    return sendSuccess(res, question, 201);
  },
);

export const getPublicProductQuestionsController = asyncHandler(
  async (req, res) => {
    const data = await getPublicProductQuestions(
      getParam(req, "productId"),
      getPage(req.query.page, 1),
      getPage(req.query.limit, 20),
    );

    return sendSuccess(res, data);
  },
);

export const getMyQuestionsController = asyncHandler(async (req, res) => {
  const customerId = requireCustomerId(req);

  const data = await getCustomerQuestions(
    customerId,
    getPage(req.query.page, 1),
    getPage(req.query.limit, 20),
  );

  return sendSuccess(res, data);
});

export const deleteMyQuestionController = asyncHandler(async (req, res) => {
  const customerId = requireCustomerId(req);

  const result = await deleteCustomerQuestion(
    getParam(req, "questionId"),
    customerId,
  );

  return sendSuccess(res, result);
});

export const getAdminQuestionsController = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const allowedStatuses = [
    "PENDING",
    "APPROVED",
    "ANSWERED",
    "REJECTED",
  ] as const;

  const rawStatus = req.query.status;
  let status: (typeof allowedStatuses)[number] | undefined;

  if (rawStatus !== undefined) {
    if (
      typeof rawStatus !== "string" ||
      !allowedStatuses.includes(rawStatus as (typeof allowedStatuses)[number])
    ) {
      throw new QuestionServiceError(
        "Invalid question status.",
        400,
        "INVALID_STATUS",
      );
    }

    status = rawStatus as (typeof allowedStatuses)[number];
  }

  const data = await getAdminQuestions({
    page: getPage(req.query.page, 1),
    limit: getPage(req.query.limit, 20),
    status,
    productId:
      typeof req.query.productId === "string" ? req.query.productId : undefined,
    customerId:
      typeof req.query.customerId === "string"
        ? req.query.customerId
        : undefined,
  });

  return sendSuccess(res, data);
});

export const adminAnswerQuestionController = asyncHandler(async (req, res) => {
  const admin = requireAdmin(req);

  const question = await answerQuestion({
    questionId: getParam(req, "questionId"),
    answer: getBodyString(req.body, "answer"),
    answeredBy: admin.adminId,
    answeredByRole: "ADMIN",
  });

  return sendSuccess(res, question);
});

export const moderateQuestionController = asyncHandler(async (req, res) => {
  const admin = requireAdmin(req);
  const rawStatus = getBodyString(req.body, "status");

  if (rawStatus !== "APPROVED" && rawStatus !== "REJECTED") {
    throw new QuestionServiceError(
      "Status must be APPROVED or REJECTED.",
      400,
      "INVALID_STATUS",
    );
  }

  const reasonValue = (req.body as Record<string, unknown>).reason;

  if (reasonValue !== undefined && typeof reasonValue !== "string") {
    throw new QuestionServiceError(
      "Reason must be a string.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const question = await moderateQuestion(
    getParam(req, "questionId"),
    admin.adminId,
    rawStatus,
    reasonValue as string | undefined,
  );

  return sendSuccess(res, question);
});

/**
 * Seller answering must remain disabled until the products module
 * can verify that the seller owns the question's product.
 *
 * Do not replace this guard with an unverified seller answer call.
 */
export const sellerAnswerQuestionController: RequestHandler = (_req, res) => {
  return res.status(503).json({
    success: false,
    code: "PRODUCT_OWNERSHIP_CHECK_UNAVAILABLE",
    message:
      "Seller answers will be enabled after product ownership verification is integrated.",
  });
};
