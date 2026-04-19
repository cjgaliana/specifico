import path from "path";
import { Spec, SpecSchema } from "./types";
import { readJson, writeJson } from "./storage";

const SPEC_FILE = "SPEC.json";

export function readSpec(specDir: string): Spec {
  return SpecSchema.parse(readJson(path.join(specDir, SPEC_FILE)));
}

export function writeSpec(specDir: string, spec: Spec): void {
  SpecSchema.parse(spec);
  writeJson(path.join(specDir, SPEC_FILE), spec);
}

export function validateCompleteness(spec: Spec): string[] {
  const missing: string[] = [];
  if (!spec.problem.trim()) missing.push("problem");
  if (!spec.goals.length) missing.push("goals");
  if (!spec.acceptanceCriteria.length) missing.push("acceptanceCriteria");
  if (!spec.title.trim()) missing.push("title");
  return missing;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
