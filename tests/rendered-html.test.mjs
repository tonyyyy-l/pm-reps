import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import test, { after, before } from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;
const port = 32000 + (process.pid % 1000);
const baseUrl = `http://127.0.0.1:${port}`;
let server;

before(async () => {
  server = spawn(
    "npx",
    [
      "wrangler",
      "dev",
      "--config",
      "dist/server/wrangler.json",
      "--port",
      String(port),
    ],
    {
    cwd: new URL("..", import.meta.url),
    stdio: "ignore",
    },
  );
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Production test server did not become ready.");
});

after(() => {
  server?.kill("SIGTERM");
});

async function request(pathname = "/", init = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    headers: { accept: "text/html" },
    ...init,
  });
}

async function render(pathname = "/") {
  return request(pathname);
}

test("server-renders the PM Reps landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, /<title>PM Reps<\/title>/i);
  assert.match(html, /Decide before you see what the company shipped\./);
  assert.match(html, /Start today/);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview/);
});

test("server-renders the complete workspace surface", async () => {
  const expectations = [
    ["/app/today", /Design the surface before seeing what shipped\./],
    ["/app/feedback", /Inspect the reasoning, then make it better\./],
    ["/app/feedback/example", /Your reasoning, not a model answer\./],
    ["/app/candidates", /Fresh product launches, held behind a review gate\./],
    ["/app/skills", /Progress comes from completed revisions\./],
    ["/app/proof", /Make the reasoning trail recruiter-readable\./],
  ];

  for (const [pathname, expected] of expectations) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), expected, pathname);
  }
});

test("keeps reveal-only fields out of the pre-commit page", async () => {
  const response = await render("/app/today");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Agent tasks are becoming longer-running and more complex\./);
  assert.match(html, /Who should the first version serve most directly\?/);
  assert.doesNotMatch(html, /OpenAI|Codex app|introducing-the-codex-app/i);
  assert.doesNotMatch(html, /41%|13%/);
});

test("rejects incomplete or cross-origin commitments before any reveal", async () => {
  const endpoint = "/api/attempts/commit";
  const incomplete = await request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caseId: "fixed-agent-workspace-001",
      originalResponses: [],
    }),
  });
  assert.equal(incomplete.status, 400);
  assert.doesNotMatch(await incomplete.text(), /OpenAI|Codex app/i);

  const crossOrigin = await request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://attacker.test" },
    body: "{}",
  });
  assert.equal(crossOrigin.status, 403);

  const retiredReveal = await request(
    "/api/cases/fixed-agent-workspace-001/reveal",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
  );
  assert.equal(retiredReveal.status, 404);
});

