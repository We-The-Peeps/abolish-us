# Contributing to abolish-us

Thanks for contributing. This guide defines the standard workflow so pull
requests stay easy to review and safe to ship.

## Prerequisites

- Bun installed (required package manager)
- Git configured locally

## Local Setup

```bash
bun install
bun run dev
```

## Branching

- Branch from `main`
- Use descriptive branch names:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `docs/<short-description>`
  - `chore/<short-description>`

## Development Expectations

- Keep changes focused and small
- Follow existing architecture and naming conventions
- Add or update tests with behavior changes
- Add or update Storybook stories for UI component changes
- Update docs for user-facing or contributor-facing changes

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run local quality checks:

```bash
bun run check
bun run test
bun run test:coverage
bun run build
```

3. Open a PR using the provided template
4. Fill in rationale, test plan, and screenshots (if UI changes)
5. Wait for required CI checks and review approvals

## Maintainer Repository Settings

Apply these branch protection settings to `main` in GitHub:

- Require pull requests before merging
- Require at least 1 approval
- Require review from code owners
- Require conversation resolution before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict force pushes and branch deletion
- Do not allow bypassing these settings
- Mark these checks as required:
  - `Commit Lint`
  - `PR Validation`
  - `Storybook Visual Review / chromatic`
- Apply branch protection to `prod` as well:
  - Require pull requests before merging
  - Require status checks to pass before merging
  - Mark `Release Verification` as required

## Commit Messages

Create commits with Commitizen:

```bash
bun run commit
```

The following commit types are accepted:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `style: ...`
- `chore: ...`
- `refactor: ...`
- `perf: ...`
- `test: ...`
- `build: ...`
- `ci: ...`
- `revert: ...`

### Hook Enforcement

- `pre-commit`: runs `lint-staged` with Biome auto-fixes
- `commit-msg`: blocks non-conventional commit messages
- `pre-push`: runs `test`

### CI Enforcement

GitHub Actions also validates commit messages in pull requests so bypassing
local hooks will still fail CI.

## Testing and Coverage

This repository uses Jest + React Testing Library as the primary test stack.

```bash
bun run test
bun run test:watch
bun run test:coverage
```

Coverage reports are generated under `coverage/jest`, uploaded in CI, and
published to Codecov for PR feedback.

## CI/CD Pipelines

This repository uses robust pipelines for pull requests and release verification:

- `PR Validation`
  - runs tests and coverage
  - uploads coverage to Codecov
  - builds app and Storybook
  - uploads `coverage/jest` and `storybook-static` artifacts
- `Storybook Visual Review`
  - publishes Storybook previews to Chromatic for pull requests
  - provides visual regression checks and shareable preview links
- `Release Verification`
  - runs on pull requests targeting the `prod` branch
  - verifies tests, coverage, app build, and Storybook build
  - acts as the quality gate before merging to `prod`, which Railway deploys automatically
- `Prod Promotion PR`
  - runs on merges to `main`
  - automatically creates or updates a single structured `main` -> `prod` pull request
  - keeps production promotion centralized in one PR flow

### Maintainer setup required

Configure repository secrets:

- `CHROMATIC_PROJECT_TOKEN`
- `CODECOV_TOKEN` (required for private repositories)

## Reporting Bugs and Requesting Features

Please use the GitHub issue templates:

- Bug Report
- Feature Request

## Community Standards

By participating, you agree to follow `CODE_OF_CONDUCT.md`.
