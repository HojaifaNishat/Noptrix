export const PAYMENT_METHOD_IDS = ["cod", "online"] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export interface PublicPaymentMethod {
  id: PaymentMethodId;
  name: string;
  enabled: boolean;
  displayOrder: number;
  description: string;
}

export interface PublicPaymentMethodsResponse {
  methods: PublicPaymentMethod[];
  providers: unknown;
  health: {
    configured: boolean;
    healthy: boolean;
  };
}