test("completes the private rep, skill, and reversible proof lifecycle", async () => {
  const identity = {
    "oai-authenticated-user-id": `test-user-${process.pid}`,
    "oai-authenticated-user-email": `test-${process.pid}@example.test`,
  };
  const originalResponses = [
    {
      promptId: "prompt-user",
      selectedChoiceId: "user-professional",
      rationale:
        "Professional developers have the multi-task supervision problem described in the evidence.",
    },
    {
      promptId: "prompt-priority",
      selectedChoiceId: "priority-workspace",
      rationale:
        "A parallel workspace directly reduces context switching while complementing existing tools.",
    },
    {
      promptId: "prompt-metric",
      selectedChoiceId: "metric-accepted",
      rationale:
        "Accepted completed tasks represent delivered value after review, unlike starts or messages.",
    },
    {
      promptId: "prompt-rollout",
      selectedChoiceId: "rollout-staged",
      rationale:
        "A staged release with sandbox defaults limits safety risk and creates a reversible test.",
    },
  ];
  const jsonRequest = (method, body) => ({
    method,
    headers: { ...identity, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const commit = await request(
    "/api/attempts/commit",
    jsonRequest("POST", {
      caseId: "fixed-agent-workspace-001",
      originalResponses,
    }),
  );
  assert.equal(commit.status, 201);
  const committed = await commit.json();
  assert.equal(committed.attempt.status, "committed");
  assert.equal(committed.reveal.schemaVersion, "case-reveal.v1");

  const attemptId = committed.attempt.attemptId;
  const evaluate = await request(
    `/api/attempts/${attemptId}/evaluate`,
    jsonRequest("POST"),
  );
  assert.equal(evaluate.status, 200);
  const evaluated = await evaluate.json();
  assert.equal(evaluated.mode, "rules");
  assert.equal(evaluated.evaluation.dimensions.length, 5);
  assert.ok(
    evaluated.evaluation.dimensions.every((dimension) =>
      dimension.evidenceIds.every((id) => /^evidence-0[1-5]$/.test(id)),
    ),
  );

  const revisionResponses = originalResponses.map((response, index) => ({
    ...response,
    rationale: `${response.rationale} ${
      index === 2
        ? "I would add unsafe or reverted completions as a quality guardrail."
        : "This revision makes the accepted trade-off explicit."
    }`,
  }));
  const revise = await request(
    `/api/attempts/${attemptId}/revise`,
    jsonRequest("POST", { revisionResponses }),
  );
  assert.equal(revise.status, 200);
  assert.equal((await revise.json()).attempt.status, "completed");

  const skills = await request("/api/skills", { headers: identity });
  assert.equal(skills.status, 200);
  assert.equal((await skills.json()).completedReps, 1);

  const proof = await request("/api/proof", { headers: identity });
  assert.equal(proof.status, 200);
  const privateProof = (await proof.json()).card;
  assert.equal(privateProof.status, "private");
  assert.equal(privateProof.snapshot.schemaVersion, "decision-card-public.v1");

  const publish = await request(
    `/api/proof/${privateProof.id}/publish`,
    jsonRequest("POST"),
  );
  assert.equal(publish.status, 200);
  const publicProof = await request(`/api/public-proof/${privateProof.slug}`);
  assert.equal(publicProof.status, 200);
  const publicSnapshot = await publicProof.json();
  assert.equal(publicSnapshot.displayName, "PM Reps learner");
  assert.doesNotMatch(JSON.stringify(publicSnapshot), /@example\.test/);

  const unpublish = await request(
    `/api/proof/${privateProof.id}/unpublish`,
    jsonRequest("POST"),
  );
  assert.equal(unpublish.status, 200);
  assert.equal((await request(`/api/public-proof/${privateProof.slug}`)).status, 404);
});

test("keeps reveal-only values out of emitted client assets", async () => {
  const assetsDirectory = new URL("../dist/client/assets/", import.meta.url);
  const assets = await readdir(assetsDirectory);
  const clientSource = (
    await Promise.all(
      assets
        .filter((name) => name.endsWith(".js"))
        .map((name) => readFile(new URL(name, assetsDirectory), "utf8")),
    )
  ).join("\n");
  assert.doesNotMatch(clientSource, /introducing-the-codex-app|OpenAI launched a desktop command center/i);
});

test("removes the starter and includes durable-state migrations", async () => {
  const [packageJson, hosting, migration] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0000_unknown_invisible_woman.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
  assert.match(packageJson, /"name": "pm-reps"/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": null/);
  assert.match(migration, /CREATE TABLE `attempts`/);
  assert.match(migration, /CREATE UNIQUE INDEX `idx_cards_slug`/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("uses DeepSeek V4 Flash without committing a credential", async () => {
  const [evaluationSource, workerSource, envExample] = await Promise.all([
    readFile(new URL("../app/lib/evaluation.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(evaluationSource, /https:\/\/api\.deepseek\.com\/chat\/completions/);
  assert.match(evaluationSource, /deepseek-v4-flash/);
  assert.match(evaluationSource, /response_format:\s*\{ type: "json_object" \}/);
  assert.match(workerSource, /DEEPSEEK_API_KEY\?: string/);
  assert.match(envExample, /^DEEPSEEK_API_KEY=$/m);
  assert.doesNotMatch(`${evaluationSource}\n${workerSource}\n${envExample}`, /OPENAI_API_KEY|api\.openai\.com/);
});
