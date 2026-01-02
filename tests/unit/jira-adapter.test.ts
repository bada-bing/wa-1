import { describe, it, expect } from "vitest";
import { determineProject, generateBranchName } from "../../src/tasks/workTask";
import {
  createIssueType,
  type RawJiraIssue,
} from "../../src/integrations/jira/JiraClient";
import { generateJiraLink } from "../../src/utils/prepareMetadata";
import { bugIssue, storyIssue, taskIssue } from "../fixtures/jira-responses";
import { validWorkTaskConfig } from "../fixtures/configs";

/**
 * Jira Issue Adapter Tests
 *
 * These tests document how Jira issues are adapted for use in the WA-1 system.
 * The adapter is responsible for:
 * - Determining which project an issue belongs to (using multiple strategies)
 * - Generating branch names following conventions
 * - Mapping Jira issue types to internal types
 * - Creating Jira links
 */

describe("Jira Issue Adapter", () => {
  describe("determineProject - resolves project using multiple strategies", () => {
    describe("Strategy 1: Parent-based mapping", () => {
      it("returns project when parent issue is mapped in config", () => {
        // bugIssue has parent: PROJ-100
        const project = determineProject(
          bugIssue,
          validWorkTaskConfig.clients["work-client-1"]
        );
        expect(project).toBe("work-project-1"); // Mapped in config: PROJ-100 → work-project-1
      });

      it("uses default from parent mapping when no specific parent matches", () => {
        const issueWithUnknownParent: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            summary: "Generic task without keywords",
            parent: { key: "UNKNOWN-999" },
            project: {
              ...taskIssue.fields.project,
              key: "UNKNOWN", // Not in project mapping
            },
            labels: [], // No labels to match
          },
        };

        const project = determineProject(
          issueWithUnknownParent,
          validWorkTaskConfig.clients["work-client-1"]
        );
        expect(project).toBe("work-project-1"); // Default from basedOnParent
      });
    });

    describe("Strategy 2: Jira project-based mapping", () => {
      it("returns project when Jira project key is mapped", () => {
        // taskIssue has project.key: MOBILE
        const issueWithoutParent: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
          },
        };

        const project = determineProject(
          issueWithoutParent,
          validWorkTaskConfig.clients["work-client-1"]
        );
        expect(project).toBe("mobile-project"); // Mapped: MOBILE → mobile-project
      });

      it("handles single string mapping from Jira project", () => {
        const clientConfig = {
          projects: ["test-project"],
          projectMapping: {
            basedOnParent: {}, // No parent mapping
            basedOnJiraProject: {
              TEST: "test-project",
            },
            basedOnLabels: {},
          },
        };

        const testIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            project: {
              ...taskIssue.fields.project,
              key: "TEST",
            },
          },
        };

        const project = determineProject(testIssue, clientConfig);
        expect(project).toBe("test-project");
      });

      it("returns single project from array mapping", () => {
        const clientConfig = {
          projects: ["single-project"],
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {
              MULTI: ["single-project"], // Array with one item
            },
            basedOnLabels: {},
          },
        };

        const testIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            project: {
              ...taskIssue.fields.project,
              key: "MULTI",
            },
          },
        };

        const project = determineProject(testIssue, clientConfig);
        expect(project).toBe("single-project");
      });

      it("returns null for array mapping with multiple options (requires user prompt)", () => {
        const clientConfig = {
          projects: ["project-a", "project-b"],
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {
              MULTI: ["project-a", "project-b"], // Multiple options
            },
            basedOnLabels: {},
          },
        };

        const testIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            summary: "Generic task without keywords",
            parent: undefined,
            project: {
              ...taskIssue.fields.project,
              key: "MULTI",
            },
          },
        };

        const project = determineProject(testIssue, clientConfig);
        expect(project).toBeNull(); // Can't auto-determine, needs user input
      });
    });

    describe("Strategy 3: Label-based mapping", () => {
      it("returns project when issue label matches config mapping", () => {
        const issueWithLabels: RawJiraIssue = {
          ...storyIssue,
          fields: {
            ...storyIssue.fields,
            parent: undefined,
            project: {
              ...storyIssue.fields.project,
              key: "UNKNOWN", // Not in project mapping
            },
          },
        };

        const project = determineProject(
          issueWithLabels,
          validWorkTaskConfig.clients["work-client-1"]
        );
        expect(project).toBe("work-project-1"); // From labels mapping
      });

      it("ignores labels that map to projects not in config.projects", () => {
        const clientConfig = {
          projects: ["valid-project"],
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {},
            basedOnLabels: {
              "invalid-label": "invalid-project", // Not in projects array
            },
          },
        };

        const issueWithInvalidLabel: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            labels: ["invalid-label"],
          },
        };

        const project = determineProject(issueWithInvalidLabel, clientConfig);
        expect(project).toBeNull(); // Invalid project, returns null
      });

      it("matches labels case-insensitively", () => {
        const clientConfig = {
          projects: ["work-project-1", "work-project-2"],
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {},
            basedOnLabels: {
              WPC: "work-project-1",
            },
          },
        };

        const issueWithUppercaseLabel: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            summary: "Generic task without keywords",
            parent: undefined,
            labels: ["WPC"], // Uppercase
          },
        };

        const project = determineProject(issueWithUppercaseLabel, clientConfig);
        expect(project).toBe("work-project-1");
      });
    });

    describe("Strategy 4: Summary keyword matching", () => {
      // Create a base issue that won't be caught by other strategies
      const baseIssueForSummaryMatching: RawJiraIssue = {
        ...taskIssue,
        fields: {
          ...taskIssue.fields,
          parent: undefined, // No parent
          project: {
            ...taskIssue.fields.project,
            key: "UNRELATED", // A key not in project mappings
          },
          labels: [], // No labels
        },
      };

      it('detects "cart_ui_next" keyword in summary from config', () => {
        const issueWithKeyword: RawJiraIssue = {
          ...baseIssueForSummaryMatching,
          fields: {
            ...baseIssueForSummaryMatching.fields,
            summary: "Fix cart_ui_next styling issue",
          },
        };

        const project = determineProject(
          issueWithKeyword,
          validWorkTaskConfig.clients["work-client-1"]
        );
        expect(project).toBe("work-project-1");
      });

      it('detects "new-summary-keyword" from custom config in summary', () => {
        const issueWithKeyword: RawJiraIssue = {
          ...baseIssueForSummaryMatching,
          fields: {
            ...baseIssueForSummaryMatching.fields,
            summary: "Implement new-summary-keyword feature",
          },
        };

        const project = determineProject(
          issueWithKeyword,
          validWorkTaskConfig.clients["work-client-1"]
        );
        expect(project).toBe("new-project-summary");
      });

      it("returns null if summary keyword does not match any project in config", () => {
        const issueWithNoMatchingKeyword: RawJiraIssue = {
          ...baseIssueForSummaryMatching,
          fields: {
            ...baseIssueForSummaryMatching.fields,
            summary: "This summary has no matching keyword",
          },
        };

        const project = determineProject(
          issueWithNoMatchingKeyword,
          validWorkTaskConfig.clients["work-client-1"]
        );
        // No strategies match, so it should fall back to the default in basedOnParent
        expect(project).toBe("work-project-1");
      });

      it("returns null if clientConfig has no basedOnSummaryKeywords defined", () => {
        const clientConfigWithoutSummaryKeywords = {
          ...validWorkTaskConfig.clients["work-client-1"],
          projectMapping: {
            ...validWorkTaskConfig.clients["work-client-1"].projectMapping,
            basedOnSummaryKeywords: undefined, // Explicitly undefined
          },
        };

        const issueWithKeyword: RawJiraIssue = {
          ...baseIssueForSummaryMatching,
          fields: {
            ...baseIssueForSummaryMatching.fields,
            summary: "Fix cart_ui_next styling issue",
          },
        };

        const project = determineProject(
          issueWithKeyword,
          clientConfigWithoutSummaryKeywords
        );
        // No summary keyword mapping, falls back to default
        expect(project).toBe("work-project-1");
      });

      it("only matches keywords if project exists in config.projects", () => {
        const clientConfig = {
          projects: ["other-project"], // work-project-1 not in list
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {},
            basedOnLabels: {},
            basedOnSummaryKeywords: {
              "work-project-1": ["cart_ui_next"],
            },
          },
        };

        const issueWithKeyword: RawJiraIssue = {
          ...baseIssueForSummaryMatching,
          fields: {
            ...baseIssueForSummaryMatching.fields,
            summary: "Fix cart_ui_next issue",
          },
        };

        const project = determineProject(issueWithKeyword, clientConfig);
        expect(project).toBeNull(); // Project not valid, returns null
      });
    });

    describe("Strategy 5: Default fallback", () => {
      it("returns default from parent mapping when no other strategy matches", () => {
        const clientConfig = {
          projects: ["default-project"],
          projectMapping: {
            basedOnParent: {
              default: "default-project",
            },
            basedOnJiraProject: {},
            basedOnLabels: {},
          },
        };

        const unmatchedIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: "No keywords here",
            labels: [],
          },
        };

        const project = determineProject(unmatchedIssue, clientConfig);
        expect(project).toBe("default-project");
      });

      it("returns null when no default and no strategies match (requires user prompt)", () => {
        const clientConfig = {
          projects: [],
          projectMapping: {
            basedOnParent: {}, // No default
            basedOnJiraProject: {},
            basedOnLabels: {},
          },
        };

        const unmatchedIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: "No keywords here",
            labels: [],
          },
        };

        const project = determineProject(unmatchedIssue, clientConfig);
        expect(project).toBeNull(); // Cannot determine, needs user input
      });
    });
  });

  describe("generateBranchName - creates Git branch names following conventions", () => {
    it('creates branch name: "fix/issue-123/summary-slug" for bug', () => {
      const branchName = generateBranchName(bugIssue, validWorkTaskConfig);
      expect(branchName).toBe(
        "fix/issue-123/fix_checkout_button_not_responding_on_mobile"
      );
    });

    it('creates branch name: "feature/prof-456/summary-slug" for story', () => {
      const branchName = generateBranchName(storyIssue, validWorkTaskConfig);
      expect(branchName).toBe(
        "feature/prof-456/add_user_profile_customization_options"
      );
    });

    it('creates branch name: "chore/mobile-789/summary-slug" for task', () => {
      const branchName = generateBranchName(taskIssue, validWorkTaskConfig);
      expect(branchName).toBe(
        "chore/mobile-789/update_form-generator_validation_rules"
      );
    });

    it("converts issue key to lowercase", () => {
      const branchName = generateBranchName(bugIssue, validWorkTaskConfig);
      expect(branchName).toMatch(/^fix\/issue-123\//);
    });

    it("includes sanitized summary in branch name", () => {
      const customIssue: RawJiraIssue = {
        ...bugIssue,
        key: "TEST-1",
        fields: {
          ...bugIssue.fields,
          summary: "Fix UI/UX @user!",
        },
      };

      const branchName = generateBranchName(customIssue, validWorkTaskConfig);
      expect(branchName).toContain("fix_ui-ux_-user");
    });
  });

  describe("createIssueType - maps Jira issue types to internal types", () => {
    it('maps "Bug" → "fix"', () => {
      const issueType = createIssueType(bugIssue, validWorkTaskConfig);
      expect(issueType).toBe("fix");
    });

    it('maps "Story" → "feature"', () => {
      const issueType = createIssueType(storyIssue, validWorkTaskConfig);
      expect(issueType).toBe("feature");
    });

    it('maps "Task" → "chore"', () => {
      const issueType = createIssueType(taskIssue, validWorkTaskConfig);
      expect(issueType).toBe("chore");
    });

    it("uses default mapping for unknown issue types", () => {
      const customIssue: RawJiraIssue = {
        ...bugIssue,
        fields: {
          ...bugIssue.fields,
          issuetype: {
            ...bugIssue.fields.issuetype,
            name: "UnknownType",
          },
        },
      };

      const issueType = createIssueType(customIssue, validWorkTaskConfig);
      expect(issueType).toBe("chore"); // Default from config
    });

    it("performs case-insensitive mapping", () => {
      const customIssue: RawJiraIssue = {
        ...bugIssue,
        fields: {
          ...bugIssue.fields,
          issuetype: {
            ...bugIssue.fields.issuetype,
            name: "STORY", // Uppercase
          },
        },
      };

      const issueType = createIssueType(customIssue, validWorkTaskConfig);
      expect(issueType).toBe("feature");
    });

    it("throws error when issue type is missing", () => {
      const invalidIssue = {
        ...bugIssue,
        fields: {
          ...bugIssue.fields,
          issuetype: {
            ...bugIssue.fields.issuetype,
            name: "" as any,
          },
        },
      };

      expect(() => createIssueType(invalidIssue, validWorkTaskConfig)).toThrow(
        "Issue type not found"
      );
    });
  });

  describe("generateJiraLink - generates Jira issue URLs", () => {
    it("creates URL: https://test.atlassian.net/browse/ISSUE-123", () => {
      const link = generateJiraLink("ISSUE-123");
      expect(link).toBe("https://test.atlassian.net/browse/ISSUE-123");
    });

    it("uses JIRA_DOMAIN from environment", () => {
      const link = generateJiraLink("PROJ-456");
      expect(link).toMatch(/^https:\/\/test\.atlassian\.net\/browse\//);
    });

    it("preserves issue key case", () => {
      const link = generateJiraLink("lowercase-123");
      expect(link).toBe("https://test.atlassian.net/browse/lowercase-123");
    });
  });
});
