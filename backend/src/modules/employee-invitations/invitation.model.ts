import {
    Document,
    Model,
    Schema,
    Types,
    model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| Invitation Status
|--------------------------------------------------------------------------
*/

export const INVITATION_STATUSES = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
} as const;

export type InvitationStatus =
    typeof INVITATION_STATUSES[
        keyof typeof INVITATION_STATUSES
    ];

/*
|--------------------------------------------------------------------------
| Invitation Interface
|--------------------------------------------------------------------------
*/

export interface IInvitation {
    _id: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Recruitment Reference
    |--------------------------------------------------------------------------
    */

    applicationId: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Candidate Snapshot
    |--------------------------------------------------------------------------
    */

    email: string;
    name: string;

    /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
    */

    tokenHash: string;

    /*
    |--------------------------------------------------------------------------
    | Invitation Actor
    |--------------------------------------------------------------------------
    */

    invitedBy: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Employee Role
    |--------------------------------------------------------------------------
    |
    | The role assigned when the selected candidate becomes an employee.
    | Owner can change the employee role later.
    |
    */

    roleId: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Lifecycle
    |--------------------------------------------------------------------------
    */

    status: InvitationStatus;

    expiresAt: Date;

    /*
    |--------------------------------------------------------------------------
    | Acceptance
    |--------------------------------------------------------------------------
    */

    acceptedAt?: Date;

    acceptedUserId?: Types.ObjectId;

    acceptedEmployeeId?: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Revocation
    |--------------------------------------------------------------------------
    */

    revokedAt?: Date;

    revokedBy?: Types.ObjectId;

    /*
    |--------------------------------------------------------------------------
    | Timestamps
    |--------------------------------------------------------------------------
    */

    createdAt: Date;
    updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Document / Model Types
|--------------------------------------------------------------------------
*/

export interface IInvitationDocument
    extends IInvitation,
        Document {}

export type InvitationModel =
    Model<IInvitationDocument>;

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const invitationSchema =
    new Schema<IInvitationDocument>(
        {
            /*
            |--------------------------------------------------------------------------
            | Job Application
            |--------------------------------------------------------------------------
            */

            applicationId: {
                type: Schema.Types.ObjectId,
                ref: "JobApplication",
                required: [
                    true,
                    "Job application is required.",
                ],
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Candidate Email
            |--------------------------------------------------------------------------
            */

            email: {
                type: String,
                required: [
                    true,
                    "Invitation email is required.",
                ],
                trim: true,
                lowercase: true,
                maxlength: [
                    254,
                    "Invitation email cannot exceed 254 characters.",
                ],
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Candidate Name
            |--------------------------------------------------------------------------
            */

            name: {
                type: String,
                required: [
                    true,
                    "Invitation name is required.",
                ],
                trim: true,
                minlength: [
                    2,
                    "Invitation name must be at least 2 characters.",
                ],
                maxlength: [
                    150,
                    "Invitation name cannot exceed 150 characters.",
                ],
            },

            /*
            |--------------------------------------------------------------------------
            | Secure Invitation Token
            |--------------------------------------------------------------------------
            */

            tokenHash: {
                type: String,
                required: [
                    true,
                    "Invitation token hash is required.",
                ],
                unique: true,
                index: true,
                select: false,
            },

            /*
            |--------------------------------------------------------------------------
            | Invited By
            |--------------------------------------------------------------------------
            */

            invitedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [
                    true,
                    "Invited by user is required.",
                ],
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Employee Role
            |--------------------------------------------------------------------------
            */

            roleId: {
                type: Schema.Types.ObjectId,
                ref: "Role",
                required: [
                    true,
                    "Employee role is required.",
                ],
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            status: {
                type: String,
                enum: {
                    values: Object.values(
                        INVITATION_STATUSES,
                    ),
                    message:
                        "Invalid invitation status.",
                },
                default:
                    INVITATION_STATUSES.PENDING,
                required: true,
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Expiration
            |--------------------------------------------------------------------------
            */

            expiresAt: {
                type: Date,
                required: [
                    true,
                    "Invitation expiration date is required.",
                ],
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Acceptance
            |--------------------------------------------------------------------------
            */

            acceptedAt: {
                type: Date,
            },

            acceptedUserId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                index: true,
            },

            acceptedEmployeeId: {
                type: Schema.Types.ObjectId,
                ref: "Employee",
                index: true,
            },

            /*
            |--------------------------------------------------------------------------
            | Revocation
            |--------------------------------------------------------------------------
            */

            revokedAt: {
                type: Date,
            },

            revokedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
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

/*
 * Candidate/application history.
 */
invitationSchema.index(
    {
        applicationId: 1,
        createdAt: -1,
    },
    {
        name: "invitation_application_createdAt",
    },
);

/*
 * Invitation listing by email.
 */
invitationSchema.index(
    {
        email: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name: "invitation_email_status_createdAt",
    },
);

/*
 * Expiration worker/query optimization.
 */
invitationSchema.index(
    {
        status: 1,
        expiresAt: 1,
    },
    {
        name: "invitation_status_expiresAt",
    },
);

/*
 * Invitations created by an Owner/HR actor.
 */
invitationSchema.index(
    {
        invitedBy: 1,
        createdAt: -1,
    },
    {
        name: "invitation_invitedBy_createdAt",
    },
);

/*
 * Role-based invitation lookup.
 */
invitationSchema.index(
    {
        roleId: 1,
        status: 1,
        createdAt: -1,
    },
    {
        name: "invitation_role_status_createdAt",
    },
);

/*
 * Accepted employee lookup.
 */
invitationSchema.index(
    {
        acceptedEmployeeId: 1,
    },
    {
        name: "invitation_acceptedEmployee",
        sparse: true,
    },
);

/*
 * Accepted user lookup.
 */
invitationSchema.index(
    {
        acceptedUserId: 1,
    },
    {
        name: "invitation_acceptedUser",
        sparse: true,
    },
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

export const Invitation =
    model<IInvitationDocument, InvitationModel>(
        "Invitation",
        invitationSchema,
    );
