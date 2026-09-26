import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const trackingStatuses = [
    "PENDING",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
] as const;

const trackingEventTypes = [
    "CREATED",
    "ASSIGNED",
    "PICKED_UP",
    "LOCATION_UPDATED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
] as const;

/*
|--------------------------------------------------------------------------
| Common Schemas
|--------------------------------------------------------------------------
*/

const objectIdSchema =
    z.string()
        .trim()
        .regex(
            /^[a-f\d]{24}$/i,
            "Invalid ObjectId.",
        );

const latitudeSchema =
    z.number()
        .min(-90)
        .max(90);

const longitudeSchema =
    z.number()
        .min(-180)
        .max(180);

/*
|--------------------------------------------------------------------------
| Create Tracking
|--------------------------------------------------------------------------
*/

export const createTrackingSchema =
    z.object({
        orderId:
            objectIdSchema,

        riderId:
            objectIdSchema
                .optional(),

        status:
            z.enum(
                trackingStatuses,
            )
                .optional(),

        currentLatitude:
            latitudeSchema
                .optional(),

        currentLongitude:
            longitudeSchema
                .optional(),

        currentAddress:
            z.string()
                .trim()
                .max(500)
                .optional(),

        estimatedDeliveryAt:
            z.coerce
                .date()
                .optional(),

        notes:
            z.string()
                .trim()
                .max(2000)
                .optional(),
    });

/*
|--------------------------------------------------------------------------
| Update Tracking
|--------------------------------------------------------------------------
*/

export const updateTrackingSchema =
    z.object({
        riderId:
            objectIdSchema
                .optional(),

        currentLatitude:
            latitudeSchema
                .optional(),

        currentLongitude:
            longitudeSchema
                .optional(),

        currentAddress:
            z.string()
                .trim()
                .max(500)
                .optional(),

        estimatedDeliveryAt:
            z.coerce
                .date()
                .optional(),

        notes:
            z.string()
                .trim()
                .max(2000)
                .optional(),
    })
    .refine(
        (value) =>
            Object.keys(value).length > 0,
        {
            message:
                "At least one field is required.",
        },
    );

/*
|--------------------------------------------------------------------------
| Update Status
|--------------------------------------------------------------------------
*/

export const updateTrackingStatusSchema =
    z.object({
        status:
            z.enum(
                trackingStatuses,
            ),

        reason:
            z.string()
                .trim()
                .max(1000)
                .optional(),

        notes:
            z.string()
                .trim()
                .max(2000)
                .optional(),
    });

/*
|--------------------------------------------------------------------------
| Location Update
|--------------------------------------------------------------------------
*/

export const updateTrackingLocationSchema =
    z.object({
        latitude:
            latitudeSchema,

        longitude:
            longitudeSchema,

        address:
            z.string()
                .trim()
                .max(500)
                .optional(),

        message:
            z.string()
                .trim()
                .max(500)
                .optional(),
    });

/*
|--------------------------------------------------------------------------
| Tracking ID
|--------------------------------------------------------------------------
*/

export const trackingIdParamSchema =
    z.object({
        trackingId:
            objectIdSchema,
    });

/*
|--------------------------------------------------------------------------
| Order ID
|--------------------------------------------------------------------------
*/

export const trackingOrderIdParamSchema =
    z.object({
        orderId:
            objectIdSchema,
    });

/*
|--------------------------------------------------------------------------
| Tracking Query
|--------------------------------------------------------------------------
*/

export const trackingQuerySchema =
    z.object({
        page:
            z.coerce
                .number()
                .int()
                .min(1)
                .default(1),

        limit:
            z.coerce
                .number()
                .int()
                .min(1)
                .max(100)
                .default(20),

        status:
            z.enum(
                trackingStatuses,
            )
                .optional(),

        riderId:
            objectIdSchema
                .optional(),

        orderId:
            objectIdSchema
                .optional(),

        search:
            z.string()
                .trim()
                .max(100)
                .optional(),
    });

/*
|--------------------------------------------------------------------------
| Event Query
|--------------------------------------------------------------------------
*/

export const trackingEventQuerySchema =
    z.object({
        page:
            z.coerce
                .number()
                .int()
                .min(1)
                .default(1),

        limit:
            z.coerce
                .number()
                .int()
                .min(1)
                .max(100)
                .default(50),

        type:
            z.enum(
                trackingEventTypes,
            )
                .optional(),

        riderId:
            objectIdSchema
                .optional(),

        orderId:
            objectIdSchema
                .optional(),
    });

/*
|--------------------------------------------------------------------------
| Inferred Types
|--------------------------------------------------------------------------
*/

export type CreateTrackingInput =
    z.infer<
        typeof createTrackingSchema
    >;

export type UpdateTrackingInput =
    z.infer<
        typeof updateTrackingSchema
    >;

export type UpdateTrackingStatusInput =
    z.infer<
        typeof updateTrackingStatusSchema
    >;

export type UpdateTrackingLocationInput =
    z.infer<
        typeof updateTrackingLocationSchema
    >;

export type TrackingIdParam =
    z.infer<
        typeof trackingIdParamSchema
    >;

export type TrackingOrderIdParam =
    z.infer<
        typeof trackingOrderIdParamSchema
    >;

export type TrackingQueryInput =
    z.infer<
        typeof trackingQuerySchema
    >;

export type TrackingEventQueryInput =
    z.infer<
        typeof trackingEventQuerySchema
    >;