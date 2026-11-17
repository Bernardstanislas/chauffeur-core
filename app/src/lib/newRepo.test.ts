import { expect, test } from "bun:test";
import { newRepoOwners, repoNameError, suggestedRepoName } from "./newRepo";

test("a new repo goes to the account first, then its organizations, each once", () => {
  expect(newRepoOwners("tester", "acme", ["acme", "Other"], true)).toEqual(["tester", "acme", "Other"]);
  expect(newRepoOwners("tester", "", ["ACME", "acme"], true)).toEqual(["tester", "ACME"]);
  expect(newRepoOwners(null, "", [], true)).toEqual([]);
});

test("without every owner's repos, a new repo goes to the main organization only", () => {
  expect(newRepoOwners("tester", "acme", ["other"], false)).toEqual(["acme"]);
  expect(newRepoOwners("tester", "", ["other"], false)).toEqual([]);
});

test("the search becomes the new repo's name, a pasted repo does not", () => {
  expect(suggestedRepoName("  my new app ")).toBe("my-new-app");
  expect(suggestedRepoName("Café/") ).toBe("");
  expect(suggestedRepoName("..hidden thing!")).toBe("hidden-thing");
  expect(suggestedRepoName("github.com/acme/app")).toBe("");
});

test("a repo name is one plain folder name", () => {
  expect(repoNameError("my-app_2.0")).toBeNull();
  expect(repoNameError("")).not.toBeNull();
  expect(repoNameError(".github")).not.toBeNull();
  expect(repoNameError("my app")).not.toBeNull();
});
