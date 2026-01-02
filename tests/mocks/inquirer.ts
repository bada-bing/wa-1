import { vi } from "vitest";

/**
 * Mock Inquirer Prompts
 *
 * Allows tests to simulate user input without actual CLI interaction.
 *
 * Usage:
 * ```typescript
 * import { mockInquirerPrompts } from '../mocks/inquirer';
 *
 * mockInquirerPrompts({
 *   project: 'work-project-1',
 *   source: 'Frontend Masters'
 * });
 * ```
 */
export const mockInquirerPrompts = (answers: Record<string, any>) => {
  vi.mock("inquirer", () => ({
    default: {
      prompt: vi.fn().mockResolvedValue(answers),
    },
  }));
};

/**
 * Create a configurable mock for inquirer
 */
export const createMockInquirer = () => {
  const promptMock = vi.fn();

  return {
    prompt: promptMock,
    setAnswer: (key: string, value: any) => {
      promptMock.mockResolvedValueOnce({ [key]: value });
    },
    setAnswers: (answers: Record<string, any>) => {
      promptMock.mockResolvedValueOnce(answers);
    },
  };
};
