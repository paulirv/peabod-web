# Git Workflow

## Branch Strategy

```
main (production)
  ├── feature/* (new features)
  ├── fix/* (bug fixes)
  ├── refactor/* (code improvements)
  └── docs/* (documentation)
```

### Branch Descriptions

| Branch | Purpose | Protected |
|--------|---------|-----------|
| `main` | Production-ready code | Yes |
| `feature/*` | New features | No |
| `fix/*` | Bug fixes | No |
| `refactor/*` | Code improvements | No |
| `docs/*` | Documentation updates | No |

## Workflow

### 1. Starting New Work

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-user-avatars

# Or for bug fixes
git checkout -b fix/login-redirect-issue
```

### 2. Making Changes

```bash
# Make commits with conventional commit messages
git add .
git commit -m "feat: add avatar upload component"

# Push to remote
git push -u origin feature/add-user-avatars
```

### 3. Creating Pull Requests

1. Push your branch to GitHub
2. Create PR targeting `main` branch
3. Fill out the PR template (testing checklist)
4. Wait for CI checks to pass
5. Request review if needed
6. Merge when approved and CI passes

### 4. Tagging Releases

```bash
# After significant changes are merged to main
git checkout main
git pull origin main

# Tag the release
git tag -a v1.2.0 -m "Release v1.2.0: Add user avatars"
git push origin v1.2.0
```

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change without feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Examples

```bash
feat(auth): add password reset functionality
fix(articles): correct date formatting on mobile
docs: update API documentation
refactor(media): simplify upload logic
test(auth): add login validation tests
chore: update dependencies
ci: add deploy preview workflow
```

### Commit Message Rules

- Keep the subject line under 72 characters
- Use imperative mood ("add feature" not "added feature")
- Do not include AI-generated boilerplate (e.g., "Co-Authored-By: Claude...")
- Reference issue numbers in the body when applicable

## Branch Protection Rules (GitHub)

### `main` branch
- Require pull request before merging
- Require status checks to pass (CI, E2E Tests)
- Require branches to be up to date
- Do not allow force pushes
- Do not allow deletions

## CI/CD Integration

| Event | Triggers |
|-------|----------|
| Push to `main` | CI + E2E + Production Deploy |
| Pull Request to `main` | CI + E2E |

## Quick Reference

```bash
# Start feature
git checkout main && git pull && git checkout -b feature/my-feature

# Daily sync (rebase your branch on latest main)
git fetch origin && git rebase origin/main

# Submit for review
git push -u origin feature/my-feature
# Then create PR on GitHub

# After PR merged, cleanup
git checkout main && git pull
git branch -d feature/my-feature
```

## Branch Naming Examples

```
feature/user-avatars
feature/article-comments
fix/login-redirect
fix/image-upload-error
refactor/auth-middleware
refactor/api-error-handling
docs/api-endpoints
docs/deployment-guide
```
