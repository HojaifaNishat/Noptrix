import type { RequestHandler } from "express";
import { faqIdSchema } from "./faq.validator";
import {
  listFaqCategories,
  listAdminFaqCategories,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  listPublicFaqs,
  getPublicFaq,
  listAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  setFaqPublished,
} from "./faq.service";

export const listFaqCategoriesController: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const data = await listFaqCategories();
    res.status(200).json({
      success: true,
      message: "FAQ categories retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminFaqCategoriesController: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const data = await listAdminFaqCategories();
    res.status(200).json({
      success: true,
      message: "Admin FAQ categories retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createFaqCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const data = await createFaqCategory(req.body);
    res.status(201).json({
      success: true,
      message: "FAQ category created.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaqCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = faqIdSchema.parse(req.params);
    const data = await updateFaqCategory(id, req.body);
    res.status(200).json({
      success: true,
      message: "FAQ category updated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFaqCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = faqIdSchema.parse(req.params);
    const data = await deleteFaqCategory(id);
    res.status(200).json({
      success: true,
      message: "FAQ category deleted.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const listFaqsController: RequestHandler = async (req, res, next) => {
  try {
    const result = await listPublicFaqs(req.query);
    res.status(200).json({
      success: true,
      message: "FAQs retrieved.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFaqController: RequestHandler = async (req, res, next) => {
  try {
    const { id } = faqIdSchema.parse(req.params);
    const data = await getPublicFaq(id);
    res.status(200).json({
      success: true,
      message: "FAQ retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminFaqsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await listAdminFaqs(req.query);
    res.status(200).json({
      success: true,
      message: "Admin FAQs retrieved.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const createFaqController: RequestHandler = async (req, res, next) => {
  try {
    const data = await createFaq(req.body);
    res.status(201).json({
      success: true,
      message: "FAQ created.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaqController: RequestHandler = async (req, res, next) => {
  try {
    const { id } = faqIdSchema.parse(req.params);
    const data = await updateFaq(id, req.body);
    res.status(200).json({
      success: true,
      message: "FAQ updated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFaqController: RequestHandler = async (req, res, next) => {
  try {
    const { id } = faqIdSchema.parse(req.params);
    const data = await deleteFaq(id);
    res.status(200).json({
      success: true,
      message: "FAQ deleted.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const publishFaqController: RequestHandler = async (req, res, next) => {
  try {
    const { id } = faqIdSchema.parse(req.params);
    const data = await setFaqPublished(id, req.body);
    res.status(200).json({
      success: true,
      message: "FAQ publication status updated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
