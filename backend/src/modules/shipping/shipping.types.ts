import type { Types } from "mongoose";

export const SHIPPING_STATUSES = [
  "created",
  "ready_to_ship",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
  "cancelled",
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export interface IShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface ITrackingEvent {
  eventId: string;
  status: ShippingStatus;
  description: string;
  location?: string;
  occurredAt: Date;
  createdAt?: Date;
}

export interface IShipping {
  shipmentNumber: string;
  trackingNumber: string;
  orderId: Types.ObjectId;
  customerId?: Types.ObjectId;
  riderId?: Types.ObjectId;
  provider: string;
  providerShipmentId?: string;
  status: ShippingStatus;
  address: IShippingAddress;
  shippingFee: number;
  currency: string;
  estimatedDeliveryAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  failureReason?: string;
  trackingEvents: ITrackingEvent[];
  idempotencyKey?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
