import {
    Schema,
    Types,
    model,
    type Model,
    type HydratedDocument,
} from "mongoose";

import {
    SUBCATEGORY_STATUSES,
    type SubcategoryImage,
    type SubcategorySeo,
    type SubcategoryStatus,
} from "./subcategory.types";

export interface ISubcategory {
    categoryId: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    image?: SubcategoryImage;
    status: SubcategoryStatus;
    isFeatured: boolean;
    sortOrder: number;
    seo?: SubcategorySeo;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export type SubcategoryDocument =
    HydratedDocument<ISubcategory>;

export type SubcategoryModel =
    Model<ISubcategory>;

const subcategorySchema =
    new Schema<
        ISubcategory,
        SubcategoryModel
    >(
        {
            categoryId: {
                type: Schema.Types.ObjectId,
                ref: "Category",
                required: true,
                index: true,
            },

            name: {
                type: String,
                required: true,
                trim: true,
                minlength: 2,
                maxlength: 160,
            },

            slug: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                minlength: 2,
                maxlength: 160,
            },

            description: {
                type: String,
                trim: true,
                maxlength: 5000,
            },

            image: {
                publicId: String,
                secureUrl: String,
                url: String,
                assetId: String,
                version: Number,
                resourceType: String,
                format: String,
                bytes: Number,
                width: Number,
                height: Number,
                originalFilename: String,
            },

            status: {
                type: String,
                enum: Object.values(
                    SUBCATEGORY_STATUSES
                ),
                default:
                    SUBCATEGORY_STATUSES.ACTIVE,
                required: true,
                index: true,
            },

            isFeatured: {
                type: Boolean,
                default: false,
                required: true,
                index: true,
            },

            sortOrder: {
                type: Number,
                default: 0,
                required: true,
                index: true,
            },

            seo: {
                title: {
                    type: String,
                    trim: true,
                    maxlength: 180,
                },

                description: {
                    type: String,
                    trim: true,
                    maxlength: 320,
                },

                keywords: {
                    type: [String],
                    default: undefined,
                },
            },

            createdBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },

            updatedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

subcategorySchema.index(
    {
        categoryId: 1,
        slug: 1,
    },
    {
        unique: true,
    }
);

subcategorySchema.index({
    categoryId: 1,
    status: 1,
    sortOrder: 1,
});

subcategorySchema.index({
    categoryId: 1,
    isFeatured: 1,
    sortOrder: 1,
});

subcategorySchema.index({
    name: 1,
    status: 1,
});

subcategorySchema.index({
    slug: 1,
    status: 1,
});

subcategorySchema.index({
    createdAt: -1,
});

export const Subcategory =
    model<
        ISubcategory,
        SubcategoryModel
    >(
        "Subcategory",
        subcategorySchema
    );
