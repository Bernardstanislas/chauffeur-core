import { expect, spyOn } from "bun:test";
import type { CreateRepoParams, GithubStatus, RepoInfo } from "@chauffeur/protocol";
import { domTest } from "@/test/dom";
import { repo, repoPage } from "@/test/repos";

domTest("a repo created from the picker's search is added to the new workspace, and GitHub's refusal stays in the form", import.meta.path, async ({ render, click, fill, until }) => {
  const { CreateWorkspaceDialog } = await import("./CreateWorkspaceDialog");
  const { client, useApp } = await import("@/state/app");
  const { refreshGithub } = await import("@/state/github");
  const before = useApp.getState();
  useApp.setState({ repos: [repo("api", true)], reposError: null, reposRevision: 0, reposSources: true, reposSync: { refreshedAt: null, githubError: null }, createOpen: true, createRetry: null, models: [], loadout: [] });
  const created: CreateRepoParams[] = [];
  const rpc = spyOn(client, "call").mockImplementation(async (method, params) => {
    if (method === "repos.cached") return { repos: [repo("api", true)], github_sources: true };
    if (method === "repos.page") return repoPage([]);
    if (method === "settings.get") return { workspaces: { github_org: "acme", branch_prefix: "test", github_login: "tester" }, linear: { enabled: false, start_tickets: false } };
    if (method === "github.status") return {
      git: true, git_install: "xcode", gh: "/fake/gh", own: false, version: "test", download_size: null,
      account: "tester", organizations: ["acme"], organization: "acme", connecting: null,
    } satisfies GithubStatus;
    if (method === "repos.create" && "owner" in params && "private" in params) {
      created.push(params);
      if (created.length === 1) throw new Error("could not create tester/brand-new on GitHub: Name already exists on this account");
      return { ...repo(params.name), key: `${params.owner}/${params.name}`, full_name: `${params.owner}/${params.name}`, owner: params.owner, owner_is_org: false, private: params.private } satisfies RepoInfo;
    }
    throw new Error(`Unexpected RPC: ${method}`);
  });
  try {
    await refreshGithub();
    await render(<CreateWorkspaceDialog />);
    await click('[data-testid="add-repo"]');
    await fill('[data-testid="repo-filter"]', "brand new");
    await until(() => !!document.querySelector('[data-testid="create-repo-from-search"]'));
    await click('[data-testid="create-repo-from-search"]');
    expect(document.querySelector<HTMLInputElement>('[data-testid="new-repo-name"]')?.value).toBe("brand-new");
    expect(document.querySelector<HTMLSelectElement>('[data-testid="new-repo-owner"]')?.value).toBe("tester");
    expect([...document.querySelectorAll('[data-testid="new-repo-owner"] option')].map((option) => option.textContent)).toEqual(["tester", "acme"]);
    await click('[data-testid="new-repo-public"]');
    await click('[data-testid="new-repo-create"]');
    await until(() => !!document.querySelector('[data-testid="new-repo-error"]'));
    expect(document.querySelector('[data-testid="new-repo-error"]')?.textContent).toContain("Name already exists");
    expect(created[0]).toEqual({ owner: "tester", name: "brand-new", private: false, description: undefined });

    await fill('[data-testid="new-repo-name"]', "brand-new-2");
    await fill('[data-testid="new-repo-description"]', "  A fresh start ");
    await click('[data-testid="new-repo-create"]');
    await until(() => !document.querySelector('[data-testid="new-repo-form"]'));
    expect(created[1]).toEqual({ owner: "tester", name: "brand-new-2", private: false, description: "A fresh start" });
    expect(document.querySelector('[data-repo="tester/brand-new-2"]')?.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector('[data-testid="repo-filter"]')?.getAttribute("value")).toBe("");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("brand-new-2");
    expect(useApp.getState().repos?.some((entry) => entry.key === "tester/brand-new-2")).toBe(true);
  } finally {
    await render(null);
    rpc.mockRestore();
    useApp.setState(before, true);
  }
});
