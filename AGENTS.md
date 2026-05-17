This file is intended for AI agents.

# Meta Guidelines

- If not running in a Docker container, stop and confirm with the user before continuing.
- State assumptions explicitly. When ambiguity exists (e.g. two conflicting patterns), confirm with the user before continuing.
- For multi-step plans or multiple isolated subtasks, spawn subagents.

# Documentation Guidelines

- `README.md` describes project architecture, dataflow, and design decisions for both humans and AI agents.
- If a design decision feels like an assumption, ask the user and record the explanation in `README.md`.
- New or modified functions/methods in non-test scripts require TSDoc/JSDoc comments; unit test functions require a one-line description (typically the `it(...)`/`test(...)` title).

# Implementation Guidelines

- Prefer the simplest implementation, even if it violates SOLID principles. No feature beyond what was asked.
- Break changes into small, functionally isolated chunks; commit as you go. Commit messages must follow this template:

```
<Your name: Claude/Codex/Gemini/...>: <one-line summary>

<One paragraph describing the change in detail. (If more than one paragraph is necessary, the change can probably be broken down.)>
```

# Test Guidelines

Tests must encode WHY behavior matters, not just WHAT it does. A test that does not fail when business logic changes is wrong.

After any code change, all of the following must pass before the task is considered done (run from the repo root):

```bash
npm run test:coverage
npm run lint
```

Coverage must be at least 85% overall across statements, branches, functions, and lines (enforced by Jest; see `coverageThreshold` in `jest.config.js`).

When writing unit tests:

- Order test functions to match the source file's function order.
- Import the module under test as `import * as testee from './my-module'`; call functions as `testee.functionName` and mock attributes via `jest.spyOn(testee, 'attribute')` (or `jest.mocked(...)` for module-level mocks declared with `jest.mock(...)`).

# Review Guidelines

Review your own changes before committing:

- Does it achieve the intended purpose?
- Is it bug-free?
- Are there design flaws or anti-patterns?
- Can it be simplified?

Fix trivial issues. For others, stop and confirm with the user.
