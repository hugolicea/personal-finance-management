# CI/CD Pipeline Reference

## Overview

The CI/CD pipeline runs automated quality gates on all changes targeting `main`,
`dev`, and `develop` branches. It executes three independent jobs in parallel:
backend tests (with linting and coverage), frontend tests (with type-checking,
linting, and a production build), and a filesystem vulnerability scan. The
pipeline does not deploy; it validates only. A failed `test-backend` or
`test-frontend` job blocks merges. The `security-scan` job is telemetry only and
never blocks.

---

## Trigger Matrix

| Event          | Branches                 | Jobs triggered                                   |
| -------------- | ------------------------ | ------------------------------------------------ |
| `push`         | `main`, `dev`, `develop` | `test-backend`, `test-frontend`, `security-scan` |
| `pull_request` | `main`, `dev`            | `test-backend`, `test-frontend`, `security-scan` |

---

## Concurrency

```yaml
concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
```

The concurrency group is keyed on workflow name + ref. When a new run starts on
the same branch, any in-progress run for that branch is cancelled immediately.
This means only the most recent push to a branch has an active pipeline at any
given time. Consequence: intermediate commits on a long-lived branch will not
complete their runs if a newer push arrives before they finish.

---

## Environment Variables

### Global

| Variable                             | Scope                | Value  | Notes                                                                                         |
| ------------------------------------ | -------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` | Workflow-level `env` | `true` | Forces all JavaScript-based Actions to run under Node 24 regardless of their bundled runtime. |

### `test-backend` job (`env` block on the test step)

| Variable                 | Value                                  | Source                  | Notes                                                          |
| ------------------------ | -------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `DJANGO_SETTINGS_MODULE` | `personal_finance_management.settings` | Hardcoded               | Points Django to the project settings module.                  |
| `SECRET_KEY`             | _(secret)_                             | `secrets.CI_SECRET_KEY` | Django `SECRET_KEY`. Must be set in GitHub repository secrets. |
| `DEBUG`                  | `True`                                 | Hardcoded               | Enables Django debug mode for the test run only.               |
| `DB_ENGINE`              | `postgresql`                           | Hardcoded               | Selects the PostgreSQL database backend.                       |
| `DB_NAME`                | `test_db`                              | Hardcoded               | Ephemeral test database name. No production exposure.          |
| `DB_USER`                | `test_user`                            | Hardcoded               | Ephemeral test user. No production exposure.                   |
| `DB_PASSWORD`            | `test_password`                        | Hardcoded               | Ephemeral test password. No production exposure.               |
| `DB_HOST`                | `localhost`                            | Hardcoded               | Connects to the PostgreSQL service container via localhost.    |
| `DB_PORT`                | `5432`                                 | Hardcoded               | Standard PostgreSQL port.                                      |

DB credentials are intentionally hardcoded; they apply only to the ephemeral
service container that exists for the duration of the job.

---

## Jobs

### `test-backend`

| Property | Value           |
| -------- | --------------- |
| Runner   | `ubuntu-latest` |
| Timeout  | 10 minutes      |

#### Services

| Service    | Image         | Port mapping | Health check                                      |
| ---------- | ------------- | ------------ | ------------------------------------------------- |
| `postgres` | `postgres:15` | `5432:5432`  | `pg_isready`, interval 10s, timeout 5s, 5 retries |

#### Steps

| Step                 | Action / Command                                                                     | Notes                                                           |
| -------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Checkout             | `actions/checkout@v4`                                                                | —                                                               |
| Set up Python        | `actions/setup-python@v5`, version `3.11`                                            | `pip` cache enabled.                                            |
| Install dependencies | `pip install -r requirements.txt` + `pip install -r requirements.dev.txt`            | Working directory: `./backend`.                                 |
| Run linting          | `ruff check . --config ../ruff.toml` + `ruff format --check . --config ../ruff.toml` | Config read from repo root `ruff.toml`. Failure blocks the job. |
| Run tests            | `mkdir -p logs && pytest --cov=budget --cov-report=xml --cov-report=term`            | Produces `coverage.xml` in `./backend`. Failure blocks the job. |
| Upload coverage      | `codecov/codecov-action@v5`                                                          | Uploads `./backend/coverage.xml` with flag `backend`.           |

#### Failure gates

Any step failure (linting, tests) causes the job to fail and blocks merge.
Coverage upload failure does not block.

---

### `test-frontend`

| Property | Value           |
| -------- | --------------- |
| Runner   | `ubuntu-latest` |
| Timeout  | 8 minutes       |

#### Services

None.

#### Steps

| Step                 | Action / Command                      | Notes                                                                                         |
| -------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Checkout             | `actions/checkout@v4`                 | —                                                                                             |
| Set up Node          | `actions/setup-node@v4`, version `22` | `npm` cache, lock file at `./frontend/package-lock.json`.                                     |
| Install dependencies | `npm ci`                              | Working directory: `./frontend`. Clean install from lock file.                                |
| Run linting          | `npm run lint`                        | Failure blocks the job.                                                                       |
| Type check           | `npx tsc --noEmit`                    | Failure blocks the job. No output files generated.                                            |
| Run tests            | `npm test`                            | Runs Vitest. Failure blocks the job.                                                          |
| Build                | `npm run build`                       | Runs Vite production build. Failure blocks the job. Ensures the build artifact is producible. |

#### Failure gates

All steps are hard gates. Any single failure blocks the job and blocks merge.

---

### `security-scan`

| Property    | Value                                      |
| ----------- | ------------------------------------------ |
| Runner      | `ubuntu-latest`                            |
| Timeout     | 10 minutes                                 |
| Permissions | `contents: read`, `security-events: write` |

#### Services

None.

#### Steps

| Step                                    | Action / Command                       | Notes                                                                                                                                                     |
| --------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout                                | `actions/checkout@v4`                  | —                                                                                                                                                         |
| Run Trivy vulnerability scanner         | `aquasecurity/trivy-action@0.35.0`     | Scan type: `fs`, ref: `.`, output format: `sarif`, output file: `trivy-results.sarif`. **`continue-on-error: true`** — scan failures do not fail the job. |
| Upload Trivy results to GitHub Security | `github/codeql-action/upload-sarif@v4` | Uploads `trivy-results.sarif` to the GitHub Security tab. `if: always()` ensures upload runs even when the scan step errored.                             |

#### Failure gates

No hard gates. The scan job never blocks merges regardless of scan outcome.

---

## Required GitHub Secrets

| Secret name     | Used by                          | Purpose                                                                                       |
| --------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| `CI_SECRET_KEY` | `test-backend` (test step `env`) | Provides Django's `SECRET_KEY` during the test run. Must be a valid Django secret key string. |

---

## Coverage Reporting

Backend coverage is collected by `pytest` using the `pytest-cov` plugin:

- `--cov=budget` — measures coverage for the `budget` app only.
- `--cov-report=xml` — writes `./backend/coverage.xml` for upload.
- `--cov-report=term` — prints a coverage summary to the job log.

The `codecov/codecov-action@v5` step uploads `./backend/coverage.xml` to Codecov
with the flag `backend`.

Frontend tests are executed by Vitest (`npm test`). No coverage flags are passed
in CI, and no coverage artifact is uploaded to Codecov. Frontend coverage is not
tracked in Codecov.

---

## Security Scan Behavior

Trivy runs a filesystem scan (`scan-type: fs`) against the entire repository
root. The scan step has `continue-on-error: true`, meaning a Trivy execution
error or a findings-based exit code does not fail the job or block the merge.

Results are written to `trivy-results.sarif` and uploaded to the GitHub
repository's Security tab via `github/codeql-action/upload-sarif@v4`. The
`if: always()` condition on the upload step ensures the SARIF file is uploaded
even when the preceding Trivy step exits with an error.

The effective behavior: the security scan is telemetry only. Vulnerabilities
surfaced by Trivy appear in the Security tab but do not prevent merges.

---

## Known Limitations

| Limitation                     | Detail                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| MySQL not tested in CI         | Only a PostgreSQL 15 service is configured. The MySQL code path (`DB_ENGINE=mysql`) has no CI coverage.     |
| Frontend coverage not uploaded | Vitest collects no coverage data in CI; nothing is sent to Codecov for the frontend.                        |
| Trivy does not block merges    | `continue-on-error: true` on the scan step means any vulnerability finding or scan failure is non-blocking. |
