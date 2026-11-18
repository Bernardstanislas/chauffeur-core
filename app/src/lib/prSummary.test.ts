import { describe, expect, test } from "bun:test";
import type { PrInfo } from "@chauffeur/protocol";
import { prSummary, prSummaryTitle } from "./prSummary";

const pr = (repo: string, fields: Partial<PrInfo> = {}): PrInfo => ({
  repo,
  group: null,
  branch: "tester/xyz-1",
  base_branch: "main",
  ahead: 1,
  dirty: false,
  number: 12n,
  pr_base_branch: "main",
  url: `https://github.com/acme/${repo}/pull/12`,
  state: "OPEN",
  title: "Facet filters",
  is_draft: false,
  checks: "SUCCESS",
  review_decision: null,
  mergeable: "MERGEABLE",
  merge_methods: [],
  can_merge: true,
  merge_blocker: null,
  ...fields,
});

describe("prSummary", () => {
  test("a workspace without a PR on GitHub, or not read yet, shows none", () => {
    expect(prSummary(undefined)).toBeNull();
    expect(prSummary([])).toBeNull();
    expect(prSummary([pr("web", { number: null, url: null, state: null })])).toBeNull();
  });

  test("each PR is told by what holds it back first", () => {
    const kind = (fields: Partial<PrInfo>) => prSummary([pr("web", fields)])?.kind;
    expect(kind({})).toBe("ready");
    expect(kind({ state: "MERGED" })).toBe("merged");
    expect(kind({ state: "CLOSED" })).toBe("closed");
    expect(kind({ is_draft: true, checks: "FAILURE" })).toBe("draft");
    expect(kind({ checks: "FAILURE", mergeable: "CONFLICTING" })).toBe("failing");
    expect(kind({ mergeable: "CONFLICTING" })).toBe("conflict");
    expect(kind({ review_decision: "CHANGES_REQUESTED", checks: "PENDING" })).toBe("changes");
    expect(kind({ checks: "PENDING" })).toBe("running");
    expect(kind({ review_decision: "REVIEW_REQUIRED" })).toBe("review");
    expect(kind({ mergeable: "UNKNOWN" })).toBe("open");
  });

  test("several PRs show the most urgent, and the tooltip lists them all in that order", () => {
    const summary = prSummary([
      pr("api", { state: "MERGED", title: "Facet API" }),
      pr("web", { checks: "FAILURE" }),
      pr("web", { group: "xyz-2", branch: "xyz-2", number: 13n, title: null, is_draft: true }),
    ]);
    expect(summary?.kind).toBe("failing");
    expect(summary && prSummaryTitle(summary)).toBe(
      "web #12 Facet filters — checks failed\nxyz-2 · web #13 — draft\napi #12 Facet API — merged",
    );
  });
});
