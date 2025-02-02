import path from "path";
import { executeCommand } from "./shell";
import { AdaptedIssue } from "../integrations/jiraIssueAdapter";
import { updateChangelog } from "./updateChangelog";

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

export async function checkoutLatestDevelop(project: string): Promise<void> {
  try {
    await executeCommand("git switch develop", getProjectPath(project));
    await executeCommand("git pull origin develop", getProjectPath(project));
  } catch (error) {
    throw new Error(
      `[git] Failed to checkout and update develop: ${
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

export async function executeGitProcedure(issue: AdaptedIssue): Promise<void> {
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

  try {
    console.log(
      `[git] Current branch: ${await getCurrentBranch(issue.project)}`
    );
    await checkoutLatestDevelop(issue.project);
    await createFeatureBranch(issue.project, issue.branchName);

    // Update changelog
    const changelogPath = path.join(
      getProjectPath(issue.project),
      "CHANGELOG.adoc"
    );
    await updateChangelog(
      changelogPath,
      issue.summary,
      issue.issueType,
      issue.key
    );
  } catch (error) {
    throw new Error(
      `Git procedure failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
