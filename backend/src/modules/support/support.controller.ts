import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { ApiError } from "../../utils/ApiError";
import { SupportCategory } from "./support-category.model";
import { SupportFaq } from "./support-faq.model";
import {
  supportCategorySchema,
  supportFaqSchema,
  supportIdSchema,
  supportFaqListQuerySchema,
  supportFaqPublishSchema,
} from "./support.validator";

export const listSupportCategoriesController: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const categories = await SupportCategory.find({
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    res.status(200).json({
      success: true,
      message: "Support categories retrieved.",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const listSupportFaqsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = supportFaqListQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = {
      isPublished: true,
    };

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { question: { $regex: escaped, $options: "i" } },
        { answer: { $regex: escaped, $options: "i" } },
      ];
    }

    const activeCategories = await SupportCategory.find({
      isActive: true,
    })
      .distinct("_id")
      .exec();

    filter.categoryId = query.categoryId
      ? new Types.ObjectId(query.categoryId)
      : { $in: activeCategories };

    const skip = (query.page - 1) * query.limit;

    const [faqs, total] = await Promise.all([
      SupportFaq.find(filter)
        .populate({
          path: "categoryId",
          match: { isActive: true },
          select: "name slug description",
        })
        .sort({ sortOrder: 1, createdAt: -1, _id: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean()
        .exec(),
      SupportFaq.countDocuments(filter).exec(),
    ]);

    const visibleFaqs = faqs.filter((faq) => faq.categoryId);

    res.status(200).json({
      success: true,
      message: "Support FAQs retrieved.",
      data: visibleFaqs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSupportFaqController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = supportIdSchema.parse(req.params);

    const faq = await SupportFaq.findOne({
      _id: id,
      isPublished: true,
    })
      .populate({
        path: "categoryId",
        match: { isActive: true },
        select: "name slug description",
      })
      .lean()
      .exec();

    if (!faq || !faq.categoryId) {
      throw ApiError.notFound("FAQ not found.");
    }

    res.status(200).json({
      success: true,
      message: "FAQ retrieved successfully.",
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminSupportFaqsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = supportFaqListQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = {};

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { question: { $regex: escaped, $options: "i" } },
        { answer: { $regex: escaped, $options: "i" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [faqs, total] = await Promise.all([
      SupportFaq.find(filter)
        .populate("categoryId", "name slug")
        .sort({ sortOrder: 1, createdAt: -1, _id: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean()
        .exec(),
      SupportFaq.countDocuments(filter).exec(),
    ]);

    res.status(200).json({
      success: true,
      message: "Admin FAQs retrieved.",
      data: faqs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSupportCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const input = supportCategorySchema.parse(req.body);

    const generatedSlug =
      input.slug ??
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!generatedSlug) {
      throw ApiError.badRequest(
        "Provide an English URL slug for this category name.",
      );
    }

    const category = await SupportCategory.create({
      ...input,
      slug: generatedSlug,
    });

    res.status(201).json({
      success: true,
      message: "Support category created.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupportCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = supportIdSchema.parse(req.params);
    const input = supportCategorySchema.partial().parse(req.body);

    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest("Provide at least one field to update.");
    }

    const update: Record<string, unknown> = { ...input };

    if (input.name !== undefined && input.slug === undefined) {
      const generatedSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!generatedSlug) {
        throw ApiError.badRequest(
          "Provide an English URL slug for this category name.",
        );
      }

      update.slug = generatedSlug;
    }

    if (input.slug !== undefined && !input.slug) {
      throw ApiError.badRequest("Category slug cannot be empty.");
    }

    const category = await SupportCategory.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).exec();

    if (!category) {
      throw ApiError.notFound("Support category not found.");
    }

    res.status(200).json({
      success: true,
      message: "Support category updated.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupportCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = supportIdSchema.parse(req.params);
    const category = await SupportCategory.findById(id).exec();

    if (!category) {
      throw ApiError.notFound("Support category not found.");
    }

    const faqCount = await SupportFaq.countDocuments({
      categoryId: category._id,
    }).exec();

    if (faqCount > 0) {
      throw ApiError.conflict(
        "Cannot delete a category that still contains FAQs. Move or delete its FAQs first.",
      );
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Support category deleted.",
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

export const createSupportFaqController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const input = supportFaqSchema.parse(req.body);

    const category = await SupportCategory.findOne({
      _id: input.categoryId,
      isActive: true,
    }).exec();

    if (!category) {
      throw ApiError.badRequest("An active support category is required.");
    }

    const faq = await SupportFaq.create({
      ...input,
      categoryId: new Types.ObjectId(input.categoryId),
    });

    res.status(201).json({
      success: true,
      message: "Support FAQ created.",
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupportFaqController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = supportIdSchema.parse(req.params);
    const input = supportFaqSchema.partial().parse(req.body);

    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest("Provide at least one field to update.");
    }

    const update: Record<string, unknown> = { ...input };

    if (input.categoryId) {
      const category = await SupportCategory.findOne({
        _id: input.categoryId,
        isActive: true,
      }).exec();

      if (!category) {
        throw ApiError.badRequest("An active support category is required.");
      }

      update.categoryId = new Types.ObjectId(input.categoryId);
    }

    const faq = await SupportFaq.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    )
      .populate("categoryId", "name slug")
      .exec();

    if (!faq) {
      throw ApiError.notFound("Support FAQ not found.");
    }

    res.status(200).json({
      success: true,
      message: "Support FAQ updated.",
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupportFaqController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = supportIdSchema.parse(req.params);
    const faq = await SupportFaq.findByIdAndDelete(id).exec();

    if (!faq) {
      throw ApiError.notFound("Support FAQ not found.");
    }

    res.status(200).json({
      success: true,
      message: "Support FAQ deleted.",
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupportFaqPublishController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = supportIdSchema.parse(req.params);
    const input = supportFaqPublishSchema.parse(req.body);

    const faqBeforeUpdate = await SupportFaq.findById(id)
      .select("categoryId")
      .lean()
      .exec();

    if (!faqBeforeUpdate) {
      throw ApiError.notFound("Support FAQ not found.");
    }

    if (input.isPublished) {
      const category = await SupportCategory.findOne({
        _id: faqBeforeUpdate.categoryId,
        isActive: true,
      })
        .lean()
        .exec();

      if (!category) {
        throw ApiError.badRequest(
          "FAQ cannot be published while its category is inactive.",
        );
      }
    }

    const faq = await SupportFaq.findByIdAndUpdate(
      id,
      { $set: { isPublished: input.isPublished } },
      { new: true, runValidators: true },
    )
      .populate("categoryId", "name slug")
      .lean()
      .exec();

    if (!faq) {
      throw ApiError.notFound("Support FAQ not found.");
    }

    res.status(200).json({
      success: true,
      message: input.isPublished
        ? "FAQ published successfully."
        : "FAQ unpublished successfully.",
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};
