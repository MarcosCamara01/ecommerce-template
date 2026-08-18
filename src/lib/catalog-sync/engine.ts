import { randomUUID } from "node:crypto";
import type { CatalogSyncOperationRecord, CatalogSyncState, CatalogSyncStripeResult } from "./model";

export type CatalogSyncResult = { operationId: string; productId: number; state: CatalogSyncState; outcome: "succeeded" | "retry_scheduled" | "needs_attention" | "busy" };
export type CatalogSyncEngineRepository = {
  claimById(id: string, worker: string): Promise<CatalogSyncOperationRecord | null>;
  claimNext(worker: string): Promise<CatalogSyncOperationRecord | null>;
  renewLease(id: string, worker: string): Promise<boolean>;
  recordStripeResult(id: string, worker: string, result: CatalogSyncStripeResult): Promise<boolean>;
  finalize(id: string, worker: string): Promise<"succeeded" | "lease_lost" | "stale_catalog" | "invalid_result">;
  fail(input: { operationId: string; workerId: string; retryable: boolean; errorCode: string; errorDetail: string }): Promise<CatalogSyncOperationRecord | null>;
  get(id: string): Promise<CatalogSyncOperationRecord | null>;
};

const result = (operation: CatalogSyncOperationRecord): CatalogSyncResult => ({
  operationId: operation.id,
  productId: operation.productId,
  state: operation.state,
  outcome: operation.state === "succeeded" ? "succeeded" : operation.state === "needs_attention" ? "needs_attention" : operation.state === "retry_wait" ? "retry_scheduled" : "busy",
});

export function createCatalogSyncEngine(input: {
  repository: CatalogSyncEngineRepository;
  applyStripe(operation: CatalogSyncOperationRecord, heartbeat: () => Promise<void>): Promise<CatalogSyncStripeResult>;
  classify(error: unknown): { retryable: boolean; code: string; detail: string };
}) {
  async function processClaimed(operation: CatalogSyncOperationRecord, worker: string): Promise<CatalogSyncResult> {
    try {
      let stripeResult = operation.stripeResult;
      if (!stripeResult) {
        stripeResult = await input.applyStripe(operation, async () => {
          if (!(await input.repository.renewLease(operation.id, worker))) throw new Error("Catalog sync lease lost");
        });
        if (!(await input.repository.recordStripeResult(operation.id, worker, stripeResult))) return result(operation);
      }
      const finalized = await input.repository.finalize(operation.id, worker);
      if (finalized === "succeeded") return { operationId: operation.id, productId: operation.productId, state: "succeeded", outcome: "succeeded" };
      if (finalized === "lease_lost") return result(operation);
      const failed = await input.repository.fail({ operationId: operation.id, workerId: worker, retryable: false, errorCode: finalized, errorDetail: finalized === "stale_catalog" ? "Local catalog changed after enqueue" : "Stripe result does not match target" });
      return failed ? result(failed) : result(operation);
    } catch (error) {
      const failure = input.classify(error);
      const failed = await input.repository.fail({
        operationId: operation.id,
        workerId: worker,
        retryable: failure.retryable,
        errorCode: failure.code,
        errorDetail: failure.detail,
      });
      return failed ? result(failed) : result(operation);
    }
  }
  async function processById(id: string) {
    const worker = `catalog-request-${randomUUID()}`;
    const claimed = await input.repository.claimById(id, worker);
    if (claimed) return processClaimed(claimed, worker);
    const current = await input.repository.get(id);
    if (!current) throw new Error("Catalog sync operation disappeared");
    return result(current);
  }
  async function sweep(limit: number) {
    const worker = `catalog-sweep-${randomUUID()}`;
    const results: CatalogSyncResult[] = [];
    for (let count = 0; count < limit; count += 1) {
      const claimed = await input.repository.claimNext(worker);
      if (!claimed) break;
      results.push(await processClaimed(claimed, worker));
    }
    return results;
  }
  return { processClaimed, processById, sweep };
}
