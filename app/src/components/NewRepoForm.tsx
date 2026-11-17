import type { RepoInfo } from "@chauffeur/protocol";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { type FormEvent, useState } from "react";
import { newRepoOwners, repoNameError } from "@/lib/newRepo";
import { errorMessage } from "@/lib/rpc";
import { client, rememberRepos } from "@/state/app";
import { useGithubSource } from "@/state/github";
import { useRepoCatalog } from "@/state/repos";
import { Button, cx, inputClass } from "./ui";

/**
 * The repo picker's "New repository" view: creates a repo on GitHub, with a README so that a
 * worktree has a commit to branch from, then hands it back to be added to the workspace (cloned
 * when the workspace starts). GitHub's refusal (a name taken, no right on the organization) stays
 * in the form, with what was typed.
 */
export function NewRepoForm({ initialName, onCancel, onCreated }: { initialName: string; onCancel: () => void; onCreated: (repo: RepoInfo) => void }) {
  const github = useGithubSource();
  const { sources } = useRepoCatalog();
  const owners = newRepoOwners(github?.account ?? null, github?.organization ?? "", github?.organizations ?? [], sources);
  const [owner, setOwner] = useState(owners[0] ?? "");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [isPrivate, setPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameError = name ? repoNameError(name) : null;
  const chosenOwner = owners.includes(owner) ? owner : (owners[0] ?? "");

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy || !chosenOwner || repoNameError(name)) return;
    setBusy(true);
    setError(null);
    try {
      const repo = await client.call("repos.create", { owner: chosenOwner, name, private: isPrivate, description: description.trim() || undefined });
      rememberRepos([repo]);
      onCreated(repo);
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={submit}
      onKeyDown={(event) => {
        // ⌘↵ would otherwise reach the dialog and create the workspace without the repo.
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.stopPropagation();
          void submit();
        }
      }}
      data-testid="new-repo-form"
    >
      <div className="flex h-[34px] shrink-0 items-center gap-1.5 border-b border-line px-1.5">
        <button type="button" title="Back to the repos" aria-label="Back to the repos" className="flex h-6 w-6 items-center justify-center rounded-md text-faint hover:bg-hover hover:text-fg" onClick={onCancel}>
          <ArrowLeft size={13} />
        </button>
        <span className="text-[12.5px] font-medium text-fg">New repository on GitHub</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pt-3 pb-2">
        {owners.length === 0 ? (
          <div className="text-[12px] text-muted" data-testid="new-repo-no-owner">
            GitHub is not connected: connect it in Settings › GitHub to create a repository.
          </div>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-muted">Name</span>
              <div className="flex items-center gap-1">
                {/* Native: the app's Select opens its menu outside this popover, which a click
                    there would close. */}
                <select
                  className={cx(inputClass, "max-w-[160px] shrink-0 pr-1")}
                  style={{ width: "auto" }}
                  value={chosenOwner}
                  onChange={(e) => setOwner(e.target.value)}
                  aria-label="Owner"
                  data-testid="new-repo-owner"
                >
                  {owners.map((login) => (
                    <option key={login} value={login}>
                      {login}
                    </option>
                  ))}
                </select>
                <span className="text-faint">/</span>
                <input
                  data-autofocus
                  className={cx(inputClass, nameError && "border-danger/60")}
                  value={name}
                  onChange={(e) => setName(e.target.value.trim())}
                  placeholder="my-new-repo"
                  spellCheck={false}
                  aria-invalid={!!nameError}
                  data-testid="new-repo-name"
                />
              </div>
              {nameError && <span className="mt-1 block text-[11.5px] text-danger">{nameError}</span>}
            </label>
            <label className="block">
              <span className="mb-1 flex items-baseline justify-between text-[12px] font-medium text-muted">
                Description <span className="text-[11px] font-normal text-faint">optional</span>
              </span>
              <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="new-repo-description" />
            </label>
            <div className="inline-flex w-fit gap-0.5 rounded-[7px] border border-line bg-bg p-0.5" role="radiogroup" aria-label="Visibility">
              {[
                { value: true, icon: <Lock size={12} />, label: "Private" },
                { value: false, icon: <Globe size={12} />, label: "Public" },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={isPrivate === option.value}
                  onClick={() => setPrivate(option.value)}
                  className={cx(
                    "inline-flex h-6 items-center gap-1.5 rounded-[5px] border px-2.5 text-[12px]",
                    isPrivate === option.value ? "border-line-strong bg-raised font-medium text-fg" : "border-transparent text-muted hover:text-fg",
                  )}
                  data-testid={`new-repo-${option.label.toLowerCase()}`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
            {error && (
              <div role="alert" className="rounded-[7px] border border-danger/30 bg-danger/10 px-2.5 py-2 text-[12px] text-danger" data-testid="new-repo-error">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line px-2.5 py-1.5">
        <span className="min-w-0 flex-1 text-[11px] text-faint">Created with a README, then added to this workspace.</span>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="primary" busy={busy} disabled={!chosenOwner || !!repoNameError(name)} data-testid="new-repo-create">
          Create repository
        </Button>
      </div>
    </form>
  );
}
