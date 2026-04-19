import fs from "fs";
import path from "path";
import { ensureSpecificoDir } from "./storage";

export function nextId(projectRoot: string): string {
  ensureSpecificoDir(projectRoot);
  const counterPath = path.join(projectRoot, "specifico", ".counter");
  const tmpPath = counterPath + ".tmp";

  let current = 0;
  if (fs.existsSync(counterPath)) {
    current = parseInt(fs.readFileSync(counterPath, "utf-8").trim(), 10);
  }
  const next = current + 1;

  // Atomic write via temp-file rename
  fs.writeFileSync(tmpPath, String(next), "utf-8");
  fs.renameSync(tmpPath, counterPath);

  return String(next).padStart(3, "0");
}
