import { describe, it, expect } from 'vitest';
import {
  determineProject,
  generateBranchName
} from '../../src/tasks/workTask';
import { createIssueType, type RawJiraIssue } from '../../src/integrations/jira/JiraClient';
import { generateJiraLink } from '../../src/utils/prepareMetadata';
import { bugIssue, storyIssue, taskIssue } from '../fixtures/jira-responses';
import { validWorkTaskConfig } from '../fixtures/configs';

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

describe('Jira Issue Adapter', () => {
  describe('determineProject - resolves project using multiple strategies', () => {
    describe('Strategy 1: Parent-based mapping', () => {
      it('returns project when parent issue is mapped in config', () => {
        // bugIssue has parent: CART-100
        const project = determineProject(bugIssue, validWorkTaskConfig);
        expect(project).toBe('cart-ui-next'); // Mapped in config: CART-100 → cart-ui-next
      });

      it('uses default from parent mapping when no specific parent matches', () => {
        const issueWithUnknownParent: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            summary: 'Generic task without keywords',
            parent: { key: 'UNKNOWN-999' },
            project: {
              ...taskIssue.fields.project,
              key: 'UNKNOWN' // Not in project mapping
            },
            labels: [] // No labels to match
          }
        };

        const project = determineProject(issueWithUnknownParent, validWorkTaskConfig);
        expect(project).toBe('cart-ui-next'); // Default from basedOnParent
      });
    });

    describe('Strategy 2: Jira project-based mapping', () => {
      it('returns project when Jira project key is mapped', () => {
        // taskIssue has project.key: FORM
        const issueWithoutParent: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined
          }
        };

        const project = determineProject(issueWithoutParent, validWorkTaskConfig);
        expect(project).toBe('form-generator'); // Mapped: FORM → form-generator
      });

      it('handles single string mapping from Jira project', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            ...validWorkTaskConfig.projectMapping,
            basedOnParent: {}, // No parent mapping
            basedOnJiraProject: {
              'TEST': 'test-project'
            }
          }
        };

        const testIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            project: {
              ...taskIssue.fields.project,
              key: 'TEST'
            }
          }
        };

        const project = determineProject(testIssue, config);
        expect(project).toBe('test-project');
      });

      it('returns single project from array mapping', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            ...validWorkTaskConfig.projectMapping,
            basedOnParent: {},
            basedOnJiraProject: {
              'MULTI': ['single-project'] // Array with one item
            }
          }
        };

        const testIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            project: {
              ...taskIssue.fields.project,
              key: 'MULTI'
            }
          }
        };

        const project = determineProject(testIssue, config);
        expect(project).toBe('single-project');
      });

      it('returns null for array mapping with multiple options (requires user prompt)', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            ...validWorkTaskConfig.projectMapping,
            basedOnParent: {},
            basedOnJiraProject: {
              'MULTI': ['project-a', 'project-b'] // Multiple options
            }
          }
        };

        const testIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            summary: 'Generic task without keywords',
            parent: undefined,
            project: {
              ...taskIssue.fields.project,
              key: 'MULTI'
            }
          }
        };

        const project = determineProject(testIssue, config);
        expect(project).toBeNull(); // Can't auto-determine, needs user input
      });
    });

    describe('Strategy 3: Label-based mapping', () => {
      it('returns project when issue label matches config mapping', () => {
        // storyIssue has labels: ['shopping-profile-ui', 'frontend']
        const issueWithLabels: RawJiraIssue = {
          ...storyIssue,
          fields: {
            ...storyIssue.fields,
            parent: undefined,
            project: {
              ...storyIssue.fields.project,
              key: 'UNKNOWN' // Not in project mapping
            }
          }
        };

        const project = determineProject(issueWithLabels, validWorkTaskConfig);
        expect(project).toBe('shopping-profile-ui'); // From labels mapping
      });

      it('ignores labels that map to projects not in config.projects', () => {
        const config = {
          ...validWorkTaskConfig,
          projects: ['valid-project'],
          projectMapping: {
            ...validWorkTaskConfig.projectMapping,
            basedOnParent: {},
            basedOnJiraProject: {},
            basedOnLabels: {
              'invalid-label': 'invalid-project' // Not in projects array
            }
          }
        };

        const issueWithInvalidLabel: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            labels: ['invalid-label']
          }
        };

        const project = determineProject(issueWithInvalidLabel, config);
        expect(project).toBeNull(); // Invalid project, returns null
      });

      it('matches labels case-insensitively', () => {
        const config = {
          ...validWorkTaskConfig,
          projects: ['cart-project'], // Add cart-project to valid projects
          projectMapping: {
            ...validWorkTaskConfig.projectMapping,
            basedOnParent: {},
            basedOnJiraProject: {},
            basedOnLabels: {
              'cart-ui': 'cart-project'
            }
          }
        };

        const issueWithUppercaseLabel: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            summary: 'Generic task without keywords',
            parent: undefined,
            labels: ['CART-UI'] // Uppercase
          }
        };

        const project = determineProject(issueWithUppercaseLabel, config);
        expect(project).toBe('cart-project');
      });
    });

    describe('Strategy 4: Summary keyword matching', () => {
      it('detects "cart_ui_next" keyword in summary', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {}
          }
        };

        const issueWithKeyword: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: 'Fix cart_ui_next styling issue'
          }
        };

        const project = determineProject(issueWithKeyword, config);
        expect(project).toBe('cart-ui-next');
      });

      it('detects "shopping-profile" keyword in summary', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {}
          }
        };

        const issueWithKeyword: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: 'Update shopping-profile API integration'
          }
        };

        const project = determineProject(issueWithKeyword, config);
        expect(project).toBe('shopping-profile-ui');
      });

      it('detects "form_generator" keyword in summary', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {}
          }
        };

        const issueWithKeyword: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: 'Refactor form_generator validation'
          }
        };

        const project = determineProject(issueWithKeyword, config);
        expect(project).toBe('form-generator');
      });

      it('only matches keywords if project exists in config.projects', () => {
        const config = {
          ...validWorkTaskConfig,
          projects: ['other-project'], // cart-ui-next not in list
          projectMapping: {
            basedOnParent: {},
            basedOnJiraProject: {}
          }
        };

        const issueWithKeyword: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: 'Fix cart_ui_next issue'
          }
        };

        const project = determineProject(issueWithKeyword, config);
        expect(project).toBeNull(); // Project not valid, returns null
      });
    });

    describe('Strategy 5: Default fallback', () => {
      it('returns default from parent mapping when no other strategy matches', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            basedOnParent: {
              'default': 'default-project'
            },
            basedOnJiraProject: {}
          }
        };

        const unmatchedIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: 'No keywords here',
            labels: []
          }
        };

        const project = determineProject(unmatchedIssue, config);
        expect(project).toBe('default-project');
      });

      it('returns null when no default and no strategies match (requires user prompt)', () => {
        const config = {
          ...validWorkTaskConfig,
          projectMapping: {
            basedOnParent: {}, // No default
            basedOnJiraProject: {}
          }
        };

        const unmatchedIssue: RawJiraIssue = {
          ...taskIssue,
          fields: {
            ...taskIssue.fields,
            parent: undefined,
            summary: 'No keywords here',
            labels: []
          }
        };

        const project = determineProject(unmatchedIssue, config);
        expect(project).toBeNull(); // Cannot determine, needs user input
      });
    });
  });

  describe('generateBranchName - creates Git branch names following conventions', () => {
    it('creates branch name: "fix/cart-123/summary-slug" for bug', () => {
      const branchName = generateBranchName(bugIssue, validWorkTaskConfig);
      expect(branchName).toBe('fix/cart-123/fix_checkout_button_not_responding_on_mobile');
    });

    it('creates branch name: "feature/prof-456/summary-slug" for story', () => {
      const branchName = generateBranchName(storyIssue, validWorkTaskConfig);
      expect(branchName).toBe('feature/prof-456/add_user_profile_customization_options');
    });

    it('creates branch name: "chore/form-789/summary-slug" for task', () => {
      const branchName = generateBranchName(taskIssue, validWorkTaskConfig);
      expect(branchName).toBe('chore/form-789/update_form-generator_validation_rules');
    });

    it('converts issue key to lowercase', () => {
      const branchName = generateBranchName(bugIssue, validWorkTaskConfig);
      expect(branchName).toMatch(/^fix\/cart-123\//);
    });

    it('includes sanitized summary in branch name', () => {
      const customIssue: RawJiraIssue = {
        ...bugIssue,
        key: 'TEST-1',
        fields: {
          ...bugIssue.fields,
          summary: 'Fix UI/UX @user!'
        }
      };

      const branchName = generateBranchName(customIssue, validWorkTaskConfig);
      expect(branchName).toContain('fix_ui-ux_-user');
    });
  });

  describe('createIssueType - maps Jira issue types to internal types', () => {
    it('maps "Bug" → "fix"', () => {
      const issueType = createIssueType(bugIssue, validWorkTaskConfig);
      expect(issueType).toBe('fix');
    });

    it('maps "Story" → "feature"', () => {
      const issueType = createIssueType(storyIssue, validWorkTaskConfig);
      expect(issueType).toBe('feature');
    });

    it('maps "Task" → "chore"', () => {
      const issueType = createIssueType(taskIssue, validWorkTaskConfig);
      expect(issueType).toBe('chore');
    });

    it('uses default mapping for unknown issue types', () => {
      const customIssue: RawJiraIssue = {
        ...bugIssue,
        fields: {
          ...bugIssue.fields,
          issuetype: {
            ...bugIssue.fields.issuetype,
            name: 'UnknownType'
          }
        }
      };

      const issueType = createIssueType(customIssue, validWorkTaskConfig);
      expect(issueType).toBe('chore'); // Default from config
    });

    it('performs case-insensitive mapping', () => {
      const customIssue: RawJiraIssue = {
        ...bugIssue,
        fields: {
          ...bugIssue.fields,
          issuetype: {
            ...bugIssue.fields.issuetype,
            name: 'STORY' // Uppercase
          }
        }
      };

      const issueType = createIssueType(customIssue, validWorkTaskConfig);
      expect(issueType).toBe('feature');
    });

    it('throws error when issue type is missing', () => {
      const invalidIssue = {
        ...bugIssue,
        fields: {
          ...bugIssue.fields,
          issuetype: {
            ...bugIssue.fields.issuetype,
            name: '' as any
          }
        }
      };

      expect(() => createIssueType(invalidIssue, validWorkTaskConfig)).toThrow('Issue type not found');
    });
  });

  describe('generateJiraLink - generates Jira issue URLs', () => {
    it('creates URL: https://test.atlassian.net/browse/CART-123', () => {
      const link = generateJiraLink('CART-123');
      expect(link).toBe('https://test.atlassian.net/browse/CART-123');
    });

    it('uses JIRA_DOMAIN from environment', () => {
      const link = generateJiraLink('PROJ-456');
      expect(link).toMatch(/^https:\/\/test\.atlassian\.net\/browse\//);
    });

    it('preserves issue key case', () => {
      const link = generateJiraLink('lowercase-123');
      expect(link).toBe('https://test.atlassian.net/browse/lowercase-123');
    });
  });
});
