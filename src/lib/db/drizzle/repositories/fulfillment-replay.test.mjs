import assert from "node:assert/strict";
import test from "node:test";

import { replayTerminalWithAudit } from "./fulfillment-replay.ts";

for (const targetKind of ["work", "effect"]) {
  test(`${targetKind} replay commits its transition and audit together`, async () => {
    const memory = createTransactionalMemory();
    const accepted = await replayTerminalWithAudit(memory.run, {
      targetKind,
      targetId: targetKind === "work" ? "cs_verified" : "42",
      operatorUserId: "operator-1",
      reason: "  confirmed transient failure  ",
    });

    assert.equal(accepted, true);
    assert.equal(memory.state.targetState, "pending");
    assert.deepEqual(memory.state.audits, [{
      targetKind,
      targetId: targetKind === "work" ? "cs_verified" : "42",
      priorState: "needs_attention",
      operatorUserId: "operator-1",
      reason: "confirmed transient failure",
    }]);
  });
}

for (const targetKind of ["work", "effect"]) {
  test(`${targetKind} replay rolls back when audit creation fails`, async () => {
    const memory = createTransactionalMemory({ failAudit: true });
    await assert.rejects(
      replayTerminalWithAudit(memory.run, {
        targetKind,
        targetId: targetKind === "work" ? "cs_rollback" : "42",
        operatorUserId: "operator-1",
        reason: "test rollback",
      }),
      /audit unavailable/,
    );
    assert.equal(memory.state.targetState, "needs_attention");
    assert.deepEqual(memory.state.audits, []);
  });
}

function createTransactionalMemory(options = {}) {
  const state = { targetState: "needs_attention", audits: [] };
  return {
    state,
    run: async (operation) => {
      const draft = structuredClone(state);
      const result = await operation({
        lockTarget: async () => draft.targetState === "needs_attention"
          ? { id: 1, priorState: draft.targetState }
          : null,
        transitionTarget: async () => {
          if (draft.targetState !== "needs_attention") return false;
          draft.targetState = "pending";
          return true;
        },
        appendAudit: async (record) => {
          if (options.failAudit) throw new Error("audit unavailable");
          draft.audits.push(record);
        },
      });
      state.targetState = draft.targetState;
      state.audits = draft.audits;
      return result;
    },
  };
}
