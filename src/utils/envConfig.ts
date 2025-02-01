const REQUIRED_ENV_VARS = [
  "JIRA_API_TOKEN",
  "JIRA_DOMAIN",
  "JIRA_USER",
  "LINEAR_API_KEY",
] as const;

// [number] is 'indexed access type operator' and converts the tuple into a union of its element types
type EnvVars = {
  [K in (typeof REQUIRED_ENV_VARS)[number]]: string;
};

function validateEnv(): EnvVars {
  const required = REQUIRED_ENV_VARS;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return process.env as unknown as EnvVars;
}

export const env = {
  get: (key: keyof EnvVars, defaultValue?: string): string => {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable not found: ${key}`);
    }
    return value || defaultValue || "";
  },

  validate: validateEnv,
};
