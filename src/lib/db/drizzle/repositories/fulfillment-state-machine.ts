import { sql, type SQLWrapper } from "drizzle-orm";

export const fulfillmentTransitions = {
  paymentConfirmed: {
    from: ["needs_attention"],
    to: "pending",
  },
  paymentConfirmedAfterClaim: {
    from: ["processing"],
    to: "pending",
  },
  claim: {
    from: ["pending", "processing"],
    to: "processing",
  },
  replay: {
    from: ["needs_attention"],
    to: "pending",
  },
  succeed: {
    from: ["processing"],
    to: "succeeded",
  },
  retry: {
    from: ["processing"],
    to: "pending",
  },
  requireAttention: {
    from: ["processing"],
    to: "needs_attention",
  },
} as const;

export type FulfillmentState =
  | "pending"
  | "processing"
  | "succeeded"
  | "needs_attention";

type TransitionName = keyof typeof fulfillmentTransitions;

export function canApplyFulfillmentTransition(
  transition: TransitionName,
  state: FulfillmentState,
): boolean {
  return (fulfillmentTransitions[transition].from as readonly FulfillmentState[])
    .includes(state);
}

export function failureTransitionName(
  retryAt: Date | null,
  code?: string,
  paymentConfirmedAt?: Date | null,
  claimStartedAt?: Date | null,
) {
  if (
    code === "payment_not_final" &&
    paymentConfirmedAt &&
    claimStartedAt &&
    paymentConfirmedAt.getTime() > claimStartedAt.getTime()
  ) {
    return "paymentConfirmedAfterClaim" as const;
  }
  return retryAt ? "retry" as const : "requireAttention" as const;
}

export function transitionSourcePredicate(
  column: SQLWrapper,
  transition: TransitionName,
) {
  const states = fulfillmentTransitions[transition].from.map(
    (state) => sql`${state}`,
  );
  return sql`${column} in (${sql.join(states, sql`, `)})`;
}

export function claimEligibilityPredicate(input: {
  stateColumn: SQLWrapper;
  nextAttemptAtColumn: SQLWrapper;
  leaseExpiresAtColumn: SQLWrapper;
}) {
  return sql`${transitionSourcePredicate(input.stateColumn, "claim")}
    and ${input.nextAttemptAtColumn} <= now()
    and (${input.leaseExpiresAtColumn} is null or ${input.leaseExpiresAtColumn} < now())`;
}

export function isClaimEligible(input: {
  state: FulfillmentState;
  nextAttemptAt: Date;
  leaseExpiresAt: Date | null;
}, now: Date): boolean {
  return canApplyFulfillmentTransition("claim", input.state) &&
    input.nextAttemptAt.getTime() <= now.getTime() &&
    (input.leaseExpiresAt === null || input.leaseExpiresAt.getTime() < now.getTime());
}

export function leasedProcessingPredicate(input: {
  idColumn: SQLWrapper;
  id: number;
  stateColumn: SQLWrapper;
  leaseOwnerColumn: SQLWrapper;
  leaseExpiresAtColumn?: SQLWrapper;
  workerId: string;
}) {
  const leaseExpiresAtColumn = input.leaseExpiresAtColumn ?? sql.raw("lease_expires_at");
  return sql`${input.idColumn} = ${input.id}
    and ${transitionSourcePredicate(input.stateColumn, "succeed")}
    and ${input.leaseOwnerColumn} = ${input.workerId}
    and ${leaseExpiresAtColumn} > now()`;
}

export function isLeasedProcessingTransitionEligible(input: {
  state: FulfillmentState;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  workerId: string;
}, now: Date) {
  return canApplyFulfillmentTransition("succeed", input.state) &&
    input.leaseOwner === input.workerId &&
    input.leaseExpiresAt !== null &&
    input.leaseExpiresAt.getTime() > now.getTime();
}

export function claimTransitionMutation(input: {
  attemptCountColumn: SQLWrapper;
  workerId: string;
  leaseSeconds: number;
}) {
  return sql`state = ${fulfillmentTransitions.claim.to},
    attempt_count = ${input.attemptCountColumn} + 1,
    lease_owner = ${input.workerId},
    lease_expires_at = now() + make_interval(secs => ${input.leaseSeconds}),
    updated_at = now()`;
}

export function releasedTransitionValues(
  state: FulfillmentState,
  now = new Date(),
) {
  return {
    state,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastErrorCode: null,
    lastErrorDetail: null,
    updatedAt: now,
  };
}

export function replayTransitionValues(now = new Date()) {
  return {
    ...releasedTransitionValues(fulfillmentTransitions.replay.to, now),
    nextAttemptAt: now,
  };
}

export function paymentConfirmationTransitionValues(input: {
  state: FulfillmentState;
  lastErrorCode: string | null;
  existingConfirmedAt: Date | null;
  existingConfirmationEventId: string | null;
  confirmedAt: Date;
  confirmationEventId: string;
}, now = new Date()) {
  const incomingIsNewEvent = !input.existingConfirmationEventId ||
    input.confirmationEventId !== input.existingConfirmationEventId;
  const incomingIsLatest = !input.existingConfirmedAt ||
    (incomingIsNewEvent &&
      input.confirmedAt.getTime() >= input.existingConfirmedAt.getTime());
  const incomingIsNewer = !input.existingConfirmedAt ||
    input.confirmedAt.getTime() > input.existingConfirmedAt.getTime();
  const confirmation = {
    paymentConfirmedAt: incomingIsLatest
      ? input.confirmedAt
      : input.existingConfirmedAt,
    paymentConfirmationEventId: incomingIsLatest
      ? input.confirmationEventId
      : input.existingConfirmationEventId,
  };
  if (
    input.state === "needs_attention" &&
    input.lastErrorCode === "payment_not_final" &&
    incomingIsNewEvent &&
    incomingIsNewer
  ) {
    return {
      ...replayTransitionValues(now),
      ...confirmation,
    };
  }
  if (input.state === "processing") return confirmation;
  return { ...confirmation, updatedAt: now };
}

export function failureTransitionValues(input: {
  code: string;
  detail: string;
  retryAt: Date | null;
  paymentConfirmedAt?: Date | null;
  claimStartedAt?: Date | null;
}, now = new Date()) {
  const transitionName = failureTransitionName(
    input.retryAt,
    input.code,
    input.paymentConfirmedAt,
    input.claimStartedAt,
  );
  const transition = fulfillmentTransitions[transitionName];
  if (transitionName === "paymentConfirmedAfterClaim") {
    return {
      ...releasedTransitionValues(transition.to, now),
      nextAttemptAt: now,
    };
  }
  return {
    ...releasedTransitionValues(transition.to, now),
    nextAttemptAt: input.retryAt ?? now,
    lastErrorCode: input.code,
    lastErrorDetail: input.detail.slice(0, 2000),
  };
}
