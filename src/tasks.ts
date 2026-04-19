import path from "path";
import { Task, Tasks, TasksSchema } from "./types";
import { readJson, writeJson } from "./storage";

const TASKS_FILE = "TASKS.json";

export function readTasks(specDir: string): Tasks {
  return TasksSchema.parse(readJson(path.join(specDir, TASKS_FILE)));
}

export function writeTasks(specDir: string, tasks: Tasks): void {
  TasksSchema.parse(tasks);
  writeJson(path.join(specDir, TASKS_FILE), tasks);
}

export function nextReadyTask(tasks: Tasks): Task | null {
  const doneIds = new Set(
    tasks.tasks.filter((t) => t.status === "done").map((t) => t.id)
  );
  return (
    tasks.tasks.find(
      (t) =>
        t.status === "pending" && t.dependsOn.every((dep) => doneIds.has(dep))
    ) ?? null
  );
}

export function markTaskDone(
  specDir: string,
  taskId: string,
  sha: string
): Tasks {
  const tasks = readTasks(specDir);
  const task = tasks.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task "${taskId}" not found`);
  task.status = "done";
  task.completedSha = sha;
  writeTasks(specDir, tasks);
  return tasks;
}

export function validateNoCycles(tasks: Tasks): void {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): void {
    if (inStack.has(id)) throw new Error(`Cycle detected involving task "${id}"`);
    if (visited.has(id)) return;
    inStack.add(id);
    visited.add(id);
    const task = tasks.tasks.find((t) => t.id === id);
    if (task) {
      for (const dep of task.dependsOn) dfs(dep);
    }
    inStack.delete(id);
  }

  for (const task of tasks.tasks) dfs(task.id);
}

export function buildDependencyOrder(tasks: Tasks): Task[] {
  validateNoCycles(tasks);
  const ordered: Task[] = [];
  const added = new Set<string>();

  function add(id: string): void {
    if (added.has(id)) return;
    const task = tasks.tasks.find((t) => t.id === id);
    if (!task) return;
    for (const dep of task.dependsOn) add(dep);
    if (!added.has(id)) {
      ordered.push(task);
      added.add(id);
    }
  }

  for (const task of tasks.tasks) add(task.id);
  return ordered;
}
