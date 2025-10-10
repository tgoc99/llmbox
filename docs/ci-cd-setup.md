# CI/CD Setup Guide

## Overview

The project uses GitHub Actions for CI/CD and Husky for Git hooks to ensure code quality and
automated testing.

## GitHub Actions

### Workflows

#### 1. Test Workflow (`.github/workflows/test.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

**`test` job (runs on all PRs and pushes):**

- ✅ Check code formatting
- ✅ Lint code
- ✅ Type checking
- ✅ Run unit tests
- ✅ Run contract tests
- ✅ Generate coverage report
- ✅ Upload coverage to Codecov

**`integration-test` job (runs only on push to main/develop):**

- ⚠️ Run integration tests (costs money!)
- Only runs on direct pushes, not PRs
- Requires API keys (stored as GitHub secrets)

#### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

**Steps:**

1. ✅ Run pre-deployment checks (`deno task check`)
2. ⚠️ Run integration tests (`deno task test:pre-deploy`)
3. 🚀 Deploy to Supabase
4. 📢 Notify success/failure

### Required GitHub Secrets

Add these secrets to your GitHub repository settings:

**For Integration Tests:**

```
OPENAI_API_KEY              # OpenAI API key
SENDGRID_API_KEY            # SendGrid API key
SERVICE_EMAIL_ADDRESS       # Verified sender email
SUPABASE_URL                # Supabase project URL
SUPABASE_ANON_KEY           # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY   # Supabase service role key
```

**For Deployment:**

```
SUPABASE_ACCESS_TOKEN       # Supabase CLI access token
SUPABASE_PROJECT_ID         # Supabase project reference ID (e.g., nopocimtfthppwssohty)
```

### Setting Up GitHub Secrets

#### Quick Method (Using GitHub CLI)

If you have a `.env.local` file:

```bash
# Install GitHub CLI if needed
brew install gh

# Login to GitHub
gh auth login

# Add secrets from .env.local file
gh secret set OPENAI_API_KEY < <(grep OPENAI_API_KEY .env.local | cut -d '=' -f2)
gh secret set SENDGRID_API_KEY < <(grep SENDGRID_API_KEY .env.local | cut -d '=' -f2)
gh secret set SERVICE_EMAIL_ADDRESS < <(grep SERVICE_EMAIL_ADDRESS .env.local | cut -d '=' -f2)
gh secret set SUPABASE_URL < <(grep SUPABASE_URL .env.local | cut -d '=' -f2)
gh secret set SUPABASE_ANON_KEY < <(grep SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)
gh secret set SUPABASE_SERVICE_ROLE_KEY < <(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

# Get Supabase access token
gh secret set SUPABASE_ACCESS_TOKEN < <(cat ~/.supabase/access-token)

# Set project ID (replace with your project ref)
echo "nopocimtfthppwssohty" | gh secret set SUPABASE_PROJECT_ID
```

Or use this one-liner to set all at once:

```bash
cat .env.local | grep -E "OPENAI_API_KEY|SENDGRID_API_KEY|SERVICE_EMAIL_ADDRESS|SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY" | while IFS='=' read -r key value; do echo "$value" | gh secret set "$key"; done
```

#### Manual Method (GitHub Web UI)

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list above

### Getting Supabase Tokens

```bash
# Login to Supabase CLI
supabase login

# Get your access token (for GitHub Actions)
cat ~/.supabase/access-token

# Get your project reference ID
supabase projects list
```

## Git Hooks (Husky)

### Installation

Run once after cloning the repository:

```bash
./.husky/install.sh
```

This configures Git to use the hooks in the `.husky/` directory.

### Hooks

#### Pre-commit Hook

Runs before every `git commit`:

- ✅ Format check (`deno fmt --check`)
- ✅ Lint (`deno lint`)
- ✅ Type check (`deno task type-check`)
- ✅ Unit tests (`deno task test:unit`)
- ✅ Contract tests (`deno task test:contract`)

**Time:** ~7 seconds

**To skip (not recommended):**

```bash
git commit --no-verify -m "your message"
```

#### Pre-push Hook

Runs before every `git push`:

- ✅ Full check task (`deno task check`)
  - Includes all pre-commit checks

**Time:** ~7 seconds

**To skip (not recommended):**

```bash
git push --no-verify
```

### Why Git Hooks?

1. **Catch issues early** - Find problems before CI/CD
2. **Faster feedback** - No need to wait for GitHub Actions
3. **Reduce CI costs** - Less failed builds
4. **Enforce standards** - Ensure all commits meet quality bar

