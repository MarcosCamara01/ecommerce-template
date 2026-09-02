const orderEmailDeliveries = ["customer", "owner"] as const;

export function buildOrderEmailEffects(workId: number) {
  return orderEmailDeliveries.map((delivery) => ({
    workId,
    kind: "order_email" as const,
    idempotencyKey: `work:${workId}:email:${delivery}`,
  }));
}
