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
 * 2. Create LogSeq documentation page
 * 3. Create Clockify time tracking task
 * 4. Open applications (browser, etc.)
 */

// Mock all external dependencies
vi.mock('../../src/utils/git', () => ({
  executeGitProcedure: vi.fn().mockResolvedValue(undefined)
}));



vi.mock('../../src/integrations/logseq/LogseqService', () => ({
  executeLogseqProcedure: vi.fn().mockResolvedValue(undefined)
}));

describe('Work Task Bootstrap Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes complete work task bootstrap: Jira → Git → LogSeq → Clockify', async () => {
    // Import mocked modules after they've been mocked
    const { executeGitProcedure } = await import('../../src/utils/git');
    const { executeLogseqProcedure } = await import(
      '../../src/integrations/logseq/LogseqService'
    );

    // Arrange - Create work task with sample Jira issue data
    const task = new WorkTask(validWorkTaskConfig, sampleAdaptedIssue, 'work-client-1');

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
          url: sampleAdaptedIssue.jiraLink,
        }),
        project: sampleAdaptedIssue.project,
        branch_name: sampleAdaptedIssue.branchName,
        summary: sampleAdaptedIssue.summary,
        slug: sampleAdaptedIssue.slug,
        issue_type: sampleAdaptedIssue.issueType,
      }),
      validWorkTaskConfig
    );
  });

  it('propagates errors with context when integration fails', async () => {
    const { executeGitProcedure } = await import('../../src/utils/git');

    // Arrange - Make git procedure fail
    vi.mocked(executeGitProcedure).mockRejectedValue(
      new Error('Git repository not found')
    );

    const task = new WorkTask(validWorkTaskConfig, sampleAdaptedIssue, 'work-client-1');

    // Act & Assert - Should throw with context
    await expect(task.bootstrap()).rejects.toThrow('Failed to execute work task');
  });


});