### Disabling Hooks

If you need to disable hooks temporarily:

```bash
# Skip a single commit
git commit --no-verify

# Skip a single push
git push --no-verify

# Disable globally (not recommended)
export HUSKY=0
```

## Development Workflow

### Standard Workflow

```bash
# 1. Make your changes
vim supabase/functions/email-webhook/index.ts

# 2. Run tests in watch mode while developing
deno task test:unit:watch

# 3. Before committing, format your code
deno fmt

# 4. Commit (pre-commit hook runs automatically)
git commit -m "feat(webhook): add new feature"
# → Runs format, lint, type-check, unit & contract tests

# 5. Push (pre-push hook runs automatically)
git push
# → Runs full check task
```

### Fast Workflow (Skip Hooks)

Only when you're 100% sure your code is good:

```bash
# Commit without hooks
git commit --no-verify -m "docs: update readme"

# Push without hooks
git push --no-verify
```

### Manual Checks

Run the same checks as hooks manually:

```bash
# Pre-commit checks
deno task check

# With integration tests (before merging to main)
deno task test:pre-deploy
```

## CI/CD Pipeline Flow

### Pull Request Flow

```
1. Developer creates PR
   ↓
2. GitHub Actions: Test Workflow
   - Format check
   - Lint
   - Type check
   - Unit tests
   - Contract tests
   - Coverage report
   ↓
3. Tests pass → PR ready for review
4. Tests fail → Fix and push again
```

### Main Branch Flow

```
1. PR merged to main
   ↓
2. GitHub Actions: Test Workflow
   - All fast tests
   - Integration tests (⚠️ costs $)
   ↓
3. GitHub Actions: Deploy Workflow
   - Pre-deployment checks
   - Integration tests
   - Deploy to Supabase
   ↓
4. Production updated ✅
```

## Monitoring

### GitHub Actions

View workflow runs:

- Go to your repository
- Click **Actions** tab
- See all workflow runs and their status

### Coverage Reports

Coverage reports are uploaded to Codecov:

- View coverage trends
- See which lines are tested
- Track coverage over time

## Troubleshooting

### Hook Not Running

```bash
# Check Git hooks path
git config core.hooksPath
# Should output: .husky

# Re-install hooks
./.husky/install.sh
```

### Hook Fails on Type Check

```bash
# Run type check manually to see errors
deno task type-check

# Fix errors, then commit again
```

### GitHub Actions Fails

1. Check the workflow logs in GitHub Actions tab
2. Run the same command locally:
   ```bash
   deno task check  # For test workflow
   deno task test:pre-deploy  # For deploy workflow
   ```
3. Fix the issue and push again

### Integration Tests Timeout

Integration tests make real API calls and can be slow:

- OpenAI: 5-20 seconds per request
- SendGrid: 2-5 seconds per email
- Supabase: 1-3 seconds per query

If tests timeout, increase timeout in test files or check API status.

## Cost Considerations

### GitHub Actions

- **Free tier:** 2,000 minutes/month for public repos, 500 for private
- **Test workflow:** ~2 minutes per run
- **Deploy workflow:** ~3 minutes per run

### Integration Tests

- **OpenAI:** ~$0.001 per test (gpt-4o-mini)
- **SendGrid:** Free tier allows 100 emails/day
- **Supabase:** Included in free tier for development

**Strategy to minimize costs:**

- Unit/contract tests run on every PR (free, fast)
- Integration tests only run on push to main/develop (limited)

## Best Practices

1. **Always run tests locally first**
   ```bash
   deno task check
   ```

2. **Use watch mode during development**
   ```bash
   deno task test:unit:watch
   ```

3. **Don't skip hooks unless necessary**
   - Hooks catch issues early
   - Saves CI/CD time and costs

4. **Run integration tests before major releases**
   ```bash
   deno task test:pre-deploy
   ```

5. **Monitor GitHub Actions usage**
   - Check minutes used in GitHub settings
   - Optimize slow tests

6. **Keep PR builds fast**
   - Only fast tests on PRs
   - Integration tests on main branch only

## Summary

✅ **GitHub Actions** - Automated testing and deployment ✅ **Git Hooks** - Pre-commit and pre-push
validation ✅ **Fast feedback** - Catch issues before CI/CD ✅ **Cost-effective** - Integration
tests only when needed ✅ **Easy setup** - Run `./.husky/install.sh` once

The CI/CD pipeline ensures high code quality while minimizing costs and maximizing developer
productivity!
