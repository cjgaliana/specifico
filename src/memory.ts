import path from "path";
import {
  Conflict,
  Entity,
  ApiEndpoint,
  Memory,
  MemoryDelta,
  MemorySchema,
} from "./types";
import { fileExists, listAllSpecDirs, readJson, writeJson } from "./storage";
import { readState } from "./state";
import { readSpec } from "./spec";

const MEMORY_FILE = "MEMORY.json";

function emptyMemory(): Memory {
  return {
    version: 1,
    entities: [],
    apiEndpoints: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function readMemory(projectRoot: string): Memory {
  const filePath = path.join(projectRoot, ".specifico", MEMORY_FILE);
  if (!fileExists(filePath)) return emptyMemory();
  return MemorySchema.parse(readJson(filePath));
}

export function writeMemory(projectRoot: string, memory: Memory): void {
  const filePath = path.join(projectRoot, ".specifico", MEMORY_FILE);
  writeJson(filePath, memory);
}

export function detectConflicts(
  memory: Memory,
  delta: MemoryDelta
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const incoming of delta.entities) {
    const existing = memory.entities.find((e) => e.name === incoming.name);
    if (!existing) continue;

    for (const [fieldName, incomingField] of Object.entries(incoming.fields)) {
      const existingField = existing.fields[fieldName];
      if (!existingField) {
        // New field added — warn if optional, allow if required
        if (incomingField.required) {
          conflicts.push({
            severity: "warn",
            field: `${incoming.name}.${fieldName}`,
            message: `New required field "${fieldName}" added to entity "${incoming.name}". Verify existing data compatibility.`,
          });
        }
        continue;
      }
      if (existingField.type !== incomingField.type) {
        conflicts.push({
          severity: "block",
          field: `${incoming.name}.${fieldName}`,
          message: `Entity "${incoming.name}" field "${fieldName}" type mismatch: existing="${existingField.type}" incoming="${incomingField.type}"`,
        });
      }
    }

    // Check for removed fields
    for (const fieldName of Object.keys(existing.fields)) {
      if (!(fieldName in incoming.fields)) {
        conflicts.push({
          severity: "block",
          field: `${incoming.name}.${fieldName}`,
          message: `Entity "${incoming.name}" field "${fieldName}" removed. Breaking change.`,
        });
      }
    }
  }

  for (const incoming of delta.apiEndpoints) {
    const existing = memory.apiEndpoints.find(
      (a) => a.path === incoming.path
    );
    if (!existing) continue;

    if (existing.method !== incoming.method) {
      conflicts.push({
        severity: "block",
        field: `${incoming.method} ${incoming.path}`,
        message: `API "${incoming.path}" method changed: existing="${existing.method}" incoming="${incoming.method}"`,
      });
    }

    // Check for removed required request keys
    if (existing.requestSchema && incoming.requestSchema) {
      for (const key of Object.keys(existing.requestSchema)) {
        if (!(key in incoming.requestSchema)) {
          conflicts.push({
            severity: "block",
            field: `${incoming.method} ${incoming.path}.request.${key}`,
            message: `API "${incoming.path}" request schema removed required key "${key}"`,
          });
        }
      }
    }
  }

  return conflicts;
}

export function applyDelta(memory: Memory, delta: MemoryDelta): Memory {
  const entities = [...memory.entities];
  for (const incoming of delta.entities) {
    const idx = entities.findIndex((e) => e.name === incoming.name);
    if (idx >= 0) {
      entities[idx] = incoming;
    } else {
      entities.push(incoming);
    }
  }

  const apiEndpoints = [...memory.apiEndpoints];
  for (const incoming of delta.apiEndpoints) {
    const idx = apiEndpoints.findIndex((a) => a.path === incoming.path);
    if (idx >= 0) {
      apiEndpoints[idx] = incoming;
    } else {
      apiEndpoints.push(incoming);
    }
  }

  return {
    ...memory,
    entities,
    apiEndpoints,
    lastUpdated: new Date().toISOString(),
  };
}

export function rebuildMemory(projectRoot: string): Memory {
  let memory = emptyMemory();
  const specDirs = listAllSpecDirs(projectRoot);

  for (const specDir of specDirs) {
    try {
      const state = readState(specDir);
      if (state.phase !== "merged") continue;

      const spec = readSpec(specDir);
      const delta: MemoryDelta = {
        entities: spec.entities,
        apiEndpoints: spec.apiEndpoints,
      };
      memory = applyDelta(memory, delta);
    } catch {
      // Skip dirs that can't be parsed
    }
  }

  return memory;
}
