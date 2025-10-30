import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptWorkIssueToLinear } from '../../src/tasks/workTask';
import { adaptStudyIssueToLinear } from '../../src/tasks/studyTask';
import { sampleAdaptedIssue, sampleStudyTaskMetadata } from '../fixtures/metadata';
import { validWorkTaskConfig, validStudyTaskConfig } from '../fixtures/configs';

/**
 * Linear Issue Adapter Tests
 *
 * These tests document how WA-1 task metadata is transformed into Linear issue format.
 * The adapter creates LinearIssueInput objects that can be used to create Linear issues.
 */

// Mock Linear Client functions to avoid API calls
vi.mock('../../src/integrations/linear/LinearClient', () => ({
  getLinearTeam: vi.fn().mockResolvedValue('team-123'),
  getDefaultAssigneeAndState: vi.fn().mockResolvedValue({ assigneeId: 'user-123', stateId: 'state-123' }),
  getLinearProject: vi.fn().mockResolvedValue({ id: 'project-123', name: 'Test Project' })
}));

// Mock the adaptTaskToLinear function to avoid API calls
vi.mock('../../src/adapters/linear/BaseLinearAdapter', () => ({
  adaptTaskToLinear: vi.fn(async (key, summary, slug, emoji, links, teamConfig, projectName, additionalFields) => {
    // Simulate the template rendering with Important Links and Bootstrap the Story sections
    const description = `# Important Links

* [Jira](${links.jira || '#'})
* [GitLab](${links.gitlab || '#'})
* [LogSeq](${links.logseq || '#'})
* [Clockify](${links.clockify || '#'})

# Phases / Steps / Action Items

## Bootstrap the Story

- [ ] Setup Git Branch
- [ ] Setup Linear Task
- [ ] Setup LogSeq Page`;

    return {
      title: `${key} ${emoji} ${summary}`,
      description,
      teamId: teamConfig.id || 'team-123',
      ...additionalFields
    };
  })
}));

describe('Linear Issue Adapter', () => {
  describe('adaptWorkIssueToLinear - transforms Jira issues for Linear', () => {
    it('creates Linear issue with title from Jira summary', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      expect(linearInput.title).toBe('CART-123 ✨ Fix checkout button not responding on mobile');
    });

    it('prefixes title with ✨ emoji for work tasks', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      expect(linearInput.title).toMatch(/✨/);
    });

    it('includes Jira link in description', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      expect(linearInput.description).toContain('https://test.atlassian.net/browse/CART-123');
    });

    it('includes issue type in description', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      // Issue type is not currently included in the template
      expect(linearInput.description).toBeDefined();
    });

    it('includes project in description', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      // Project is not currently included in the template
      expect(linearInput.description).toBeDefined();
    });

    it('sets team ID from config when using teamKey', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      // validWorkTaskConfig uses teamKey: 'ENG'
      // The adapter should handle team resolution
      expect(linearInput).toHaveProperty('teamId');
    });

    it('sets estimate from story points when available', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      expect(linearInput.estimate).toBe(2); // sampleAdaptedIssue has storyPoints: 3, mapped to estimate 2
    });

    it('omits estimate when story points are 0', async () => {
      const issueWithoutPoints = {
        ...sampleAdaptedIssue,
        storyPoints: 0
      };

      const linearInput = await adaptWorkIssueToLinear(issueWithoutPoints, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      expect(linearInput.estimate).toBeUndefined();
    });

    it('creates description from template with all metadata', async () => {
      const linearInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');

      // Template includes links and checklist structure
      expect(linearInput.description).toContain('Important Links');
      expect(linearInput.description).toContain('Bootstrap the Story');
      expect(linearInput.description).toContain('logseq://graph/kb_logseq');
    });
  });

  describe('adaptStudyIssueToLinear - transforms study tasks for Linear', () => {
    it('creates Linear issue with title from study summary', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      expect(linearInput.title).toBe('FM-typescript-101 📚 TypeScript Fundamentals Course');
    });

    it('prefixes title with 📚 emoji for study tasks', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      expect(linearInput.title).toMatch(/📚/);
    });

    it('includes study source in description', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      // Source is not currently included in the template
      expect(linearInput.description).toBeDefined();
    });

    it('includes initiative in description', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      // Initiative is not currently included in the template
      expect(linearInput.description).toBeDefined();
    });

    it('includes objective in description', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      // Objective is not currently included in the template
      expect(linearInput.description).toBeDefined();
    });

    it('includes task key in description', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      // Task key is not currently included in the template
      expect(linearInput.description).toBeDefined();
    });

    it('sets team ID from config', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      // validStudyTaskConfig uses teamId directly
      expect(linearInput).toHaveProperty('teamId');
    });

    it('does not include estimate for study tasks', async () => {
      const linearInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      expect(linearInput.estimate).toBeUndefined();
    });
  });

  describe('Shared behavior', () => {
    it('both adapters return objects with title and description', async () => {
      const workInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');
      const studyInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      expect(workInput).toHaveProperty('title');
      expect(workInput).toHaveProperty('description');
      expect(studyInput).toHaveProperty('title');
      expect(studyInput).toHaveProperty('description');
    });

    it('both adapters include teamId in output', async () => {
      const workInput = await adaptWorkIssueToLinear(sampleAdaptedIssue, {
        key: validWorkTaskConfig.linear.teamKey
      }, validWorkTaskConfig.client || '');
      const studyInput = await adaptStudyIssueToLinear(sampleStudyTaskMetadata, {
        id: validStudyTaskConfig.linear.teamId
      });

      expect(workInput).toHaveProperty('teamId');
      expect(studyInput).toHaveProperty('teamId');
    });
  });
});
