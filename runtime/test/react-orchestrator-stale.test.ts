import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Config } from "../src/config.js";
import { closeDb, initDb } from "../src/db/connection.js";
import { ActionQueue, type ActionQueueItem } from "../src/engine/action-queue.js";
import { type ActContext, startReActLoop } from "../src/engine/react/orchestrator.js";
import { WorldModel } from "../src/graph/world-model.js";
import type { PressureDims } from "../src/utils/math.js";

function makeQueuedItem(target: string): ActionQueueItem {
  const pressureSnapshot: PressureDims = [100, 0, 0, 0, 0, 0];
  return {
    enqueueTick: 1,
    action: "sociability",
    target,
    pressureSnapshot,
    contributions: {},
    observation: {
      candidateId: "candidate:stale",
      enqueueId: "enqueue:stale",
      api: 1,
      apiPeak: 1,
    },
  };
}

function makeConfig(): Config {
  return {
    stalenessThreshold: 0.01,
  } as Config;
}

describe("react orchestrator staleness", () => {
  beforeEach(() => initDb(":memory:"));
  afterEach(() => closeDb());

  it("stale queue expiry releases target lock without consuming pending_directed", async () => {
    const target = "channel:stale";
    const G = new WorldModel();
    G.addChannel(target, {
      chat_type: "private",
      pending_directed: 2,
      last_directed_ms: Date.now(),
    });

    const queue = new ActionQueue();
    queue.enqueue(makeQueuedItem(target));
    const loop = startReActLoop({
      client: {} as ActContext["client"],
      G,
      config: makeConfig(),
      queue,
      personality: {} as ActContext["personality"],
      getCurrentTick: () => 2,
      getCurrentPressures: () => [0, 0, 0, 0, 0, 0],
      onPersonalityUpdate: () => {},
      dispatcher: {
        dispatch: () => undefined,
        query: () => null,
        getInstructionNames: () => [],
        getInstructionDef: () => undefined,
        getQueryNames: () => [],
        getQueryDef: () => undefined,
        startTick: () => {},
        endTick: () => {},
        collectContributions: () => [],
        generateManual: async () => "",
        mods: [],
        snapshotModStates: () => new Map(),
        restoreModStates: () => {},
        saveModStatesToDb: () => {},
        loadModStatesFromDb: () => false,
        readModState: () => undefined,
      },
      buffer: {} as ActContext["buffer"],
      recordAction: vi.fn(),
      reportLLMOutcome: vi.fn(),
    });

    await vi.waitFor(() => {
      expect(queue.isTargetActive(target)).toBe(false);
    });
    queue.close();
    await loop;

    expect(G.getChannel(target).pending_directed).toBe(2);
  });
});
