import { describe, expect, it } from "vitest";

import {
  messageBulkActionSchema,
  messageListQuerySchema,
  messageRecipientsQuerySchema,
  messageReplySchema,
} from "../../src/modules/communication/messages/message.validator";

describe("message recipient query validator", () => {
  it("applies defaults and accepts a recipient type filter", () => {
    const result = messageRecipientsQuerySchema.safeParse({
      search: "rider",
      accountType: "EMPLOYEE",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        page: 1,
        limit: 50,
        search: "rider",
        accountType: "EMPLOYEE",
      });
    }
  });

  it("rejects unsupported account types and oversized pages", () => {
    expect(
      messageRecipientsQuerySchema.safeParse({
        accountType: "CUSTOMER",
      }).success,
    ).toBe(false);
    expect(
      messageRecipientsQuerySchema.safeParse({
        limit: 101,
      }).success,
    ).toBe(false);
  });
});

describe("message list and action validators", () => {
  it("applies advanced inbox filter defaults and parses unread state", () => {
    const result = messageListQuerySchema.safeParse({
      unreadOnly: "true",
      sort: "oldest",
      fromDate: "2026-01-01",
      toDate: "2026-01-31",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        page: 1,
        limit: 20,
        unreadOnly: true,
        sort: "oldest",
      });
    }
  });

  it("rejects reversed date ranges and empty bulk actions", () => {
    expect(
      messageListQuerySchema.safeParse({
        fromDate: "2026-02-01",
        toDate: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(
      messageBulkActionSchema.safeParse({
        messageIds: [],
        action: "read",
      }).success,
    ).toBe(false);
  });

  it("validates reply bodies and uploaded attachment metadata", () => {
    expect(
      messageReplySchema.safeParse({
        body: "Following up",
        attachments: [
          {
            name: "report.pdf",
            publicId: "noptrix/messages/user/report",
            resourceType: "raw",
            format: "pdf",
            mimeType: "application/pdf",
            size: 1024,
          },
        ],
      }).success,
    ).toBe(true);
  });
});
