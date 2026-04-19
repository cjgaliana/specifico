import { z } from "zod";

export const Phase = z.enum([
  "spec",
  "plan",
  "tasks",
  "execute",
  "verify",
  "merged",
  "abandoned",
]);
export type Phase = z.infer<typeof Phase>;

export const TRANSITIONS: Record<Phase, Phase[]> = {
  spec: ["plan", "abandoned"],
  plan: ["tasks", "spec", "abandoned"],
  tasks: ["execute", "plan", "abandoned"],
  execute: ["verify", "tasks", "abandoned"],
  verify: ["merged", "execute"],
  merged: [],
  abandoned: [],
};

export const StateSchema = z.object({
  id: z.string(),
  slug: z.string(),
  phase: Phase,
  branch: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedTasks: z.array(z.string()),
  blockers: z.array(z.string()),
  verifyPassed: z.boolean().optional(),
});
export type State = z.infer<typeof StateSchema>;

export const EntityFieldSchema = z.object({
  type: z.string(),
  required: z.boolean().optional(),
  description: z.string().optional(),
});
export type EntityField = z.infer<typeof EntityFieldSchema>;

export const EntitySchema = z.object({
  name: z.string(),
  fields: z.record(z.string(), EntityFieldSchema),
});
export type Entity = z.infer<typeof EntitySchema>;

export const ApiEndpointSchema = z.object({
  path: z.string(),
  method: z.string(),
  description: z.string().optional(),
  requestSchema: z.record(z.unknown()).optional(),
  responseSchema: z.record(z.unknown()).optional(),
});
export type ApiEndpoint = z.infer<typeof ApiEndpointSchema>;

export const AcceptanceCriteriaSchema = z.array(z.string());

export const SpecSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  problem: z.string(),
  goals: z.array(z.string()),
  nonGoals: z.array(z.string()),
  entities: z.array(EntitySchema),
  apiEndpoints: z.array(ApiEndpointSchema),
  acceptanceCriteria: z.array(z.string()),
  outOfScope: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  verifyResults: z
    .array(
      z.object({
        criterion: z.string(),
        verdict: z.enum(["pass", "fail", "partial"]),
        evidence: z.string().optional(),
      })
    )
    .optional(),
});
export type Spec = z.infer<typeof SpecSchema>;

export const ComponentSchema = z.object({
  name: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()),
});

export const PlanSchema = z.object({
  id: z.string(),
  slug: z.string(),
  approach: z.string(),
  components: z.array(ComponentSchema),
  dataFlow: z.string(),
  risks: z.array(z.string()),
  openQuestions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const TaskStatus = z.enum(["pending", "in_progress", "done", "skipped"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  dependsOn: z.array(z.string()),
  status: TaskStatus,
  completedSha: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const TasksSchema = z.object({
  specId: z.string(),
  tasks: z.array(TaskSchema),
});
export type Tasks = z.infer<typeof TasksSchema>;

export const MemorySchema = z.object({
  version: z.number(),
  entities: z.array(EntitySchema),
  apiEndpoints: z.array(ApiEndpointSchema),
  lastUpdated: z.string(),
});
export type Memory = z.infer<typeof MemorySchema>;

export const MemoryDeltaSchema = z.object({
  entities: z.array(EntitySchema),
  apiEndpoints: z.array(ApiEndpointSchema),
});
export type MemoryDelta = z.infer<typeof MemoryDeltaSchema>;

export const ConflictSchema = z.object({
  severity: z.enum(["block", "warn"]),
  field: z.string(),
  message: z.string(),
});
export type Conflict = z.infer<typeof ConflictSchema>;

export const CliResultSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), data: z.unknown() }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    conflicts: z.array(ConflictSchema).optional(),
  }),
]);
export type CliResult = z.infer<typeof CliResultSchema>;
