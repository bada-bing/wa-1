import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function executeCommand(
  command: string,
  cwd?: string
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });

    // FIXME depending on the use-cases and the cli applications which you use stderr should not affect the result of the application
    // - so you could consider to throw this error in finally block (e.g., use let stderr; and in finally check if that stderr variable is not null)
    if (stderr) {
      throw new Error(stderr);
    }

    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Command execution failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
