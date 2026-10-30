import { describe, expect, it } from "vitest";

import {
  listCustomersQuerySchema,
  updateCustomerNotificationPreferencesSchema,
} from "../../src/modules/customers/customer.validator";
import { listUsersQuerySchema } from "../../src/modules/users/user.validator";

describe("People listing query validation", () => {
  it("applies default pagination to user listings", () => {
    expect(listUsersQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it("coerces and accepts customer filters", () => {
    expect(
      listCustomersQuerySchema.parse({
        page: "3",
        limit: "50",
        search: "  Alex  ",
        segment: "REPEAT_BUYERS",
      }),
    ).toEqual({
      page: 3,
      limit: 50,
      search: "Alex",
      segment: "REPEAT_BUYERS",
    });
  });

  it("rejects invalid pagination and statuses", () => {
    expect(
      listUsersQuerySchema.safeParse({
        page: "0",
        limit: "101",
        status: "UNKNOWN",
      }).success,
    ).toBe(false);
  });

  it("accepts partial customer notification preference updates", () => {
    expect(
      updateCustomerNotificationPreferencesSchema.parse({
        marketing: true,
        push: false,
      }),
    ).toEqual({
      marketing: true,
      push: false,
    });

    expect(
      updateCustomerNotificationPreferencesSchema.safeParse({}).success,
    ).toBe(false);
  });
});
