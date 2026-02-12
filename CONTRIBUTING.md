# Contributing to abolish-us

Thanks for contributing. This guide defines the standard workflow so pull
requests stay easy to review and safe to ship.

## Prerequisites

- Bun installed (required package manager)
- Git configured locally

## Local Setup

```bash
bun install
bun --bun run dev
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
bun --bun run check
bun --bun run test
bun --bun run build
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

## Commit Messages

This repository is moving to Conventional Commits and Commitizen in Week 2.
For now, please follow Conventional Commits manually:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`
- `refactor: ...`
- `test: ...`

## Reporting Bugs and Requesting Features

Please use the GitHub issue templates:

- Bug Report
- Feature Request

## Community Standards

By participating, you agree to follow `CODE_OF_CONDUCT.md`.
