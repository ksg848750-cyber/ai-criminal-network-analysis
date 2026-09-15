# ANTIGRAVITY SETUP NOTES

This project uses Antigravity's workspace/project context model.

## Recommended repository structure

```text
PROJECT_CONTEXT.md
AGENTS.md
docs/
context/
.agents/
  agents/
  skills/
```

Workspace-specific skills live under:

```text
.agents/skills/<skill-name>/SKILL.md
```

Project-specific custom agents live under:

```text
.agents/agents/<agent-name>/agent.md
```

This repository includes both so the project carries its own implementation guidance.

## Important

Do not depend on deprecated workflow files for the project process.

Use Skills for reusable implementation behavior.

## First interaction

Use:

`docs/ANTIGRAVITY_FIRST_PROMPT.md`

The first interaction should be an understanding/plan check, not an immediate code dump.
