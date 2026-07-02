# Personal Portfolio

Static portfolio site for Shevanise Givans, focused on Cloud Engineering and DevOps.

## Local Development

Run the local static server:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4173
```

## Project Data

Portfolio projects are stored in:

```text
data/projects.json
```

The browser loads this file with `fetch()` from `script.js`. Filtering and pagination use each project's `skills` array.

Each project uses this shape:

```json
{
  "title": "",
  "slug": "",
  "description": "",
  "githubUrl": "",
  "demoUrl": "",
  "skills": [],
  "status": "",
  "featured": false,
  "dateCompleted": "",
  "category": "",
  "source": "github"
}
```

## GitHub Project Sync

Repositories are pulled from the GitHub account:

```text
givansshevanise
```

To include a repository in the portfolio, add this GitHub topic:

```text
portfolio-ready
```

Optional topics:

```text
featured
portfolio-include-fork
```

- `featured` marks the generated project as featured.
- `portfolio-include-fork` allows a forked repository to be included.
- Archived repositories are ignored.

Run the sync locally:

```bash
npm run sync:projects
```

The script uses `GITHUB_TOKEN` when available:

```bash
GITHUB_TOKEN=your_token npm run sync:projects
```

Without a token, public repository sync still works, but GitHub API rate limits are lower.

## GitHub Action

The workflow lives at:

```text
.github/workflows/sync-projects.yml
```

It runs:

- manually with `workflow_dispatch`
- daily on a cron schedule

The workflow runs the sync script and opens a pull request when `data/projects.json` changes. It does not push directly to `main`.

## Checks

```bash
npm run lint
npm run build
```
