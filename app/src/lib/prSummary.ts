// A workspace's pull requests told in one status, for its sidebar row: the most urgent of them.

import type { PrInfo } from "@chauffeur/protocol";
import { mergeBlocker } from "./prs";

export type PrStatusKind =
  | "failing"
  | "conflict"
  | "changes"
  | "running"
  | "review"
  | "ready"
  | "open"
  | "draft"
  | "merged"
  | "closed";

/** Most urgent first: the one a row shows when its PRs differ. */
const URGENCY: PrStatusKind[] = ["failing", "conflict", "changes", "running", "review", "ready", "open", "draft", "merged", "closed"];

export const PR_STATUS_LABEL: Record<PrStatusKind, string> = {
  failing: "checks failed",
  conflict: "conflict",
  changes: "changes requested",
  running: "checks running",
  review: "review required",
  ready: "ready to merge",
  open: "open",
  draft: "draft",
  merged: "merged",
  closed: "closed",
};

export type PrSummary = {
  kind: PrStatusKind;
  /** The PRs it sums up (those GitHub has), the most urgent first. */
  prs: Array<{ pr: PrInfo; kind: PrStatusKind }>;
};

/** Where one PR stands, as its row tells it. */
export function prStatusKind(pr: PrInfo, all: PrInfo[]): PrStatusKind {
  if (pr.state === "MERGED") return "merged";
  if (pr.state === "CLOSED") return "closed";
  if (pr.is_draft) return "draft";
  if (pr.checks === "FAILURE") return "failing";
  if (pr.mergeable === "CONFLICTING") return "conflict";
  if (pr.review_decision === "CHANGES_REQUESTED") return "changes";
  if (pr.checks === "PENDING") return "running";
  if (pr.review_decision === "REVIEW_REQUIRED") return "review";
  return mergeBlocker(pr, all) ? "open" : "ready";
}

/** The workspace's PRs summed up, or null when it has none on GitHub (or they are not read yet). */
export function prSummary(prs: PrInfo[] | undefined): PrSummary | null {
  const found = (prs ?? []).filter((pr) => pr.number != null);
  if (found.length === 0) return null;
  const ranked = found
    .map((pr) => ({ pr, kind: prStatusKind(pr, found) }))
    .sort((a, b) => URGENCY.indexOf(a.kind) - URGENCY.indexOf(b.kind));
  return { kind: ranked[0]!.kind, prs: ranked };
}

/** `web #12 Facet filters — checks failed`, one line per PR, for the row's tooltip; `number` writes
 *  `#12`, or `!12` on a GitLab. */
export function prSummaryTitle(summary: PrSummary, number: (n: bigint | null) => string): string {
  return summary.prs
    .map(({ pr, kind }) => {
      const repo = pr.group ? `${pr.group} · ${pr.repo}` : pr.repo;
      return `${repo} ${number(pr.number)}${pr.title ? ` ${pr.title}` : ""} — ${PR_STATUS_LABEL[kind]}`;
    })
    .join("\n");
}
