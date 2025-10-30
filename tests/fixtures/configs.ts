import type { TaskConfig } from '../../src/types';

/**
 * Sample Valid Work Task Configuration
 *
 * This represents a typical work task configuration with all required fields.
 */
export const validWorkTaskConfig: TaskConfig = {
  type: 'work-task',
  project: 'cart-ui-next',
  projects: ['cart-ui-next', 'shopping-profile-ui', 'form-generator'],
  projectMapping: {
    basedOnParent: {
      'CART-100': 'cart-ui-next',
      'PROF-200': 'shopping-profile-ui',
      'default': 'cart-ui-next'
    },
    basedOnJiraProject: {
      'CART': 'cart-ui-next',
      'PROF': 'shopping-profile-ui',
      'FORM': 'form-generator'
    },
    basedOnLabels: {
      'shopping-profile-ui': 'shopping-profile-ui',
      'form-generator': 'form-generator'
    }
  },
  taskTypeMapping: {
    'story': 'feature',
    'bug': 'fix',
    'task': 'chore',
    'default': 'chore'
  },
  vpn: {
    profileName: 'corporate-vpn'
  },
  applications: {
    browserPath: '/Applications/Google Chrome.app',
    browserProfile: 'Work'
  },
  logseq: {
    path: '/Users/test/Documents/LogSeq'
  },
  linear: {
    teamKey: 'ENG'
  },
  clockify: {
    projectId: 'clockify-project-123'
  }
};

/**
 * Sample Valid Study Task Configuration
 *
 * This represents a study task configuration with study-specific fields.
 */
export const validStudyTaskConfig: TaskConfig = {
  type: 'study-task',
  project: 'learning',
  projects: ['learning'],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {}
  },
  taskTypeMapping: {
    'default': 'study'
  },
  logseq: {
    path: '/Users/test/Documents/LogSeq'
  },
  linear: {
    teamId: 'team-abc-123'
  },
  clockify: {
    projectId: 'study-project-456'
  },
  remnote: {
    exportPath: '/Users/test/Documents/RemNote/exports'
  },
  studySources: [
    { prefix: 'FM', name: 'Frontend Masters' },
    { prefix: 'exercism', name: 'Exercism' },
    { prefix: 'leetcode', name: 'LeetCode' }
  ],
  initiatives: [
    {
      name: 'JavaScript Mastery',
      objectives: [
        { name: 'Learn TypeScript' },
        { name: 'Master React' }
      ]
    },
    {
      name: 'System Design',
      objectives: [
        { name: 'Learn distributed systems' },
        { name: 'Study scalability patterns' }
      ]
    }
  ]
};

/**
 * Invalid Config: Missing Required Fields
 *
 * This config is missing the required 'type' and 'logseq' fields.
 */
export const invalidConfigMissingFields = {
  project: 'test-project',
  projects: ['test-project'],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {}
  },
  taskTypeMapping: {
    'default': 'chore'
  }
  // Missing: type, logseq
};

/**
 * Invalid Config: Wrong Type Value
 *
 * The 'type' field has an invalid value.
 */
export const invalidConfigWrongType = {
  type: 'invalid-type', // Should be 'work-task' or 'study-task'
  project: 'test-project',
  projects: ['test-project'],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {}
  },
  taskTypeMapping: {
    'default': 'chore'
  },
  logseq: {
    path: '/path/to/logseq'
  }
};

/**
 * Minimal Valid Config
 *
 * The minimum required fields for a valid configuration.
 */
export const minimalValidConfig: TaskConfig = {
  type: 'work-task',
  project: 'default-project',
  projects: ['default-project'],
  projectMapping: {
    basedOnParent: {},
    basedOnJiraProject: {}
  },
  taskTypeMapping: {
    'default': 'chore'
  },
  logseq: {
    path: '/path/to/logseq'
  }
};
