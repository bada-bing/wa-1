import type { BaseMetadata, StudyTaskMetadata } from "../../src/types";
import type { AdaptedIssue } from "../../src/integrations/jiraIssueAdapter";

/**
 * Sample Adapted Work Issue (from Jira)
 *
 * This represents a fully adapted Jira issue ready for task bootstrap.
 */
export const sampleAdaptedIssue: AdaptedIssue = {
  key: "ISSUE-123",
  summary: "Fix checkout button not responding on mobile",
  project: "work-project-1",
  branchName: "fix/issue-123/fix-checkout-button-not-responding-on-mobile",
  issueType: "fix",
  jiraLink: "https://test.atlassian.net/browse/ISSUE-123",
  storyPoints: 3,
  // TODO Investigate: the formatting of slug is suspicious, i.e., "-" instead of "_"
  slug: "issue-123-fix-checkout-button-not-responding-on-mobile",
};

/**
 * Sample Adapted Story Issue
 */
export const sampleAdaptedStory: AdaptedIssue = {
  key: "PROF-456",
  summary: "Add user profile customization options",
  project: "work-project-1",
  branchName: "feature/prof-456/add-user-profile-customization-options",
  issueType: "feature",
  jiraLink: "https://test.atlassian.net/browse/PROF-456",
  storyPoints: 5,
  slug: "prof-456-add-user-profile-customization-options",
};

/**
 * Sample Study Task Metadata
 *
 * This represents a study task with Frontend Masters course.
 */
export const sampleStudyTaskMetadata: StudyTaskMetadata = {
  key: "FM-typescript-101",
  summary: "TypeScript Fundamentals Course",
  project: "learning",
  issueType: "study",
  slug: "fm-typescript-101-typescript-fundamentals-course",
  source: "Frontend Masters",
  initiative: "JavaScript Mastery",
  objective: "Learn TypeScript",
};

/**
 * Sample Study Task Metadata (Exercism)
 */
export const sampleExercismTask: StudyTaskMetadata = {
  key: "exercism-rust-basics",
  summary: "Rust programming basics track",
  project: "learning",
  issueType: "study",
  slug: "exercism-rust-basics-rust-programming-basics-track",
  source: "Exercism",
  initiative: "Systems Programming",
  objective: "Learn Rust",
};

/**
 * Sample Base Metadata (minimal)
 */
export const sampleBaseMetadata: BaseMetadata = {
  key: "TEST-999",
  summary: "Sample task",
  project: "test-project",
  issueType: "chore",
  slug: "test-999-sample-task",
};
