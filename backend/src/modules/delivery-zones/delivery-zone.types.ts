import type { Types } from "mongoose";

export const DELIVERY_ZONE_STATUSES = ["active", "inactive"] as const;

export type DeliveryZoneStatus = (typeof DELIVERY_ZONE_STATUSES)[number];

export interface IDeliveryZone {
  name: string;
  slug: string;
  description?: string;

  country: string;
  state?: string;
  city: string;
  postalCodes: string[];

  // Optional GeoJSON polygon coordinates: [longitude, latitude]
  boundary?: {
    type: "Polygon";
    coordinates: number[][][];
  };

  deliveryFee: number;
  freeDeliveryThreshold?: number;
  minimumOrderAmount: number;

  estimatedDeliveryMinDays: number;
  estimatedDeliveryMaxDays: number;

  supportsCOD: boolean;
  priority: number;
  status: DeliveryZoneStatus;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
