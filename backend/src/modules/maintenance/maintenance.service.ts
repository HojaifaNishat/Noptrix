import { MaintenanceState } from "./maintenance.model";

import type { UpdateMaintenanceInput } from "./maintenance.validator";

const DEFAULT_MESSAGE =
  "The service is temporarily unavailable for maintenance.";

export async function getMaintenanceState() {
  const state = await MaintenanceState.findOne()
    .sort({ updatedAt: -1 })
    .lean()
    .exec();

  if (!state) {
    return {
      enabled: false,
      message: DEFAULT_MESSAGE,
      updatedAt: null,
    };
  }

  const now = Date.now();
  const startsAt = state.startsAt?.getTime();
  const endsAt = state.endsAt?.getTime();

  const withinSchedule =
    (startsAt === undefined || now >= startsAt) &&
    (endsAt === undefined || now < endsAt);

  return {
    enabled: state.enabled && withinSchedule,
    message: state.message || DEFAULT_MESSAGE,
    startsAt: state.startsAt ?? null,
    endsAt: state.endsAt ?? null,
    updatedAt: state.updatedAt,
    updatedBy: state.updatedBy,
  };
}

export async function updateMaintenanceState(
  input: UpdateMaintenanceInput,
  actorId?: string,
) {
  const update: Record<string, unknown> = {
    enabled: input.enabled,
    message: input.message ?? DEFAULT_MESSAGE,
    updatedBy: actorId,
  };

  if (input.startsAt !== undefined) {
    update.startsAt = new Date(input.startsAt);
  }

  if (input.endsAt !== undefined) {
    update.endsAt = new Date(input.endsAt);
  }

  const existing = await MaintenanceState.findOne()
    .sort({ updatedAt: -1 })
    .exec();

  const state = existing
    ? await MaintenanceState.findByIdAndUpdate(
        existing._id,
        { $set: update },
        { new: true, runValidators: true },
      )
        .lean()
        .exec()
    : await MaintenanceState.create(update);

  if (!state) {
    throw new Error("Failed to update maintenance state.");
  }

  return getMaintenanceState();
}
