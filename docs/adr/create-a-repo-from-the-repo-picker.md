# Create a GitHub repository from the repo picker

- **Date:** 2026-11-17
- **Status:** accepted

## Context

A workspace needs at least one repo. Starting a new project meant leaving Chauffeur to create the
repo on GitHub, then coming back and finding it in the picker. Conductor's Quick start creates a
repo and pushes it to GitHub from the app. Stan asked for the same when launching a workspace.

## Decision

Decided by Stan 2026-11-17:

- The creation dialog's repo picker (⌘N, "Add repo") creates a repo on GitHub. A "+" button beside
  the search opens a "New repository on GitHub" view. A search that names no repo offers
  "Create <name> on GitHub…", with the search turned into a repo name.
- The view asks for the owner (the account first, then the main organization and the account's
  other organizations; only the main organization when `github_sources = false`), the name, an
  optional description, and Private or Public. Private is the default.
- The repo is created at once, when the view is confirmed, not when the workspace is launched. A
  refusal (the name taken, no right on the organization) shows in the view, which keeps what was
  typed. Once created, the repo is selected in the dialog. A dialog closed afterwards leaves the
  repo on GitHub.
- The repo is created with a README (`gh repo create --add-readme`), so that it has a first commit
  for the workspace's branch. It is cloned on first use, like any other repo.
- `chauffeur repos create owner/name [--public] [--description …]` does the same from the CLI.

## Consequences

- `repos.create` is new. It takes the owner, name, privacy and description and returns the
  `RepoInfo` the picker lists. It bumps the client protocol to version 20.
- The daemon refuses a repo the cache already lists, or one with a clone already in the place a
  workspace would take it from. It refuses before GitHub is asked. Otherwise GitHub's refusal is
  returned as it is.
- The new repo goes into the repos cache with the time it was created as its last push. The picker
  lists it first until GitHub lists the repos again.
- Left for later: a template or a `.gitignore` to start from, creating a repo from the phone, and an
  agent's own repo creation through the `chauffeur` tools.
