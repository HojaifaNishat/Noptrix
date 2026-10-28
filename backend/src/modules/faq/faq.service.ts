import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { SupportCategory } from "../support/support-category.model";
import { SupportFaq } from "./faq.model";
import {
  faqCategorySchema,
  faqSchema,
  faqListQuerySchema,
  faqPublishSchema,
} from "./faq.validator";

export async function listFaqCategories() {
  return SupportCategory.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean()
    .exec();
}

export async function listAdminFaqCategories() {
  return SupportCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean().exec();
}

export async function createFaqCategory(rawInput: unknown) {
  const input = faqCategorySchema.parse(rawInput);
  const slug =
    input.slug ??
    input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (!slug) {
    throw ApiError.badRequest("A valid category slug is required.");
  }

  const existing = await SupportCategory.findOne({ slug }).lean().exec();

  if (existing) {
    throw ApiError.badRequest("A category with this slug already exists.");
  }

  return SupportCategory.create({
    ...input,
    slug,
  });
}

export async function updateFaqCategory(id: string, rawInput: unknown) {
  const input = faqCategorySchema.partial().parse(rawInput);

  if (Object.keys(input).length === 0) {
    throw ApiError.badRequest("Provide at least one field to update.");
  }

  const update: Record<string, unknown> = { ...input };

  if (input.slug) {
    const duplicate = await SupportCategory.findOne({
      slug: input.slug,
      _id: { $ne: id },
    })
      .lean()
      .exec();

    if (duplicate) {
      throw ApiError.badRequest("A category with this slug already exists.");
    }
  }

  const category = await SupportCategory.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  ).exec();

  if (!category) {
    throw ApiError.notFound("FAQ category not found.");
  }

  return category;
}

export async function deleteFaqCategory(id: string) {
  const category = await SupportCategory.findById(id).lean().exec();

  if (!category) {
    throw ApiError.notFound("FAQ category not found.");
  }

  const linkedFaqCount = await SupportFaq.countDocuments({
    categoryId: new Types.ObjectId(id),
  }).exec();

  if (linkedFaqCount > 0) {
    throw ApiError.badRequest(
      "This category contains FAQs. Move or delete those FAQs before deleting the category.",
    );
  }

  await SupportCategory.findByIdAndDelete(id).exec();

  return { id };
}

export async function listPublicFaqs(rawQuery: unknown) {
  const query = faqListQuerySchema.parse(rawQuery);
  const filter: Record<string, unknown> = { isPublished: true };

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { question: { $regex: escaped, $options: "i" } },
      { answer: { $regex: escaped, $options: "i" } },
    ];
  }

  const activeCategories = await SupportCategory.find({ isActive: true })
    .distinct("_id")
    .exec();

  filter.categoryId = query.categoryId
    ? new Types.ObjectId(query.categoryId)
    : { $in: activeCategories };

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
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

  return {
    data: items.filter((item) => item.categoryId),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getPublicFaq(id: string) {
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

  return faq;
}

export async function listAdminFaqs(rawQuery: unknown) {
  const query = faqListQuerySchema.parse(rawQuery);
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
  const [data, total] = await Promise.all([
    SupportFaq.find(filter)
      .populate("categoryId", "name slug")
      .sort({ sortOrder: 1, createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(query.limit)
      .lean()
      .exec(),
    SupportFaq.countDocuments(filter).exec(),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function createFaq(rawInput: unknown) {
  const input = faqSchema.parse(rawInput);
  const category = await SupportCategory.findOne({
    _id: input.categoryId,
    isActive: true,
  }).exec();

  if (!category) {
    throw ApiError.badRequest("An active FAQ category is required.");
  }

  return SupportFaq.create({
    ...input,
    categoryId: new Types.ObjectId(input.categoryId),
  });
}

export async function updateFaq(id: string, rawInput: unknown) {
  const input = faqSchema.partial().parse(rawInput);

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
      throw ApiError.badRequest("An active FAQ category is required.");
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
    throw ApiError.notFound("FAQ not found.");
  }

  return faq;
}

export async function deleteFaq(id: string) {
  const faq = await SupportFaq.findByIdAndDelete(id).exec();

  if (!faq) {
    throw ApiError.notFound("FAQ not found.");
  }

  return { id };
}

export async function setFaqPublished(id: string, rawInput: unknown) {
  const input = faqPublishSchema.parse(rawInput);
  const existing = await SupportFaq.findById(id)
    .select("categoryId")
    .lean()
    .exec();

  if (!existing) {
    throw ApiError.notFound("FAQ not found.");
  }

  if (input.isPublished) {
    const category = await SupportCategory.findOne({
      _id: existing.categoryId,
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
    throw ApiError.notFound("FAQ not found.");
  }

  return faq;
}
