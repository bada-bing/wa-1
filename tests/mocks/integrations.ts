import { vi } from 'vitest';

/**
 * Mock all integration modules
 *
 * This mocks all external integrations (Clockify, LogSeq, RemNote)
 * so tests can run without actual API calls or file system operations.
 *
 * Usage:
 * ```typescript
 * import { mockAllIntegrations } from '../mocks/integrations';
 *
 * beforeEach(() => {
 *   mockAllIntegrations();
 * });
 * ```
 */
export const mockAllIntegrations = () => {
  // Mock Clockify
  vi.mock('../../src/clockify', () => ({
    createClockifyTask: vi.fn().mockResolvedValue(undefined)
  }));

  // Mock LogSeq
  vi.mock('../../src/logseq', () => ({
    executeLogseqProcedure: vi.fn().mockResolvedValue(undefined)
  }));

  // Mock RemNote
  vi.mock('../../src/remnote', () => ({
    executeRemNoteProcedure: vi.fn().mockResolvedValue(undefined)
  }));

  // Mock Git operations
  vi.mock('../../src/utils/git', () => ({
    executeGitProcedure: vi.fn().mockResolvedValue(undefined),
    createBranch: vi.fn().mockResolvedValue(undefined),
    checkoutBranch: vi.fn().mockResolvedValue(undefined)
  }));
};

/**
 * Create spy-able mock integrations
 *
 * Returns an object with mock functions that can be asserted in tests.
 */
export const createMockIntegrations = () => ({
  clockify: {
    createTask: vi.fn().mockResolvedValue(undefined)
  },
  logseq: {
    createPage: vi.fn().mockResolvedValue(undefined)
  },
  remnote: {
    exportMarkdown: vi.fn().mockResolvedValue(undefined)
  },
  git: {
    executeGitProcedure: vi.fn().mockResolvedValue(undefined)
  },
  linear: {
    executeLinearProcedure: vi.fn().mockResolvedValue(undefined)
  }
});
