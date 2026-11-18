// A repo created on GitHub from the creation dialog's repo picker: the owners it can go to and
// the name it takes. The rules mirror the daemon's (`validate_repo_name`, `validate_owner` in
// crates/chauffeurd/src/repos.rs): a change to one changes the other.

/** The owners a new repo can go to: the account first, then the main organization and the
 *  account's other organizations, once each. Only the main organization's when the picker lists
 *  nothing else (`github_sources = false`). */
export function newRepoOwners(account: string | null, organization: string, organizations: string[], sources: boolean): string[] {
  const candidates = sources ? [account ?? "", organization, ...organizations] : [organization];
  const owners: string[] = [];
  for (const owner of candidates) {
    if (owner && !owners.some((o) => o.toLowerCase() === owner.toLowerCase())) owners.push(owner);
  }
  return owners;
}

/** Why no owner can take a new repo: GitHub is not connected, or, with only the main
 *  organization's repos listed (`github_sources = false`), none is set. */
export function noOwnerReason(account: string | null): string {
  return account
    ? "No main organization is set: choose one in Settings › GitHub to create a repository."
    : "GitHub is not connected: connect it in Settings › GitHub to create a repository.";
}

/** The name field as typed: spaces become hyphens, as GitHub turns them. */
export function typedRepoName(value: string): string {
  return value.replace(/\s+/g, "-");
}

/** What the picker's search becomes as a repo name, as GitHub would suggest it: spaces and other
 *  characters turned into hyphens. Empty for a pasted URL or an `owner/name`. */
export function suggestedRepoName(filter: string): string {
  const text = filter.trim();
  if (text.includes("/")) return "";
  return text.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|-+$/g, "");
}

/** Why `name` cannot be a repo's name, or null when it can. */
export function repoNameError(name: string): string | null {
  if (!name) return "Name the repository.";
  if (name.startsWith(".")) return "A repository name cannot start with a dot.";
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return "Letters, digits, '.', '_' and '-' only.";
  return null;
}
