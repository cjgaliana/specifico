import fs from "fs";
import path from "path";
import { ensureSpecificoDir, fileExists, writeText } from "./storage";

export interface ProjectMemory {
  features: string[];
  techStack: string[];
  patterns: string[];
  conventions: string[];
  architecturalDecisions: string[];
}

function memoryPath(projectRoot: string): string {
  return path.join(projectRoot, "specifico", "MEMORY.md");
}

export function initMemoryMarkdown(projectRoot: string): void {
  ensureSpecificoDir(projectRoot);
  const mPath = memoryPath(projectRoot);

  if (!fileExists(mPath)) {
    const template = `# Project Memory

## Features

(To be populated via merged specs)

## Tech Stack

(To be identified during \`/specifico:init\`)

## Patterns

(To be documented as specs are merged)

## Conventions

(To be documented as specs are merged)

## Architectural Decisions

(To be documented as specs are merged)
`;
    writeText(mPath, template);
  }
}

export function readMemoryMarkdown(projectRoot: string): ProjectMemory {
  ensureSpecificoDir(projectRoot);
  const mPath = memoryPath(projectRoot);

  if (!fileExists(mPath)) {
    initMemoryMarkdown(projectRoot);
  }

  const content = fs.readFileSync(mPath, "utf-8");
  return parseMemoryMarkdown(content);
}

function parseMemoryMarkdown(content: string): ProjectMemory {
  const memory: ProjectMemory = {
    features: [],
    techStack: [],
    patterns: [],
    conventions: [],
    architecturalDecisions: [],
  };

  let currentSection = "";

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "## Features") currentSection = "features";
    else if (trimmed === "## Tech Stack") currentSection = "techStack";
    else if (trimmed === "## Patterns") currentSection = "patterns";
    else if (trimmed === "## Conventions") currentSection = "conventions";
    else if (trimmed === "## Architectural Decisions")
      currentSection = "architecturalDecisions";
    else if (trimmed.startsWith("- ") && currentSection) {
      const item = trimmed.substring(2).trim();
      if (item && !item.startsWith("(To be")) {
        if (currentSection === "features") memory.features.push(item);
        else if (currentSection === "techStack") memory.techStack.push(item);
        else if (currentSection === "patterns") memory.patterns.push(item);
        else if (currentSection === "conventions")
          memory.conventions.push(item);
        else if (currentSection === "architecturalDecisions")
          memory.architecturalDecisions.push(item);
      }
    }
  }

  return memory;
}

export function addFeatureToMemory(
  projectRoot: string,
  featureTitle: string,
  featureSlug: string,
  featureDescription: string,
): void {
  ensureSpecificoDir(projectRoot);
  const mPath = memoryPath(projectRoot);

  if (!fileExists(mPath)) {
    initMemoryMarkdown(projectRoot);
  }

  let content = fs.readFileSync(mPath, "utf-8");

  // Find the Features section and add the new feature
  const featureEntry = `- **${featureTitle}** (\`${featureSlug}\`): ${featureDescription}`;

  // Insert after "## Features" header, before the next section
  const featuresSectionRegex = /(## Features\n\n)([\s\S]*?)(\n## )/;
  const match = content.match(featuresSectionRegex);

  if (match) {
    const beforeSection = match[1];
    const currentFeatures = match[2].trim();
    const afterSection = match[3];

    let newFeatures = currentFeatures;
    if (
      currentFeatures.includes("(To be populated") ||
      currentFeatures.trim() === ""
    ) {
      newFeatures = featureEntry;
    } else {
      newFeatures = currentFeatures + "\n" + featureEntry;
    }

    content = content.replace(
      featuresSectionRegex,
      beforeSection + newFeatures + "\n" + afterSection,
    );
  }

  writeText(mPath, content);
}

export function updateTechStackInMemory(
  projectRoot: string,
  techItems: string[],
): void {
  ensureSpecificoDir(projectRoot);
  const mPath = memoryPath(projectRoot);

  if (!fileExists(mPath)) {
    initMemoryMarkdown(projectRoot);
  }

  let content = fs.readFileSync(mPath, "utf-8");

  // Build the tech stack section
  const techSection = techItems.map((t) => `- ${t}`).join("\n");

  // Replace the Tech Stack section
  const techStackRegex = /(## Tech Stack\n\n)([\s\S]*?)(\n## )/;
  const match = content.match(techStackRegex);

  if (match) {
    const beforeSection = match[1];
    const afterSection = match[3];
    content = content.replace(
      techStackRegex,
      beforeSection + techSection + "\n" + afterSection,
    );
  }

  writeText(mPath, content);
}

export function addPatternToMemory(projectRoot: string, pattern: string): void {
  ensureSpecificoDir(projectRoot);
  const mPath = memoryPath(projectRoot);

  if (!fileExists(mPath)) {
    initMemoryMarkdown(projectRoot);
  }

  let content = fs.readFileSync(mPath, "utf-8");
  const patternEntry = `- ${pattern}`;

  const patternsRegex = /(## Patterns\n\n)([\s\S]*?)(\n## )/;
  const match = content.match(patternsRegex);

  if (match) {
    const beforeSection = match[1];
    const currentPatterns = match[2].trim();
    const afterSection = match[3];

    let newPatterns = currentPatterns;
    if (
      currentPatterns.includes("(To be documented") ||
      currentPatterns.trim() === ""
    ) {
      newPatterns = patternEntry;
    } else if (!currentPatterns.includes(patternEntry)) {
      newPatterns = currentPatterns + "\n" + patternEntry;
    }

    content = content.replace(
      patternsRegex,
      beforeSection + newPatterns + "\n" + afterSection,
    );
  }

  writeText(mPath, content);
}

export function addConventionToMemory(
  projectRoot: string,
  convention: string,
): void {
  ensureSpecificoDir(projectRoot);
  const mPath = memoryPath(projectRoot);

  if (!fileExists(mPath)) {
    initMemoryMarkdown(projectRoot);
  }

  let content = fs.readFileSync(mPath, "utf-8");
  const conventionEntry = `- ${convention}`;

  const conventionsRegex = /(## Conventions\n\n)([\s\S]*?)(\n## )/;
  const match = content.match(conventionsRegex);

  if (match) {
    const beforeSection = match[1];
    const currentConventions = match[2].trim();
    const afterSection = match[3];

    let newConventions = currentConventions;
    if (
      currentConventions.includes("(To be documented") ||
      currentConventions.trim() === ""
    ) {
      newConventions = conventionEntry;
    } else if (!currentConventions.includes(conventionEntry)) {
      newConventions = currentConventions + "\n" + conventionEntry;
    }

    content = content.replace(
      conventionsRegex,
      beforeSection + newConventions + "\n" + afterSection,
    );
  }

  writeText(mPath, content);
}
