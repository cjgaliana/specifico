#!/usr/bin/env node
import { nextId } from "./id";
import * as git from "./git";
import { readState, writeState, transition } from "./state";
import {
  readMemory,
  writeMemory,
  detectConflicts,
  applyDelta,
  rebuildMemory,
} from "./memory";
import { readSpec, validateCompleteness } from "./spec";
import { readTasks, nextReadyTask, markTaskDone, validateNoCycles } from "./tasks";
import {
  readJournal,
  addSpecToJournal,
  updateSpecInJournal,
  rebuildJournalFromDirectory,
} from "./journal";
import { MemoryDeltaSchema, StateSchema, Phase } from "./types";
import { ensureSpecificoDir, findSpecDirById } from "./storage";

const projectRoot = process.cwd();

function ok(data: unknown): void {
  console.log(JSON.stringify({ success: true, data }));
}

function fail(error: string, extra?: object): void {
  console.error(JSON.stringify({ success: false, error, ...extra }));
  process.exit(1);
}

async function main(): Promise<void> {
  const [, , cmd, ...args] = process.argv;

  try {
    // ── ID ────────────────────────────────────────────────────────────────
    if (cmd === "next-id") {
      return ok(nextId(projectRoot));
    }

    // ── GIT ───────────────────────────────────────────────────────────────
    if (cmd === "git") {
      const sub = args[0];
      if (sub === "branch-create") {
        await git.branchCreate(projectRoot, args[1]);
        return ok({ branch: args[1] });
      }
      if (sub === "commit") {
        const sha = await git.commit(projectRoot, args.slice(1).join(" "));
        return ok({ sha });
      }
      if (sub === "merge") {
        await git.mergeBranch(projectRoot, args[1]);
        return ok({ merged: args[1] });
      }
      if (sub === "current-branch") {
        return ok(await git.currentBranch(projectRoot));
      }
      if (sub === "branch-exists") {
        return ok(await git.branchExists(projectRoot, args[1]));
      }
      if (sub === "get-sha") {
        return ok(await git.getSha(projectRoot, args[1] ?? "HEAD"));
      }
      return fail(`Unknown git subcommand: ${sub}`);
    }

    // ── STATE ─────────────────────────────────────────────────────────────
    if (cmd === "state") {
      const sub = args[0];
      const specDir = resolveSpecDir(args[1]);

      if (sub === "read") {
        return ok(readState(specDir));
      }
      if (sub === "write") {
        const stateData = StateSchema.parse(JSON.parse(args[2]));
        writeState(specDir, stateData);
        return ok(stateData);
      }
      if (sub === "transition") {
        const phase = Phase.parse(args[2]);
        const next = transition(specDir, phase);
        return ok(next);
      }
      return fail(`Unknown state subcommand: ${sub}`);
    }

    // ── MEMORY ────────────────────────────────────────────────────────────
    if (cmd === "memory") {
      const sub = args[0];

      if (sub === "read") {
        ensureSpecificoDir(projectRoot);
        return ok(readMemory(projectRoot));
      }
      if (sub === "check-delta") {
        const delta = MemoryDeltaSchema.parse(JSON.parse(args[1]));
        const memory = readMemory(projectRoot);
        const conflicts = detectConflicts(memory, delta);
        const hasBlockers = conflicts.some((c) => c.severity === "block");
        if (hasBlockers) {
          console.error(JSON.stringify({ success: false, error: "Conflicts detected", conflicts }));
          process.exit(1);
        }
        return ok({ conflicts });
      }
      if (sub === "apply-delta") {
        const delta = MemoryDeltaSchema.parse(JSON.parse(args[1]));
        const memory = readMemory(projectRoot);
        const conflicts = detectConflicts(memory, delta);
        const hasBlockers = conflicts.some((c) => c.severity === "block");
        if (hasBlockers) {
          console.error(JSON.stringify({ success: false, error: "Conflicts detected", conflicts }));
          process.exit(1);
        }
        const updated = applyDelta(memory, delta);
        writeMemory(projectRoot, updated);
        return ok(updated);
      }
      if (sub === "rebuild") {
        const memory = rebuildMemory(projectRoot);
        writeMemory(projectRoot, memory);
        return ok(memory);
      }
      return fail(`Unknown memory subcommand: ${sub}`);
    }

    // ── SPEC ──────────────────────────────────────────────────────────────
    if (cmd === "spec") {
      const sub = args[0];
      if (sub === "validate") {
        const specDir = resolveSpecDir(args[1]);
        const spec = readSpec(specDir);
        const missing = validateCompleteness(spec);
        if (missing.length > 0) {
          console.error(JSON.stringify({ success: false, error: "Incomplete spec", missing }));
          process.exit(1);
        }
        return ok({ valid: true });
      }
      return fail(`Unknown spec subcommand: ${sub}`);
    }

    // ── TASKS ─────────────────────────────────────────────────────────────
    if (cmd === "tasks") {
      const sub = args[0];
      const specDir = resolveSpecDir(args[1]);

      if (sub === "next") {
        const tasks = readTasks(specDir);
        return ok(nextReadyTask(tasks));
      }
      if (sub === "mark-done") {
        const tasks = markTaskDone(specDir, args[2], args[3]);
        return ok(tasks);
      }
      if (sub === "validate") {
        const tasks = readTasks(specDir);
        validateNoCycles(tasks);
        return ok({ valid: true });
      }
      return fail(`Unknown tasks subcommand: ${sub}`);
    }

    // ── JOURNAL ───────────────────────────────────────────────────────────
    if (cmd === "journal") {
      const sub = args[0];

      if (sub === "read") {
        ensureSpecificoDir(projectRoot);
        return ok(readJournal(projectRoot));
      }
      if (sub === "add-spec") {
        const id = args[1];
        const slug = args[2];
        const title = args[3];
        const phase = args[4];
        const branch = args[5];
        const createdAt = args[6];
        if (!id || !slug || !title || !phase || !branch || !createdAt) {
          return fail(
            "journal add-spec requires: id slug title phase branch createdAt"
          );
        }
        const journal = addSpecToJournal(
          projectRoot,
          id,
          slug,
          title,
          phase,
          branch,
          createdAt
        );
        return ok(journal);
      }
      if (sub === "update-spec") {
        const id = args[1];
        const phase = args[2];
        const updatedAt = args[3];
        if (!id || !phase || !updatedAt) {
          return fail("journal update-spec requires: id phase updatedAt");
        }
        const journal = updateSpecInJournal(projectRoot, id, phase, updatedAt);
        return ok(journal);
      }
      if (sub === "rebuild") {
        const journal = rebuildJournalFromDirectory(projectRoot);
        return ok(journal);
      }
      return fail(`Unknown journal subcommand: ${sub}`);
    }

    fail(`Unknown command: ${cmd}`);
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

function resolveSpecDir(arg: string): string {
  if (!arg) fail("spec-dir argument required");
  // If it's an ID like "001", find the directory
  if (/^\d{3}$/.test(arg)) {
    const found = findSpecDirById(projectRoot, arg);
    if (!found) fail(`No spec directory found for ID: ${arg}`);
    return found!;
  }
  return arg;
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
