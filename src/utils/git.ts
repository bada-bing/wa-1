import path from "path";
import fs from "fs";
import { executeCommand } from "./shell";

import { updateChangelog } from "./updateChangelog";
import { ensureVPNConnection } from "./vpn";
import { BaseMetadata, TaskConfig } from "../types";
import assert from "assert";

/**
 * Minimal interface for git operations
 * Extends BaseMetadata with git-specific fields
 */
export interface GitIssueData extends BaseMetadata {
  project: string;
  branchName: string;
  issueType: string;
}

function getProjectPath(project: string): string {
  // TODO make src path configurable
  return path.join(process.env.HOME || "~", "src", project);
}

export async function getCurrentBranch(project: string): Promise<string> {
  try {
    return await executeCommand(
      "git branch --show-current",
      getProjectPath(project)
    );
  } catch (error) {
    throw new Error(
      `Failed to get current branch: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function isValidRepository(project: string): Promise<boolean> {
  try {
    // --git-dir prints git dir of the PWD (which is defined as 2nd param of executeCommand())
    // alternative: git -C ~/src/<project> rev-parse --git-dir
    await executeCommand("git rev-parse --git-dir", getProjectPath(project));
    return true;
  } catch {
    return false;
  }
}

// TODO rev-parse is used for a lot of things in git - what does it do? (it can both print git dir and current pointer)
export async function getLastCommitHash(project: string): Promise<string> {
  try {
    return await executeCommand("git rev-parse HEAD", getProjectPath(project));
  } catch (error) {
    throw new Error(
      `Failed to get last commit hash: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function isWorkingDirectoryClean(
  project: string
): Promise<boolean> {
  try {
    const status = await executeCommand(
      "git status --porcelain",
      getProjectPath(project)
    );
    return status === "";
  } catch {
    return false;
  }
}

export async function getDefaultBranch(project: string): Promise<string> {
  try {
    // Get the default branch from the remote HEAD reference
    const output = await executeCommand(
      "git symbolic-ref refs/remotes/origin/HEAD",
      getProjectPath(project)
    );
    // Output is like "refs/remotes/origin/main" or "refs/remotes/origin/develop"
    // Extract just the branch name
    return output.replace("refs/remotes/origin/", "").trim();
  } catch (error) {
    // Fallback: try to determine from remote info
    try {
      await executeCommand(
        "git remote set-head origin --auto",
        getProjectPath(project)
      );
      const output = await executeCommand(
        "git symbolic-ref refs/remotes/origin/HEAD",
        getProjectPath(project)
      );
      return output.replace("refs/remotes/origin/", "").trim();
    } catch {
      // Last resort: default to "main"
      console.warn(
        `[git] Could not determine default branch for ${project}, defaulting to "main"`
      );
      return "main";
    }
  }
}

export async function checkoutLatestDefaultBranch(project: string): Promise<void> {
  try {
    const defaultBranch = await getDefaultBranch(project);
    await executeCommand(`git switch ${defaultBranch}`, getProjectPath(project));
    await executeCommand(`git pull origin ${defaultBranch}`, getProjectPath(project));
  } catch (error) {
    throw new Error(
      `[git] Failed to checkout and update default branch: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createFeatureBranch(
  project: string,
  branchName: string
): Promise<void> {
  try {
    await executeCommand(
      `git checkout -b ${branchName}`,
      getProjectPath(project)
    );
  } catch (error) {
    throw new Error(
      `[git] Failed to create feature branch: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function executeGitProcedure(
  issue: GitIssueData,
  config: TaskConfig
): Promise<void> {
  assert(issue.project, "[GIT] issue project shouldn't be undefined")
  
  if (!(await isValidRepository(issue.project))) {
    throw new Error(
      `[git] Invalid git repository at ${getProjectPath(issue.project)}`
    );
  }

  if (!(await isWorkingDirectoryClean(issue.project))) {
    throw new Error(
      "[git] Working directory is not clean. Commit or stash your changes."
    );
  }

  // Ensure VPN is connected before executing git remote commands
  await ensureVPNConnection(config);

  try {
    console.log(
      `[git] Current branch: ${await getCurrentBranch(issue.project)}`
    );
    await checkoutLatestDefaultBranch(issue.project);
    await createFeatureBranch(issue.project, issue.branchName);
    // TODO considering that most of these functions are catching the error already, I potentially don't need to catch them again.
    // or I can simply use this try catch to wrap the error message and the inner functions to determine if they need stderr or stdin

    // Update changelog if it exists
    const changelogPath = path.join(
      getProjectPath(issue.project),
      "CHANGELOG.adoc"
    );
    if (fs.existsSync(changelogPath)) {
      await updateChangelog(
        changelogPath,
        issue.summary,
        issue.issueType,
        issue.key
      );
    } else {
      console.log("[git] CHANGELOG.adoc not found, skipping changelog update");
    }
  } catch (error) {
    throw new Error(
      `Git procedure failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
