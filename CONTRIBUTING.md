# Contributing

## How to contribute

1. Create a feature branch
   ```
   git checkout -b feat/my-feature
   ```

2. Commit however you want on your branch — commit messages here don't matter
   ```
   git commit -m "wip"
   git commit -m "still broken"
   git commit -m "okay works now"
   ```

3. Open a PR to `master`

4. Write a **conventional commit message** as your PR title
   ```
   feat(game-of-life): add grid resize
   fix(game-of-life): fix canvas flicker on drag
   docs(game-of-life): update README
   refactor(game-of-life): extract grid logic
   ```

5. Merge the PR using **squash merge** — the PR title becomes the commit message on master, which is what Release Please reads

## Conventional commit format

```
type(scope): description
```

| Type | When to use | Version bump |
|------|------------|-------------|
| `feat` | Adding new functionality | Minor (0.1.0 → 0.2.0) |
| `fix` | Fixing a bug | Patch (0.1.0 → 0.1.1) |
| `docs` | Documentation only | Patch |
| `refactor` | Code restructure, no behavior change | Patch |
| `chore` | Dependencies, config, misc | Patch |
| `feat!` or `fix!` | Breaking change (add `!` before `:`) | Major (0.1.0 → 1.0.0) |

## Release workflow

Releases are automated using [Release Please](https://github.com/googleapis/release-please).

### What happens after your PR is merged

1. Release Please sees your commit on `master` and opens (or updates) a **Release PR**
2. The Release PR only changes two files: `.release-please-manifest.json` (version bump) and `CHANGELOG.md` (auto-generated)
3. When the team is ready to release, merge the Release PR
4. Release Please creates a git tag and GitHub Release
5. The tag triggers the build workflow — macOS and Windows binaries are built and attached to the release

### Why squash merge

| Method | How it works | Recommendation |
|--------|-------------|----------------|
| Squash merge | All branch commits become one commit. PR title = commit message. | Recommended — only the PR title needs to follow conventional commit format |
| Merge commit | Each individual commit lands on master. | Every commit on the branch needs to follow the format, or non-conventional ones will be skipped in the changelog |

## FAQ

### How do I force a specific version number?

**Option 1: Via commit message**

Add `release-as` in the commit body:
```
feat(game-of-life): redesign UI

release-as: 2.0.0
```
Release Please will bump to exactly 2.0.0 regardless of what the commit type would normally calculate.

**Option 2: Edit the Release PR directly**

The Release PR is a regular PR that updates `.release-please-manifest.json`. You can edit that file in the PR to set any version you want before merging.

### How do I add a non-conventional commit to the changelog?

The Release PR contains the auto-generated `CHANGELOG.md`. Before merging, you can edit the changelog in the PR to add any entries you want. Release Please won't overwrite your manual edits.

### How do I indicate a breaking change?

Two ways:

1. Add `!` before the colon:
   ```
   feat(game-of-life)!: change config format
   ```

2. Add `BREAKING CHANGE:` in the commit body:
   ```
   feat(game-of-life): change config format

   BREAKING CHANGE: config keys renamed from camelCase to snake_case
   ```

Both result in a major version bump (e.g., 0.1.0 → 1.0.0).

### What if I forgot to use a conventional commit message?

Release Please ignores it — it won't appear in the changelog and won't trigger a version bump. If it should have been included, you can manually edit the Release PR's changelog before merging.
