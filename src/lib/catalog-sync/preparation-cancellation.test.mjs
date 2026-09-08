import assert from "node:assert/strict";
import test from "node:test";

import { runPreparationCancellation } from "./preparation-cancellation.ts";
import {
  catalogPreparationCleanupCompletion,
  shouldCompensateRejectedPreparedUpload,
} from "./preparation-state.ts";

const operation = (state) => ({
  id: "operation-1",
  state,
  target: { kind: "preparing", uploadedImageUrls: ["image-1"] },
});

test("a late stale upload is compensated between deletion and final cancellation", async () => {
  let durableState = "preparing";
  let errorCode = "preparation_cleanup_pending";
  const objects = new Set(["image-1"]);
  let signalDeleted;
  let releaseRemoval;
  const deleted = new Promise((resolve) => signalDeleted = resolve);
  const removalCanFinish = new Promise((resolve) => releaseRemoval = resolve);

  const cancellation = runPreparationCancellation({
    operation: operation(durableState),
    beginCancellation: async () => {
      durableState = "cancelling";
      return operation(durableState);
    },
    removeImages: async () => {
      objects.clear();
      signalDeleted();
      await removalCanFinish;
    },
    completeCancellation: async () => {
      const transition = catalogPreparationCleanupCompletion(errorCode);
      durableState = transition.state;
      errorCode = transition.errorCode;
      return operation(durableState);
    },
  });

  await deleted;
  objects.add("image-1");
  if (shouldCompensateRejectedPreparedUpload(durableState)) {
    objects.delete("image-1");
  }
  releaseRemoval();
  await cancellation;

  assert.equal(durableState, "cancelling");
  assert.deepEqual([...objects], []);

  await runPreparationCancellation({
    operation: operation(durableState),
    beginCancellation: async () => assert.fail("settling resumes in place"),
    removeImages: async () => objects.clear(),
    completeCancellation: async () => {
      const transition = catalogPreparationCleanupCompletion(errorCode);
      durableState = transition.state;
      errorCode = transition.errorCode;
      return operation(durableState);
    },
  });
  assert.equal(durableState, "cancelled");
});

test("failed Storage cleanup remains durably cancelling and is retryable", async () => {
  let durableState = "preparing";
  await assert.rejects(() => runPreparationCancellation({
    operation: operation(durableState),
    beginCancellation: async () => {
      durableState = "cancelling";
      return operation(durableState);
    },
    removeImages: async () => {
      throw new Error("storage unavailable");
    },
    completeCancellation: async () => assert.fail("cleanup was not complete"),
  }));
  assert.equal(durableState, "cancelling");

  await runPreparationCancellation({
    operation: operation(durableState),
    beginCancellation: async () => assert.fail("cancelling must resume in place"),
    removeImages: async () => undefined,
    completeCancellation: async () => {
      durableState = "cancelled";
      return operation(durableState);
    },
  });
  assert.equal(durableState, "cancelled");
});
