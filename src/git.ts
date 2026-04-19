import simpleGit, { SimpleGit } from "simple-git";

// Allow task commits and verification-fix commits.
const COMMIT_RE = /^specifico\(\d{3}\/(T\d{3}|fix)\): .+/;

function git(projectRoot: string): SimpleGit {
  return simpleGit(projectRoot);
}

export async function branchCreate(
  projectRoot: string,
  branch: string,
): Promise<void> {
  await git(projectRoot).checkoutLocalBranch(branch);
}

export async function commit(
  projectRoot: string,
  message: string,
): Promise<string> {
  if (!COMMIT_RE.test(message)) {
    throw new Error(
      `Commit message must match: specifico(<id>/T<nnn>|fix): <title>. Got: "${message}"`,
    );
  }
  await git(projectRoot).add(".");
  const result = await git(projectRoot).commit(message);
  return result.commit;
}

export async function mergeBranch(
  projectRoot: string,
  branch: string,
): Promise<void> {
  await git(projectRoot).merge(["--no-ff", branch]);
}

export async function currentBranch(projectRoot: string): Promise<string> {
  const result = await git(projectRoot).revparse(["--abbrev-ref", "HEAD"]);
  return result.trim();
}

export async function branchExists(
  projectRoot: string,
  branch: string,
): Promise<boolean> {
  const result = await git(projectRoot).branch(["-a"]);
  return Object.keys(result.branches).some(
    (b) => b === branch || b === `remotes/origin/${branch}`,
  );
}

export async function getSha(
  projectRoot: string,
  ref: string,
): Promise<string> {
  const result = await git(projectRoot).revparse([ref]);
  return result.trim();
}
