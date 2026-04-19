import { getNextId } from "./journal";

export function nextId(projectRoot: string): string {
  return getNextId(projectRoot);
}
