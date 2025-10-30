import { vi } from 'vitest';

/**
 * Mock Linear SDK Client
 *
 * Provides mock functions for Linear integration testing.
 */
export const createMockLinearClient = () => ({
  createIssue: vi.fn().mockResolvedValue({
    success: true,
    issue: {
      id: 'linear-issue-123',
      url: 'https://linear.app/team/issue/ENG-123'
    }
  }),
  getTeam: vi.fn().mockResolvedValue({
    id: 'team-123',
    key: 'ENG',
    name: 'Engineering'
  })
});

/**
 * Mock the entire linear utils module
 *
 * Usage in tests:
 * ```typescript
 * import { mockLinearModule } from '../mocks/linear';
 *
 * mockLinearModule();
 *
 * // Tests can now run without real Linear API calls
 * ```
 */
export const mockLinearModule = () => {
  vi.mock('../../src/utils/linear', () => ({
    executeLinearProcedure: vi.fn().mockResolvedValue(undefined),
    getLinearTeam: vi.fn().mockResolvedValue({ id: 'team-123', key: 'ENG' })
  }));
};
