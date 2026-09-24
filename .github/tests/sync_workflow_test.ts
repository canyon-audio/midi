const WORKFLOW = new URL("../workflows/sync-upstream.yml", import.meta.url);

function requireText(content: string, expected: string): void {
  if (!content.includes(expected)) {
    throw new Error(`sync workflow is missing: ${expected}`);
  }
}

Deno.test("upstream sync is scheduled and manually runnable", async () => {
  const workflow = await Deno.readTextFile(WORKFLOW);
  requireText(workflow, "schedule:");
  requireText(workflow, "workflow_dispatch:");
  requireText(workflow, "contents: write");
  requireText(workflow, "https://github.com/pencilresearch/midi.git");
});

Deno.test("upstream sync validates a normal merge before pushing", async () => {
  const workflow = await Deno.readTextFile(WORKFLOW);
  requireText(workflow, "git fetch --no-tags upstream main");
  requireText(workflow, "git merge --no-edit upstream/main");
  requireText(workflow, "deno task check");
  requireText(workflow, "git push origin HEAD:main");
  const fetch = workflow.indexOf("git fetch --no-tags upstream main");
  const merge = workflow.indexOf("git merge --no-edit upstream/main");
  const validate = workflow.indexOf("deno task check");
  const push = workflow.indexOf("git push origin HEAD:main");

  if (!(fetch < merge && merge < validate && validate < push)) {
    throw new Error("sync must fetch, merge, validate, then push");
  }
  if (workflow.includes("--force") || workflow.includes("reset --hard")) {
    throw new Error("sync must not rewrite fork history");
  }
});
