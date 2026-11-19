# A fork's clone reads its base and its PRs from the parent

- **Date:** 2026-11-19
- **Status:** proposed, awaiting Justin

## Context

A user added their fork of a repo (`owner/name` outside the main organization). `gh repo clone` of a fork adds the parent as `upstream` and marks it `gh-resolved = base`, so `gh` reads and opens the PRs there while git fetches and pushes `origin`, the fork. Chauffeur took `origin` for both: workspaces were cut from the fork's `main`, 45 commits behind the parent's, the header counted ↑47 for 2 commits and the Diff tab showed the parent's commits as the branch's, and the PR the agent opened from the fork to the parent showed "no PR", since a fork's PR was never a branch's (story 28), so neither Merge nor archive saw it.

## Decision

Asked by a user 2026-11-19.

- A repo's base branch is read from the remote `gh` takes the repo's PRs from, the one `remote.<name>.gh-resolved` marks `base` (a fork's parent after `gh repo clone`, or the remote `gh repo set-default` picked), else `origin`: workspaces and explorations are cut from it after fetching it, and the header's ahead count, the Diff tab and a routine's refresh count from it. Branches are still pushed to the remote they track, `origin` for a fork; a PR's branch being resumed is fetched from `origin`.
- A worktree's PR may come from a fork when its head is on the GitHub repo the branch is pushed to (the remote it tracks, else `origin`, as configured): the PR a fork's clone opens to its parent. A fork's PR whose head is on any other repo, someone else's fork with a branch of the same name, is still never the branch's. The rest of story 28 stands (the pushed-under name, its checks, when in doubt none).

## Consequences

- One `git config` read per use of the base, and one more read of the push remote only when GitHub answers a fork's PR.
- A clone without a remote marked `gh-resolved = base` behaves as before.
- The app still labels an exploration's checkout `origin/<branch>`.
