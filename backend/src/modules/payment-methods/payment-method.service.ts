import { ApiError } from "../../utils/ApiError";

import {
  getPaymentMethodAvailability,
  getRegisteredPaymentProviders,
  getPaymentServiceHealth,
} from "../../services/payment.service";

import {
  getPaymentConfig,
  getPaymentProvider,
  isCodEnabled,
  isOnlinePaymentEnabled,
} from "../../config/payment";

import { PaymentMethodModel, PAYMENT_METHOD_IDS } from "./payment-method.model";

import type {
  PaymentMethodId,
  PublicPaymentMethod,
  PublicPaymentMethodsResponse,
} from "./payment-method.types";

const METHOD_DEFAULTS: Array<{
  methodId: PaymentMethodId;
  name: string;
  displayOrder: number;
  description: string;
}> = [
  {
    methodId: "cod",
    name: "Cash on Delivery",
    displayOrder: 1,
    description: "Pay when your order is delivered.",
  },
  {
    methodId: "online",
    name: "Online Payment",
    displayOrder: 2,
    description: "Pay using an available online payment provider.",
  },
];

let initializationPromise: Promise<void> | undefined;

function isMethodAvailable(methodId: PaymentMethodId): boolean {
  const availability = getPaymentMethodAvailability();

  if (methodId === "cod") {
    return availability.cod && isCodEnabled();
  }

  return availability.online && isOnlinePaymentEnabled();
}

/**
 * Creates default records once per process.
 * $setOnInsert preserves administrator changes on subsequent calls.
 */
export async function initializePaymentMethods(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = Promise.all(
      METHOD_DEFAULTS.map((method) =>
        PaymentMethodModel.updateOne(
          { methodId: method.methodId },
          {
            $setOnInsert: {
              ...method,
              enabled: true,
            },
          },
          { upsert: true },
        ).exec(),
      ),
    )
      .then(() => undefined)
      .catch((error: unknown) => {
        initializationPromise = undefined;
        throw error;
      });
  }

  await initializationPromise;
}

export async function getPublicPaymentMethods(): Promise<PublicPaymentMethodsResponse> {
  await initializePaymentMethods();

  const records = await PaymentMethodModel.find({
    methodId: { $in: PAYMENT_METHOD_IDS },
  })
    .select("methodId name enabled displayOrder description")
    .sort({ displayOrder: 1, methodId: 1 })
    .lean()
    .exec();

  const byId = new Map(records.map((record) => [record.methodId, record]));

  const methods: PublicPaymentMethod[] = METHOD_DEFAULTS.map((fallback) => {
    const record = byId.get(fallback.methodId);

    return {
      id: fallback.methodId,
      name: record?.name ?? fallback.name,
      enabled: Boolean(record?.enabled) && isMethodAvailable(fallback.methodId),
      displayOrder: record?.displayOrder ?? fallback.displayOrder,
      description: record?.description ?? fallback.description,
    };
  }).sort((a, b) => a.displayOrder - b.displayOrder);

  const config = getPaymentConfig();
  const health = getPaymentServiceHealth();

  return {
    methods,
    providers: getRegisteredPaymentProviders(),
    health: {
      configured: config.enableOnline ? getPaymentProvider() !== "none" : true,
      healthy: health.healthy,
    },
  };
}

export async function listPaymentMethods(includeDisabled = false) {
  await initializePaymentMethods();

  const filter = includeDisabled ? {} : { enabled: true };

  return PaymentMethodModel.find(filter)
    .select(
      "methodId name enabled displayOrder description createdAt updatedAt",
    )
    .sort({ displayOrder: 1, methodId: 1 })
    .lean()
    .exec();
}

export async function updatePaymentMethod(
  methodId: PaymentMethodId,
  input: {
    enabled: boolean;
    displayOrder?: number;
    description?: string;
  },
) {
  await initializePaymentMethods();

  if (input.enabled && !isMethodAvailable(methodId)) {
    throw ApiError.badRequest(
      "This payment method is disabled by the server payment configuration.",
    );
  }

  const update: {
    enabled: boolean;
    displayOrder?: number;
    description?: string;
  } = {
    enabled: input.enabled,
  };

  if (input.displayOrder !== undefined) {
    update.displayOrder = input.displayOrder;
  }

  if (input.description !== undefined) {
    update.description = input.description;
  }

  const record = await PaymentMethodModel.findOneAndUpdate(
    { methodId },
    { $set: update },
    {
      new: true,
      runValidators: true,
    },
  )
    .select(
      "methodId name enabled displayOrder description createdAt updatedAt",
    )
    .lean()
    .exec();

  if (!record) {
    throw ApiError.notFound("Payment method was not found.");
  }

  return record;
}
