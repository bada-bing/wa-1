import { vi } from 'vitest';
import type { RawJiraIssue } from '../../src/utils/jira';

/**
 * Mock Jira API Client
 *
 * Provides mock functions for Jira integration testing.
 */
export const createMockJiraClient = () => ({
  fetchIssue: vi.fn<[string], Promise<RawJiraIssue>>()
});

/**
 * Mock the entire jira utils module
 *
 * Usage in tests:
 * ```typescript
 * import { mockJiraModule } from '../mocks/jira';
 * import { bugIssue } from '../fixtures/jira-responses';
 *
 * mockJiraModule();
 *
 * vi.mocked(fetchIssue).mockResolvedValue(bugIssue);
 * ```
 */
export const mockJiraModule = () => {
  vi.mock('../../src/utils/jira', () => ({
    fetchIssue: vi.fn()
  }));
};
