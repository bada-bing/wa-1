import type { RawJiraIssue } from '../../src/utils/jira';

/**
 * Sample Jira Bug Issue
 *
 * Represents a typical bug issue from the Shopping Cart project.
 * This fixture demonstrates:
 * - Bug issue type
 * - Has parent epic (CART-100)
 * - 3 story points
 * - Active in progress
 */
export const bugIssue: RawJiraIssue = {
  id: '12345',
  key: 'CART-123',
  fields: {
    summary: 'Fix checkout button not responding on mobile',
    description: {
      type: 'doc',
      version: 1,
      content: []
    },
    issuetype: {
      id: '10001',
      name: 'Bug',
      subtask: false,
      hierarchyLevel: 0
    },
    parent: {
      key: 'CART-100'
    },
    project: {
      id: '10001',
      key: 'CART',
      name: 'Shopping Cart',
      projectTypeKey: 'software'
    },
    status: {
      id: '3',
      name: 'In Progress',
      description: 'This issue is being actively worked on',
      statusCategory: {
        id: 4,
        key: 'indeterminate',
        colorName: 'yellow',
        name: 'In Progress'
      }
    },
    priority: {
      id: '2',
      name: 'High'
    },
    assignee: {
      accountId: 'user123',
      displayName: 'John Doe',
      emailAddress: 'john@example.com',
      active: true
    },
    created: '2024-01-15T10:00:00.000Z',
    updated: '2024-01-16T14:30:00.000Z',
    resolutiondate: null,
    resolution: null,
    labels: [],
    duedate: null,
    timetracking: {},
    customfield_10008: 3, // Story Points
    subtasks: [],
    issuelinks: []
  }
};

/**
 * Sample Jira Story Issue
 *
 * Represents a user story for a new feature.
 * This fixture demonstrates:
 * - Story issue type
 * - No parent (top-level story)
 * - 5 story points
 * - Has labels for project identification
 */
export const storyIssue: RawJiraIssue = {
  id: '12346',
  key: 'PROF-456',
  fields: {
    summary: 'Add user profile customization options',
    description: {
      type: 'doc',
      version: 1,
      content: []
    },
    issuetype: {
      id: '10002',
      name: 'Story',
      subtask: false,
      hierarchyLevel: 0
    },
    project: {
      id: '10002',
      key: 'PROF',
      name: 'Profile',
      projectTypeKey: 'software'
    },
    status: {
      id: '1',
      name: 'To Do',
      description: 'Task is waiting to be started',
      statusCategory: {
        id: 2,
        key: 'new',
        colorName: 'blue-gray',
        name: 'To Do'
      }
    },
    priority: {
      id: '3',
      name: 'Medium'
    },
    assignee: null,
    created: '2024-01-10T09:00:00.000Z',
    updated: '2024-01-10T09:00:00.000Z',
    resolutiondate: null,
    resolution: null,
    labels: ['shopping-profile-ui', 'frontend'],
    duedate: '2024-02-01',
    timetracking: {
      originalEstimate: '2w'
    },
    customfield_10008: 5, // Story Points
    subtasks: [],
    issuelinks: []
  }
};

/**
 * Sample Task Issue (No Parent, No Story Points)
 *
 * Represents a simple task with minimal information.
 * This fixture demonstrates:
 * - Task issue type
 * - No parent epic
 * - No story points
 * - Summary contains keywords for project detection
 */
export const taskIssue: RawJiraIssue = {
  id: '12347',
  key: 'FORM-789',
  fields: {
    summary: 'Update form_generator validation rules',
    description: {
      type: 'doc',
      version: 1,
      content: []
    },
    issuetype: {
      id: '10003',
      name: 'Task',
      subtask: false,
      hierarchyLevel: 0
    },
    project: {
      id: '10003',
      key: 'FORM',
      name: 'Form System',
      projectTypeKey: 'software'
    },
    status: {
      id: '1',
      name: 'To Do',
      description: 'Task is waiting to be started',
      statusCategory: {
        id: 2,
        key: 'new',
        colorName: 'blue-gray',
        name: 'To Do'
      }
    },
    priority: {
      id: '3',
      name: 'Medium'
    },
    assignee: {
      accountId: 'user456',
      displayName: 'Jane Smith',
      emailAddress: 'jane@example.com',
      active: true
    },
    created: '2024-01-12T11:00:00.000Z',
    updated: '2024-01-12T11:00:00.000Z',
    resolutiondate: null,
    resolution: null,
    labels: [],
    duedate: null,
    timetracking: {},
    customfield_10008: null, // No story points
    subtasks: [],
    issuelinks: []
  }
};

/**
 * Sample Issue with Special Characters in Summary
 *
 * Tests edge cases in slug generation and sanitization.
 */
export const issueWithSpecialCharacters: RawJiraIssue = {
  id: '12348',
  key: 'TEST-999',
  fields: {
    summary: 'Fix UI/UX issue @user profile! (mobile)',
    description: {
      type: 'doc',
      version: 1,
      content: []
    },
    issuetype: {
      id: '10001',
      name: 'Bug',
      subtask: false,
      hierarchyLevel: 0
    },
    project: {
      id: '10004',
      key: 'TEST',
      name: 'Test Project',
      projectTypeKey: 'software'
    },
    status: {
      id: '1',
      name: 'To Do',
      description: 'Task is waiting to be started',
      statusCategory: {
        id: 2,
        key: 'new',
        colorName: 'blue-gray',
        name: 'To Do'
      }
    },
    priority: {
      id: '3',
      name: 'Medium'
    },
    assignee: null,
    created: '2024-01-14T13:00:00.000Z',
    updated: '2024-01-14T13:00:00.000Z',
    resolutiondate: null,
    resolution: null,
    labels: [],
    duedate: null,
    timetracking: {},
    customfield_10008: 2,
    subtasks: [],
    issuelinks: []
  }
};
