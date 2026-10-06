import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

import {
    IAnnouncementRecipient,
} from "./announcement.types";

/*
|--------------------------------------------------------------------------
| Document / Model Types
|--------------------------------------------------------------------------
*/

export interface IAnnouncementRecipientDocument
    extends IAnnouncementRecipient,
        Document {}

export type AnnouncementRecipientModel =
    Model<IAnnouncementRecipientDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const announcementRecipientSchema =
    new Schema<IAnnouncementRecipientDocument>(
        {
            announcementId: {
                type: Schema.Types.ObjectId,
                ref: "Announcement",
                required: [
                    true,
                    "Announcement ID is required.",
                ],
                index: true,
            },

            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "Recipient user ID is required.",
                ],
                index: true,
            },

            deliveredAt: {
                type: Date,
            },

            readAt: {
                type: Date,
            },

            dismissedAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

announcementRecipientSchema.index(
    {
        announcementId: 1,
        userId: 1,
    },
    {
        unique: true,
        name: "announcement_recipient_unique",
    },
);

announcementRecipientSchema.index(
    {
        userId: 1,
        readAt: 1,
        createdAt: -1,
    },
    {
        name: "announcement_recipient_user_read_createdAt",
    },
);

announcementRecipientSchema.index(
    {
        userId: 1,
        dismissedAt: 1,
        createdAt: -1,
    },
    {
        name: "announcement_recipient_user_dismissed_createdAt",
    },
);

announcementRecipientSchema.index(
    {
        announcementId: 1,
        readAt: 1,
    },
    {
        name: "announcement_recipient_announcement_read",
    },
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const AnnouncementRecipient =
    model<
        IAnnouncementRecipientDocument,
        AnnouncementRecipientModel
    >(
        "AnnouncementRecipient",
        announcementRecipientSchema,
    );
