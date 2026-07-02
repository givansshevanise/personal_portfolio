# Portfolio Automation Setup

## 1. What Was Added

- `data/projects.json` stores portfolio project data outside of `script.js`.
- `scripts/sync-github-projects.js` fetches portfolio-ready GitHub repositories and writes `data/projects.json`.
- `.github/workflows/sync-projects.yml` runs the sync script on GitHub Actions and opens a pull request when project data changes.
- `script.js` now loads project data from `data/projects.json` with `fetch()`.
- Project cards still support filtering, pagination, empty state, and a maximum of 6 projects per page.
- Project cards now display title, description, skills, status/category metadata, and GitHub/demo links when available.

## 2. How To Mark A GitHub Repo As Portfolio-Ready

Add this topic to the repository on GitHub:

```text
portfolio-ready
```

Optional topics:

```text
featured
portfolio-include-fork
```

- `featured` sets `"featured": true`.
- `portfolio-include-fork` allows a forked repository to be included.
- Archived repositories are ignored.

Useful skill topics include:

```text
aws
s3
ec2
ecs
rds
cloudwatch
docker
terraform
github-actions
cicd
ci-cd
linux
monitoring
incident-response
infrastructure-as-code
```

## 3. How To Run The Sync Locally

Run:

```bash
npm run sync:projects
```

For higher API limits, provide a GitHub token:

```bash
GITHUB_TOKEN=your_token npm run sync:projects
```

The script writes:

```text
data/projects.json
```

It prints:

- number of repositories fetched
- number of portfolio-ready repositories found
- number of projects written
- output file path

## 4. How The GitHub Action Works

Workflow file:

```text
.github/workflows/sync-projects.yml
```

The workflow:

1. Runs manually with `workflow_dispatch`.
2. Runs daily on a cron schedule.
3. Checks out the repository.
4. Sets up Node.js.
5. Runs `npm run sync:projects`.
6. Uses `peter-evans/create-pull-request` to open a pull request when `data/projects.json` changes.

Pull request branch:

```text
automation/sync-portfolio-projects
```

Pull request title:

```text
Update portfolio projects from GitHub
```

## 5. Manual Setup Still Needed

- Add `portfolio-ready` topics to GitHub repositories that should appear in the portfolio.
- Add useful skill topics to those repositories.
- Add `featured` to any repository that should be marked featured.
- Add real homepage/demo URLs in GitHub repository settings when a live demo exists.
- Confirm the repository has GitHub Actions enabled.
- Confirm workflow permissions allow pull requests. In GitHub, check repository Settings > Actions > General > Workflow permissions.

## 6. Remaining Limitations

- The sync currently replaces `data/projects.json` with GitHub-sourced projects. Manual-only projects should either be added as GitHub repositories or handled by a future merge strategy.
- The browser fetch approach requires serving the site through a local/static server. Opening `index.html` directly from the filesystem may block `fetch("data/projects.json")`.
- Project category inference is topic-based and intentionally simple.
- Project cards show GitHub/demo links only when URLs are present.
- No automated browser tests are included yet.
