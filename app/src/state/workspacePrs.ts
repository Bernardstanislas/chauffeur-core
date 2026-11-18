// Each workspace's pull requests, for the sidebar's rows: what the open workspace's header last
// read, and `pr.overview` every few seconds while the sidebar shows them (Settings › Appearance).
// The daemon lists each repo's open PRs once per call and reads again only the workspaces whose
// PRs changed, so the user's GitHub quota holds at this pace.

import type { PrInfo } from "@chauffeur/protocol";
import { useEffect } from "react";
import { create } from "zustand";
import { client, useApp } from "./app";

/** By workspace, as last read; absent until read. */
export const useWorkspacePrs = create<Record<string, PrInfo[]>>(() => ({}));

export function recordPrs(workspace: string, prs: PrInfo[]) {
  useWorkspacePrs.setState({ [workspace]: prs });
}

/** Between the end of one `pr.overview` and the next. The daemon may answer with what it read up to
 * 10 s earlier for another window: a change shows within 30 s. */
const PACE = 20_000;

/** Asks the daemon for every ready workspace's PRs while `on`, then again `PACE` after each answer. */
export function useSidebarPrOverview(on: boolean) {
  const connected = useApp((s) => s.connection.status === "open");
  useEffect(() => {
    if (!on || !connected) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = async () => {
      try {
        const { workspaces } = await client.call("pr.overview", {});
        if (cancelled) return;
        useWorkspacePrs.setState(Object.fromEntries(workspaces.map((w) => [w.workspace, w.prs])));
      } catch {
        // The rows keep what they showed; the next call asks again.
      }
      if (!cancelled) timer = setTimeout(load, PACE);
    };
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [on, connected]);
}
