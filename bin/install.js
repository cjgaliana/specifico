#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const templateDir = path.join(__dirname, "..", "template");
const targetDir = path.join(process.cwd(), ".claude", "commands", "specifico");

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");

  console.log("Specifico — SPEC-driven development for Claude Code\n");

  const existingFiles = fs.existsSync(targetDir)
    ? fs.readdirSync(targetDir).filter((f) => f !== ".DS_Store")
    : [];

  if (existingFiles.length > 0 && !force) {
    console.log(`Found existing Specifico installation at:\n  ${targetDir}\n`);
    console.log(`Files: ${existingFiles.join(", ")}\n`);
    const answer = await ask("Overwrite? (yes/no): ");
    if (!answer.toLowerCase().startsWith("y")) {
      console.log("Aborted. Use --force to skip this prompt.");
      process.exit(0);
    }
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(templateDir);
  for (const file of files) {
    fs.copyFileSync(
      path.join(templateDir, file),
      path.join(targetDir, file)
    );
  }

  console.log(`✓ Installed ${files.length} files to:\n  ${targetDir}\n`);
  console.log("Available commands (open this project in Claude Code):\n");
  console.log("  /specifico:spec    \"<feature>\"   — create a new spec");
  console.log("  /specifico:plan                   — draft architecture plan");
  console.log("  /specifico:tasks                  — generate task list");
  console.log("  /specifico:execute                — implement next task");
  console.log("  /specifico:verify                 — validate vs acceptance criteria");
  console.log("  /specifico:merge                  — merge completed spec");
  console.log("  /specifico:status                 — show progress");
  console.log("  /specifico:refine  \"<change>\"     — update a spec mid-flight");
  console.log("  /specifico:memory-update          — sync entities/APIs to memory");
  console.log("  /specifico:memory-rebuild         — rebuild memory from all specs");
  console.log("\nDocs: https://github.com/cjgaliana/specifico");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
