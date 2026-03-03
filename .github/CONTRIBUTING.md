# Contributing

## Branch Strategy

- **main** — Production only. All code here is deployed. Protected branch.
- **develop** — Integration branch for merging feature work before release.
- **feature/name** — New features (e.g. `feature/add-dark-mode`).
- **fix/name** — Bug fixes (e.g. `fix/login-redirect`).

## Workflow

1. Create a branch from `develop` (or `main` if no develop branch exists):
   - `git checkout -b feature/your-feature-name`
   - `git checkout -b fix/your-fix-name`

2. Make your changes and commit with clear messages.

3. Open a pull request targeting `develop` (or `main`).

4. Ensure CI passes (TypeScript, lint, tests, build).

5. Request review and address feedback.

6. Merge after approval.
