import type { TaskConfig } from '../../src/types';
import { validWorkTaskConfig, validStudyTaskConfig } from '../fixtures/configs';

/**
 * Test Utility Functions
 *
 * Common helper functions used across multiple tests.
 */

/**
 * Create a test config with optional overrides
 *
 * Usage:
 * ```typescript
 * const config = createTestConfig({
 *   project: 'my-custom-project'
 * });
 * ```
 */
export function createTestConfig(overrides: Partial<TaskConfig> = {}): TaskConfig {
  return {
    ...validWorkTaskConfig,
    ...overrides
  };
}

/**
 * Create a study task config with optional overrides
 */
export function createStudyTaskConfig(overrides: Partial<TaskConfig> = {}): TaskConfig {
  return {
    ...validStudyTaskConfig,
    ...overrides
  };
}

/**
 * Wait for async operations (useful for testing async flows)
 */
export const wait = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Assert that a function throws a specific error message
 */
export async function expectToThrowAsync(
  fn: () => Promise<any>,
  expectedMessage?: string
): Promise<void> {
  let error: Error | undefined;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw, but it did not');
  }

  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(
      `Expected error message to include "${expectedMessage}", but got "${error.message}"`
    );
  }
}
