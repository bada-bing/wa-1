---
tags: work-task
status: TODO
due_date:
priority: 
start_date:
done_date:
closed_date:
client: {{ client }}
problem_type: {{ issue_type }}
estimated_effort: {{ estimated_effort }}
title: {{ slug }}
---
- # {{ jira.issue }} 🌑 {{ summary }}
- ## Task Progress
  background-color:: purple
{{ action_items }}
- ## Context
	- **Scope Keywords**: #{{ project }}
	- **Branch Name**: {{ branch_name }}
	- #### Related Tasks
		- *Related-Tasks-Placeholder*
	- #### Links
		- [Jira]({{ jira.url }})
		- *[GitLab]*
		- *[Clockify]*
- ## Problem
  - ### Problem Description
      - *Describe the problem*
  - ### Objectives/Requirements/Use-Cases [Optional]
      - 1. *Describe the solution objectives, requirements and/or use-cases, *
- ## Solution
  - ### Acceptance Criteria
    - C1. *Describe the criteria for the acceptance of the solution*
  - ### Action Plan
    - LATER *List implementation subtasks here*
- ## Documentation
	- *Add documentation details here*