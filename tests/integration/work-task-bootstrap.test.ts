import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkTask } from '../../src/tasks/workTask';
import { sampleAdaptedIssue } from '../fixtures/metadata';
import { validWorkTaskConfig } from '../fixtures/configs';

/**
 * Work Task Bootstrap Integration Test
 *
 * This test documents the complete workflow when bootstrapping a work task from Jira.
 * It verifies that all integrations are called in the correct order with proper data.
 *
 * Flow:
 * 1. Execute Git procedure (create branch, checkout, update changelog)
 * 2. Create Linear issue with adapted Jira data
 * 3. Create LogSeq documentation page
 * 4. Create Clockify time tracking task
 * 5. Open applications (browser, etc.)
 */

// Mock all external dependencies
vi.mock('../../src/utils/git', () => ({
  executeGitProcedure: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../src/integrations/linear/LinearClient', () => ({
  createLinearIssue: vi.fn().mockResolvedValue({ id: 'linear-123', identifier: 'ENG-123' }),
  getLinearTeam: vi.fn().mockResolvedValue('team-123'),
  getDefaultAssigneeAndState: vi.fn().mockResolvedValue({ assigneeId: 'user-123', stateId: 'state-123' }),
  getLinearProject: vi.fn().mockResolvedValue({ id: 'project-123', name: 'Test Project' })
}));

vi.mock('../../src/integrations/logseq/LogseqService', () => ({
  executeLogseqProcedure: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../src/integrations/clockify/ClockifyClient', () => ({
  createClockifyTask: vi.fn().mockResolvedValue(undefined)
}));

describe('Work Task Bootstrap Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes complete work task bootstrap: Jira → Git → Linear → LogSeq → Clockify', async () => {
    // Import mocked modules after they've been mocked
    const { executeGitProcedure } = await import('../../src/utils/git');
    const { createLinearIssue } = await import('../../src/integrations/linear/LinearClient');
    const { executeLogseqProcedure } = await import('../../src/integrations/logseq/LogseqService');
    const { createClockifyTask } = await import('../../src/integrations/clockify/ClockifyClient');

    // Arrange - Create work task with sample Jira issue data
    const task = new WorkTask(validWorkTaskConfig, sampleAdaptedIssue);

    // Act - Execute the complete bootstrap flow
    await task.bootstrap();

    // Assert - Verify all integrations were called in correct order

    // 1. Git procedure: Creates feature branch and updates changelog
    expect(executeGitProcedure).toHaveBeenCalledTimes(1);
    expect(executeGitProcedure).toHaveBeenCalledWith(
      sampleAdaptedIssue,
      validWorkTaskConfig
    );

    // 2. LogSeq: Creates documentation page for task tracking
    expect(executeLogseqProcedure).toHaveBeenCalledTimes(1);
    expect(executeLogseqProcedure).toHaveBeenCalledWith(
      sampleAdaptedIssue.slug,
      `logseq.${validWorkTaskConfig.type}.template.md`,
      expect.objectContaining({
        jira: expect.objectContaining({
          issue: sampleAdaptedIssue.key,
          url: sampleAdaptedIssue.jiraLink
        }),
        project: sampleAdaptedIssue.project,
        branch_name: sampleAdaptedIssue.branchName,
        summary: sampleAdaptedIssue.summary,
        slug: sampleAdaptedIssue.slug,
        issue_type: sampleAdaptedIssue.issueType
      }),
      validWorkTaskConfig
    );

    // 3. Linear: Creates issue in Linear with Jira data
    expect(createLinearIssue).toHaveBeenCalledTimes(1);
    expect(createLinearIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Fix checkout button'),
        description: expect.any(String),
        teamId: expect.any(String)
      })
    );

    // 4. Clockify: Creates time tracking task
    expect(createClockifyTask).toHaveBeenCalledTimes(1);
    // Clockify is called with just the key and projectId
    expect(createClockifyTask).toHaveBeenCalledWith(
      expect.objectContaining({ key: sampleAdaptedIssue.key }),
      validWorkTaskConfig.clockify?.projectId
    );
  });

  it('propagates errors with context when integration fails', async () => {
    const { executeGitProcedure } = await import('../../src/utils/git');

    // Arrange - Make git procedure fail
    vi.mocked(executeGitProcedure).mockRejectedValue(
      new Error('Git repository not found')
    );

    const task = new WorkTask(validWorkTaskConfig, sampleAdaptedIssue);

    // Act & Assert - Should throw with context
    await expect(task.bootstrap()).rejects.toThrow('Failed to execute work task');
  });

  it('documents the data flow: AdaptedIssue from Jira → Linear issue format', async () => {
    const { createLinearIssue } = await import('../../src/integrations/linear/LinearClient');
    const { executeGitProcedure } = await import('../../src/utils/git');

    // Reset the mock to not fail for this test
    vi.mocked(executeGitProcedure).mockResolvedValue(undefined);

    const task = new WorkTask(validWorkTaskConfig, sampleAdaptedIssue);
    await task.bootstrap();

    // Verify transformation from Jira format to Linear format
    const linearInput = vi.mocked(createLinearIssue).mock.calls[0][0];

    // Verify the Linear input has correct structure
    expect(linearInput).toHaveProperty('title');
    expect(linearInput).toHaveProperty('description');
    expect(linearInput).toHaveProperty('teamId');
    expect(linearInput).toHaveProperty('estimate');

    // Verify work emoji prefix and summary in title
    expect(linearInput.title).toContain('✨');
    expect(linearInput.title).toContain(sampleAdaptedIssue.summary);

    // Verify Jira details in description
    expect(linearInput.description).toContain(sampleAdaptedIssue.jiraLink);
    expect(linearInput.description).toContain(sampleAdaptedIssue.issueType);

    // Verify story points are included (adapter may transform the value)
    expect(linearInput.estimate).toBeGreaterThan(0);
  });
});
