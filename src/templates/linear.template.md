# Important Links

* [Jira]({{ links.jira }})
* [GitLab]({{ links.gitlab }})
* [LogSeq]({{ links.logseq }})
* [Clockify]({{ links.clockify }})

# Phases / Steps / Action Items

## Bootstrap the Story

- [ ] Setup Git Branch
- [ ] Setup Linear Task
- [ ] Setup LogSeq Page
- [ ] Setup Clockify Task
- [ ] ✅ M0: QA Check

## Do the Story

### 🔍 Problem Discovery

- [ ] ⚫ Define Problem
  - [ ] Collect Initial Data
  - [ ] Define Initial Problem Statement
  - [ ] Reproduce the Problem
  - [ ] Finalize Problem Statement
- [ ] Collect Requirements
- [ ] ✍️ Identify Initial Work Chunks

### ✨ Implement Solution

- [ ] ✅ M1: Start Implementation
- [ ] 📝 Update Changelog
- [ ] ✔️ Update Jira - IN_PROGRESS
- [ ] 🌑 Implement Initial Solution (First working solution which can be tested)
- [ ] 🌘 Apply Quality Checks (linting, tests)
- [ ] ✅ M2: Start Code/Story Review

## Close the Story

### 📝 Review Protocol

- [ ] 🗣️ Present Story
- [ ] 📥 Archive Slack Channel

### 📦 Archive Protocol

- [ ] 🖋️ Update LogSeq Page
  * Ensure that all LogSeq tasks are closed
- [ ] 🍃 Schedule for "Reflection"
  * Migrate content from the Story Page to the KB
- [ ] 🤖 Release Story (Jenkins)
  * ✍️ Update Releases Confluence Page
  * ✓ Update Jira Story - On Test
  * ✓ Update Details - Released App and Scheduled for Prod
