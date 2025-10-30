/**
 * Vitest Global Setup
 *
 * This file runs before all tests to set up the test environment.
 */

import { vi } from 'vitest';

// Stub environment variables for tests
vi.stubEnv('LINEAR_API_KEY', 'test-linear-api-key');
vi.stubEnv('JIRA_USER', 'test@example.com');
vi.stubEnv('JIRA_API_TOKEN', 'test-jira-token');
vi.stubEnv('JIRA_DOMAIN', 'https://test.atlassian.net');
vi.stubEnv('CLOCKIFY_API_KEY', 'test-clockify-key');
vi.stubEnv('CLOCKIFY_WORKSPACE_ID', 'test-workspace-id');

// Silence console output during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: vi.fn(),
//   error: vi.fn(),
//   warn: vi.fn(),
// };
