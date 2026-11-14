export type OrderEmailDelivery = "customer" | "owner";

export function orderEmailDeliveryFromIdempotencyKey(
  idempotencyKey: string,
): OrderEmailDelivery | null {
  const match = idempotencyKey.match(/:email:(customer|owner)$/);
  return match?.[1] === "customer" || match?.[1] === "owner"
    ? match[1]
    : null;
}

// Work completed before order emails were split per recipient left one
// `order:<id>:email` effect for both messages. The sweep marks it done and
// queues one effect per recipient in its place instead of sending it.
export function isLegacyBundledEmailEffect(idempotencyKey: string): boolean {
  return /^order:\d+:email$/.test(idempotencyKey);
}

/**
 * Sends one claimed email effect, then records it complete. Delivery is at
 * least once: a crash after SMTP accepts the message and before the completion
 * is stored sends it again on the next claim.
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
