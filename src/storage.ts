import fs from "fs";
import path from "path";

export function ensureSpecificoDir(projectRoot: string): void {
  const dir = path.join(projectRoot, "specifico");
  fs.mkdirSync(dir, { recursive: true });
}

export function specDirPath(
  projectRoot: string,
  id: string,
  slug: string
): string {
  return path.join(projectRoot, "specifico", `${id}-${slug}`);
}

export function ensureSpecDir(
  projectRoot: string,
  id: string,
  slug: string
): string {
  const dir = specDirPath(projectRoot, id, slug);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function findSpecDirById(
  projectRoot: string,
  id: string
): string | null {
  const specifico = path.join(projectRoot, "specifico");
  if (!fs.existsSync(specifico)) return null;
  const entries = fs.readdirSync(specifico, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(`${id}-`)) {
      return path.join(specifico, entry.name);
    }
  }
  return null;
}

export function listAllSpecDirs(projectRoot: string): string[] {
  const specifico = path.join(projectRoot, "specifico");
  if (!fs.existsSync(specifico)) return [];
  return fs
    .readdirSync(specifico, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{3}-/.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => path.join(specifico, e.name));
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function writeText(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, "utf-8");
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
