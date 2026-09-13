export type OrderEmailDelivery = "customer" | "owner";

export function orderEmailDeliveryFromIdempotencyKey(
  idempotencyKey: string,
): OrderEmailDelivery | null {
  const match = idempotencyKey.match(/:email:(customer|owner)$/);
  return match?.[1] === "customer" || match?.[1] === "owner"
    ? match[1]
    : null;
}

export function isLegacyBundledEmailEffect(idempotencyKey: string): boolean {
  return /^order:\d+:email$/.test(idempotencyKey);
}

/**
 * Runs one claimed delivery and records completion only after the SMTP call.
 * This deliberately provides at-least-once, not exactly-once, delivery across
 * the unavoidable SMTP-acceptance/durable-completion crash window.
 */
export async function executeOrderEmailEffect(
  effect: Readonly<{ id: number; idempotencyKey: string }>,
  delivery: OrderEmailDelivery,
  ports: {
    send: (
      delivery: OrderEmailDelivery,
      idempotencyKey: string,
    ) => Promise<void>;
    complete: (effectId: number) => Promise<void>;
  },
) {
  await ports.send(delivery, effect.idempotencyKey);
  await ports.complete(effect.id);
}
