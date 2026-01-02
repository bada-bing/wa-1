import type { TaskConfig } from "../../src/types";

/**
 * Sample Valid Work Task Configuration
 *
 * This represents a typical work task configuration with all required fields.
 */
export const validWorkTaskConfig: TaskConfig = {
  type: "work-task",
  clients: {
    "work-client-1": {
      projects: ["work-project-1", "mobile-project", "new-project-summary"],
      projectMapping: {
        basedOnParent: {
          "PROJ-100": "work-project-1",
          "PROF-200": "mobile-project",
          default: "work-project-1",
        },
        basedOnJiraProject: {
          CART: "work-project-1",
          PROF: "mobile-project",
          MOBILE: "mobile-project",
        },
        basedOnLabels: {
          mobile: "mobile-project",
        },
        basedOnSummaryKeywords: {
          "work-project-1": ["work_project_1", "work project 1"],
          "mobile-project": ["mobile project"],
          "new-project-summary": ["new-summary-keyword"],
        },
      },
    },
  },
  problemTypeMapping: {
    story: "feature",
    bug: "fix",
    task: "chore",
    default: "chore",
  },
  vpn: {
    profileName: "corporate-vpn",
  },
  applications: {
    browserPath: "/Applications/Google Chrome.app",
    browserProfile: "Work",
  },
  logseq: {
    path: "/Users/test/Documents/LogSeq",
  },
  linear: {
    teamKey: "ENG",
  },
};

/**
 * Sample Valid Study Task Configuration
 *
 * This represents a study task configuration with study-specific fields.
 */
export const validStudyTaskConfig: TaskConfig = {
  type: "study-task",
  project: "learning",
  projects: ["learning"],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {},
  },
  taskTypeMapping: {
    default: "study",
  },
  logseq: {
    path: "/Users/test/Documents/LogSeq",
  },
  linear: {
    teamId: "team-abc-123",
  },
  clockify: {
    projectId: "study-project-456",
  },
  remnote: {
    exportPath: "/Users/test/Documents/RemNote/exports",
  },
  studySources: [
    { prefix: "FM", name: "Frontend Masters" },
    { prefix: "exercism", name: "Exercism" },
    { prefix: "leetcode", name: "LeetCode" },
  ],
  initiatives: [
    {
      name: "JavaScript Mastery",
      objectives: [{ name: "Learn TypeScript" }, { name: "Master React" }],
    },
    {
      name: "System Design",
      objectives: [
        { name: "Learn distributed systems" },
        { name: "Study scalability patterns" },
      ],
    },
  ],
};

/**
 * Invalid Config: Missing Required Fields
 *
 * This config is missing the required 'type' and 'logseq' fields.
 */
export const invalidConfigMissingFields = {
  project: "test-project",
  projects: ["test-project"],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {},
  },
  taskTypeMapping: {
    default: "chore",
  },
  // Missing: type, logseq
};

/**
 * Invalid Config: Wrong Type Value
 *
 * The 'type' field has an invalid value.
 */
export const invalidConfigWrongType = {
  type: "invalid-type", // Should be 'work-task' or 'study-task'
  project: "test-project",
  projects: ["test-project"],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {},
  },
  taskTypeMapping: {
    default: "chore",
  },
  logseq: {
    path: "/path/to/logseq",
  },
};

/**
 * Minimal Valid Config
 *
 * The minimum required fields for a valid configuration.
 */
export const minimalValidConfig: TaskConfig = {
  type: "work-task",
  project: "default-project",
  projects: ["default-project"],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {},
  },
  taskTypeMapping: {
    default: "chore",
  },
  logseq: {
    path: "/path/to/logseq",
  },
};
