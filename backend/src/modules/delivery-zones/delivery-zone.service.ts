import { Types } from "mongoose";

import { DeliveryZone } from "./delivery-zone.model";
import type { IDeliveryZone, DeliveryZoneStatus } from "./delivery-zone.types";

export class DeliveryZoneServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "DeliveryZoneServiceError";
  }
}

export class DeliveryZoneService {
  static async create(
    input: Omit<
      IDeliveryZone,
      "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >,
    actorId?: string,
  ) {
    const existing = await DeliveryZone.findOne({
      slug: input.slug,
    });

    if (existing) {
      throw new DeliveryZoneServiceError(
        "A delivery zone with this slug already exists",
        409,
      );
    }

    return DeliveryZone.create({
      ...input,
      createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
      updatedBy: actorId ? new Types.ObjectId(actorId) : undefined,
    });
  }

  static async getById(id: string) {
    const zone = await DeliveryZone.findById(id);

    if (!zone) {
      throw new DeliveryZoneServiceError("Delivery zone not found", 404);
    }

    return zone;
  }

  static async getBySlug(slug: string) {
    const zone = await DeliveryZone.findOne({
      slug: slug.toLowerCase(),
    });

    if (!zone) {
      throw new DeliveryZoneServiceError("Delivery zone not found", 404);
    }

    return zone;
  }

  static async update(
    id: string,
    input: Partial<IDeliveryZone>,
    actorId?: string,
  ) {
    const zone = await DeliveryZone.findById(id);

    if (!zone) {
      throw new DeliveryZoneServiceError("Delivery zone not found", 404);
    }

    if (input.slug && input.slug !== zone.slug) {
      const duplicate = await DeliveryZone.findOne({
        slug: input.slug,
        _id: { $ne: zone._id },
      });

      if (duplicate) {
        throw new DeliveryZoneServiceError(
          "A delivery zone with this slug already exists",
          409,
        );
      }
    }

    const protectedFields = ["createdAt", "updatedAt", "createdBy", "_id"];

    for (const key of protectedFields) {
      delete (input as Record<string, unknown>)[key];
    }

    zone.set(input);

    if (actorId) {
      zone.updatedBy = new Types.ObjectId(actorId);
    }

    try {
      await zone.save();
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new DeliveryZoneServiceError(
          "A delivery zone with this slug already exists",
          409,
        );
      }

      throw error;
    }

    return zone;
  }

  static async setStatus(
    id: string,
    status: DeliveryZoneStatus,
    actorId?: string,
  ) {
    return this.update(id, { status }, actorId);
  }

  static async remove(id: string) {
    const zone = await DeliveryZone.findByIdAndDelete(id);

    if (!zone) {
      throw new DeliveryZoneServiceError("Delivery zone not found", 404);
    }

    return zone;
  }

  static async list(query: {
    page: number;
    limit: number;
    city?: string;
    country?: string;
    status?: DeliveryZoneStatus;
    search?: string;
    sort: "newest" | "oldest" | "priority";
  }) {
    const filter: Record<string, unknown> = {};

    if (query.city) {
      filter.city = {
        $regex: query.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (query.country) {
      filter.country = query.country.toUpperCase();
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { slug: { $regex: escaped, $options: "i" } },
        { city: { $regex: escaped, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> =
      query.sort === "oldest"
        ? { createdAt: 1 }
        : query.sort === "priority"
          ? { priority: -1, createdAt: -1 }
          : { createdAt: -1 };

    const [items, total] = await Promise.all([
      DeliveryZone.find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),

      DeliveryZone.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Resolve an active delivery zone by postal code, polygon or city.
   * If multiple zones match, higher priority wins.
   */
  static async checkAvailability(input: {
    city: string;
    country: string;
    postalCode?: string;
    longitude?: number;
    latitude?: number;
    orderAmount: number;
    paymentMethod: "cod" | "online";
  }) {
    const baseFilter = {
      status: "active" as const,
      country: input.country.toUpperCase(),
      city: {
        $regex: `^${input.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    };

    let candidates: Array<IDeliveryZone & { _id: Types.ObjectId }> = [];

    if (input.longitude !== undefined && input.latitude !== undefined) {
      candidates = await DeliveryZone.find({
        status: "active" as const,
        country: input.country.toUpperCase(),
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [input.longitude, input.latitude],
            },
          },
        },
      })
        .sort({ priority: -1 })
        .lean();
    }

    if (candidates.length === 0 && input.postalCode) {
      candidates = await DeliveryZone.find({
        ...baseFilter,
        postalCodes: input.postalCode,
      })
        .sort({ priority: -1 })
        .lean();
    }

    if (candidates.length === 0) {
      candidates = await DeliveryZone.find(baseFilter)
        .sort({ priority: -1 })
        .lean();
    }

    const zone = candidates[0];

    if (!zone) {
      return {
        available: false,
        reason: "No delivery zone found for this address",
      };
    }

    if (input.orderAmount < zone.minimumOrderAmount) {
      return {
        available: false,
        reason: "Order amount is below the minimum for this zone",
        zone: {
          id: zone._id,
          name: zone.name,
          slug: zone.slug,
        },
        minimumOrderAmount: zone.minimumOrderAmount,
      };
    }

    if (input.paymentMethod === "cod" && !zone.supportsCOD) {
      return {
        available: false,
        reason: "Cash on delivery is not supported in this zone",
        zone: {
          id: zone._id,
          name: zone.name,
          slug: zone.slug,
        },
      };
    }

    const freeDelivery =
      zone.freeDeliveryThreshold !== undefined &&
      input.orderAmount >= zone.freeDeliveryThreshold;

    return {
      available: true,
      zone: {
        id: zone._id,
        name: zone.name,
        slug: zone.slug,
        city: zone.city,
        country: zone.country,
      },
      deliveryFee: freeDelivery ? 0 : zone.deliveryFee,
      currency: "BDT",
      freeDelivery,
      estimatedDelivery: {
        minDays: zone.estimatedDeliveryMinDays,
        maxDays: zone.estimatedDeliveryMaxDays,
      },
      supportsCOD: zone.supportsCOD,
    };
  }
}
