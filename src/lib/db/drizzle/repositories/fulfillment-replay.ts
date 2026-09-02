import {
  canApplyFulfillmentTransition,
  type FulfillmentState,
} from "./fulfillment-state-machine.ts";

export type ReplayAuditRecord = Readonly<{
  targetKind: "work" | "effect";
  targetId: string;
  priorState: FulfillmentState;
  operatorUserId: string;
  reason: string;
}>;

export type ReplayTransactionPort = {
  lockTarget: () => Promise<{ id: number; priorState: FulfillmentState } | null>;
  transitionTarget: (id: number) => Promise<boolean>;
  appendAudit: (record: ReplayAuditRecord) => Promise<void>;
};

export type ReplayTransactionRunner = <Result>(
  operation: (port: ReplayTransactionPort) => Promise<Result>,
) => Promise<Result>;

export async function replayTerminalWithAudit(
  runTransaction: ReplayTransactionRunner,
  input: Omit<ReplayAuditRecord, "priorState">,
): Promise<boolean> {
  const reason = normalizeReplayReason(input.reason);
  return runTransaction(async (port) => {
    const target = await port.lockTarget();
    if (
      !target ||
      !canApplyFulfillmentTransition("replay", target.priorState)
    ) {
      return false;
    }
    if (!(await port.transitionTarget(target.id))) return false;
    await port.appendAudit({ ...input, reason, priorState: target.priorState });
    return true;
  });
}

function normalizeReplayReason(reason: string) {
  const normalized = reason.trim();
  if (!normalized || normalized.length > 500) {
    throw new Error("Replay reason must contain between 1 and 500 characters");
  }
  return normalized;
}
