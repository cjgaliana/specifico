import fs from "fs";
import path from "path";
import { ensureSpecificoDir, listAllSpecDirs } from "./storage";
import { readState } from "./state";

export interface JournalSpec {
  id: string;
  slug: string;
  title: string;
  phase: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
}

export interface Journal {
  version: number;
  specs: JournalSpec[];
}

function journalPath(projectRoot: string): string {
  return path.join(projectRoot, ".specifico", "journal.json");
}

export function initJournal(projectRoot: string): Journal {
  ensureSpecificoDir(projectRoot);
  const jPath = journalPath(projectRoot);

  if (!fs.existsSync(jPath)) {
    const journal: Journal = { version: 1, specs: [] };
    writeJournal(projectRoot, journal);
    return journal;
  }

  return readJournal(projectRoot);
}

export function readJournal(projectRoot: string): Journal {
  ensureSpecificoDir(projectRoot);
  const jPath = journalPath(projectRoot);

  if (!fs.existsSync(jPath)) {
    return { version: 1, specs: [] };
  }

  try {
    const content = fs.readFileSync(jPath, "utf-8");
    return JSON.parse(content) as Journal;
  } catch (err) {
    throw new Error(`Failed to read journal.json: ${err}`);
  }
}

export function writeJournal(projectRoot: string, journal: Journal): void {
  ensureSpecificoDir(projectRoot);
  const jPath = journalPath(projectRoot);
  const tmpPath = jPath + ".tmp";

  // Atomic write via temp-file rename
  fs.writeFileSync(tmpPath, JSON.stringify(journal, null, 2), "utf-8");
  fs.renameSync(tmpPath, jPath);
}

export function addSpecToJournal(
  projectRoot: string,
  id: string,
  slug: string,
  title: string,
  phase: string,
  branch: string,
  createdAt: string,
): Journal {
  const journal = readJournal(projectRoot);

  // Check for duplicate ID
  if (journal.specs.some((s) => s.id === id)) {
    throw new Error(`Spec with ID ${id} already exists in journal`);
  }

  journal.specs.push({
    id,
    slug,
    title,
    phase,
    branch,
    createdAt,
    updatedAt: createdAt,
  });

  writeJournal(projectRoot, journal);
  return journal;
}

export function updateSpecInJournal(
  projectRoot: string,
  id: string,
  phase: string,
  updatedAt: string,
): Journal {
  const journal = readJournal(projectRoot);
  const spec = journal.specs.find((s) => s.id === id);

  if (!spec) {
    throw new Error(`Spec with ID ${id} not found in journal`);
  }

  spec.phase = phase;
  spec.updatedAt = updatedAt;

  writeJournal(projectRoot, journal);
  return journal;
}

export function getNextId(projectRoot: string): string {
  const journal = initJournal(projectRoot);

  if (journal.specs.length === 0) {
    return "001";
  }

  // Find the highest numeric ID
  const highestId = Math.max(...journal.specs.map((s) => parseInt(s.id, 10)));

  const next = highestId + 1;
  return String(next).padStart(3, "0");
}

export function rebuildJournalFromDirectory(projectRoot: string): Journal {
  ensureSpecificoDir(projectRoot);
  const specDirs = listAllSpecDirs(projectRoot);
  const specs: JournalSpec[] = [];

  for (const specDir of specDirs) {
    try {
      const state = readState(specDir);
      specs.push({
        id: state.id,
        slug: state.slug,
        title: state.id, // Fallback: we'll try to get title from STATE.json if available
        phase: state.phase,
        branch: state.branch,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      });
    } catch (err) {
      console.warn(
        `Warning: Could not read state from ${specDir}, skipping in journal rebuild`,
      );
    }
  }

  // Sort by ID numerically
  specs.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));

  const journal: Journal = { version: 1, specs };
  writeJournal(projectRoot, journal);
  return journal;
}
