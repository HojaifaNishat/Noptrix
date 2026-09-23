import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| OWNER Status
|--------------------------------------------------------------------------
*/

export const OWNER_STATUSES = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
} as const;

export type OwnerStatus =
    (typeof OWNER_STATUSES)[keyof typeof OWNER_STATUSES];

/*
|--------------------------------------------------------------------------
| OWNER Document
|--------------------------------------------------------------------------
*/

export interface IOwner extends Document {
    _id: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Identity
    |--------------------------------------------------------------------------
    */

    userId: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Fixed Highest Role
    |--------------------------------------------------------------------------
    |
    | OWNER is intentionally not editable through normal role management.
    |
    */

    role: "OWNER";

    /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
    */

    secretCodeHash: string;

    secretVerifiedAt?: Date;

    /*
    |--------------------------------------------------------------------------
    | Account Status
    |--------------------------------------------------------------------------
    */

    status: OwnerStatus;

    /*
    |--------------------------------------------------------------------------
    | Security Activity
    |--------------------------------------------------------------------------
    */

    lastLoginAt?: Date;

    lastSecretVerificationAt?: Date;

    /*
    |--------------------------------------------------------------------------
    | Audit
    |--------------------------------------------------------------------------
    */

    createdBy?: Types.ObjectId;

    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| OWNER Schema
|--------------------------------------------------------------------------
*/

const ownerSchema = new Schema<IOwner>(
    {
        /*
        |--------------------------------------------------------------------------
        | User Reference
        |--------------------------------------------------------------------------
        |
        | User collection remains the source of:
        | - name
        | - email
        | - password
        | - phone
        | - account status
        |
        |--------------------------------------------------------------------------
        */

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        /*
        |--------------------------------------------------------------------------
        | OWNER Role
        |--------------------------------------------------------------------------
        */

        role: {
            type: String,
            enum: ["OWNER"],
            default: "OWNER",
            immutable: true,
            required: true,
        },

        /*
        |--------------------------------------------------------------------------
        | Secret Code
        |--------------------------------------------------------------------------
        |
        | Never store the actual OWNER secret code.
        | Only its hash is stored.
        |
        |--------------------------------------------------------------------------
        */

        secretCodeHash: {
            type: String,
            required: true,
            select: false,
        },

        secretVerifiedAt: {
            type: Date,
        },

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        status: {
            type: String,
            enum: Object.values(OWNER_STATUSES),
            default: OWNER_STATUSES.ACTIVE,
            required: true,
            index: true,
        },

        /*
        |--------------------------------------------------------------------------
        | Security Activity
        |--------------------------------------------------------------------------
        */

        lastLoginAt: {
            type: Date,
        },

        lastSecretVerificationAt: {
            type: Date,
        },

        /*
        |--------------------------------------------------------------------------
        | Audit
        |--------------------------------------------------------------------------
        */

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

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

ownerSchema.index({
    status: 1,
    createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| OWNER Model
|--------------------------------------------------------------------------
*/

export const Owner: Model<IOwner> = model<IOwner>(
    "Owner",
    ownerSchema
);