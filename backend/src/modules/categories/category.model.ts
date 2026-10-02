import {
    Schema,
    Types,
    model,
    type Model,
    type HydratedDocument,
} from "mongoose";

import {
    CATEGORY_STATUSES,
    type CategorySeo,
    type CategoryStatus,
    type CategoryImage,
} from "./category.types";

/*
|--------------------------------------------------------------------------
| Category Cloudinary Image
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Category Document
|--------------------------------------------------------------------------
*/

export interface ICategory {
    name: string;
    slug: string;

    description?: string;

    image?: CategoryImage;

    status: CategoryStatus;

    isFeatured: boolean;
    sortOrder: number;

    seo?: CategorySeo;

    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CategoryDocument =
    HydratedDocument<ICategory>;

export type CategoryModel =
    Model<ICategory>;

/*
|--------------------------------------------------------------------------
| Cloudinary Image Schema
|--------------------------------------------------------------------------
*/

const categoryImageSchema =
    new Schema<CategoryImage>(
        {
            publicId: {
                type: String,
                required: true,
                trim: true,
                maxlength: 500,
            },

            secureUrl: {
                type: String,
                required: true,
                trim: true,
                maxlength: 2048,
            },

            url: {
                type: String,
                required: true,
                trim: true,
                maxlength: 2048,
            },

            assetId: {
                type: String,
                required: true,
                trim: true,
                maxlength: 255,
            },

            version: {
                type: Number,
                required: true,
                min: 0,
            },

            resourceType: {
                type: String,
                required: true,
                trim: true,
                maxlength: 50,
            },

            format: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                maxlength: 50,
            },

            bytes: {
                type: Number,
                required: true,
                min: 0,
            },

            width: {
                type: Number,
                min: 1,
            },

            height: {
                type: Number,
                min: 1,
            },

            originalFilename: {
                type: String,
                trim: true,
                maxlength: 500,
            },
        },
        {
            _id: false,
            id: false,
        }
    );

/*
|--------------------------------------------------------------------------
| SEO Schema
|--------------------------------------------------------------------------
*/

const categorySeoSchema =
    new Schema<CategorySeo>(
        {
            title: {
                type: String,
                trim: true,
                maxlength: 70,
            },

            description: {
                type: String,
                trim: true,
                maxlength: 320,
            },

            keywords: {
                type: [String],
                default: undefined,
                validate: {
                    validator: (
                        value: readonly string[]
                    ) =>
                        value.length <= 20,

                    message:
                        "A category can have at most 20 SEO keywords.",
                },
            },
        },
        {
            _id: false,
            id: false,
        }
    );

/*
|--------------------------------------------------------------------------
| Category Schema
|--------------------------------------------------------------------------
*/

const categorySchema =
    new Schema<ICategory>(
        {
            name: {
                type: String,
                required: true,
                trim: true,
                minlength: 2,
                maxlength: 120,
            },

            slug: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                unique: true,
                minlength: 2,
                maxlength: 160,
                index: true,
            },

            description: {
                type: String,
                trim: true,
                maxlength: 2000,
            },

            image: {
                type: categoryImageSchema,
                default: undefined,
            },

            status: {
                type: String,
                enum: Object.values(
                    CATEGORY_STATUSES
                ),
                default:
                    CATEGORY_STATUSES.ACTIVE,
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
                min: 0,
                max: 1_000_000,
                index: true,
            },

            seo: {
                type: categorySeoSchema,
                default: undefined,
            },

            createdBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                index: true,
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

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

categorySchema.index({
    status: 1,
    sortOrder: 1,
    name: 1,
});

categorySchema.index({
    status: 1,
    isFeatured: 1,
    sortOrder: 1,
});

categorySchema.index({
    name: 1,
    status: 1,
});

categorySchema.index({
    "image.publicId": 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Category: CategoryModel =
    model<ICategory>(
        "Category",
        categorySchema
    );
