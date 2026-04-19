import path from "path";
import { Phase, State, StateSchema, TRANSITIONS } from "./types";
import { readJson, writeJson } from "./storage";

const STATE_FILE = "STATE.json";

export function readState(specDir: string): State {
  return StateSchema.parse(readJson(path.join(specDir, STATE_FILE)));
}

export function writeState(specDir: string, state: State): void {
  StateSchema.parse(state);
  writeJson(path.join(specDir, STATE_FILE), state);
}

export function validateTransition(from: Phase, to: Phase): void {
  const allowed = TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid transition: ${from} → ${to}. Allowed: ${allowed.join(", ") || "none"}`
    );
  }
}

export function transition(specDir: string, toPhase: Phase): State {
  const state = readState(specDir);

  // Idempotent: already in target phase
  if (state.phase === toPhase) return state;

  validateTransition(state.phase, toPhase);

  const next: State = {
    ...state,
    phase: toPhase,
    updatedAt: new Date().toISOString(),
  };
  writeState(specDir, next);
  return next;
}
