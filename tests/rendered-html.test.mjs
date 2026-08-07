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
    ["/app/today", /Decide what this AI product should ship\./],
    ["/app/feedback", /Inspect the reasoning, then make it better\./],
    ["/app/feedback/example", /Your reasoning, not a model answer\./],
    ["/app/candidates", /A filtered pool that trains product judgment\./],
    ["/app/skills", /See first-pass judgment and revision response separately\./],
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

  assert.match(html, /agent tasks are becoming longer-running and more complex\./i);
  assert.match(html, /Who should the first version serve most directly\?/);
  assert.match(html, /1\. Read the case brief/);
  assert.match(html, />trend</i);
  assert.match(html, />behavior</i);
  assert.match(html, />pain</i);
  assert.match(html, />need</i);
  assert.match(html, />risk</i);
  assert.match(html, /PROGRESS &amp; PROOF/);
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

test("keeps automatic case activation fail-closed without the DeepSeek credential", async () => {
  const response = await request("/api/cases/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.code, "configuration_required");

  const today = await request("/api/cases/today", { headers: { accept: "application/json" } });
  assert.equal(today.status, 200);
  const current = await today.json();
  assert.equal(current.caseData.caseId, "fixed-agent-workspace-001");
  assert.doesNotMatch(JSON.stringify(current), /OpenAI|Codex app/i);
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
      initialDirection: "Prioritize the people already coordinating multiple agent tasks.",
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
  assert.equal(committed.reveal.schemaVersion, "case-reveal.v2");
  assert.match(committed.reveal.whatShipped, /desktop command center/i);

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
  const revised = await revise.json();
  assert.equal(revised.attempt.status, "completed");
  assert.equal(revised.attempt.revisionEvaluation.dimensions.length, 5);

  const dispute = await request(
    `/api/attempts/${attemptId}/disputes`,
    jsonRequest("POST", { dimension: "metric_validity" }),
  );
  assert.equal(dispute.status, 201);

  const skills = await request("/api/skills", { headers: identity });
  assert.equal(skills.status, 200);
  const skillPayload = await skills.json();
  assert.equal(skillPayload.completedReps, 1);
  assert.equal(skillPayload.calibration.label, "Early signals");
  assert.equal(skillPayload.disputedObservations, 1);
  assert.equal(skillPayload.patterns[0].firstPass.observationCount, 1);
  assert.equal(skillPayload.patterns[0].revisionResponse.observationCount, 1);

  const proof = await request("/api/proof", { headers: identity });
  assert.equal(proof.status, 200);
  const privateProof = (await proof.json()).card;
  assert.equal(privateProof.status, "private");
  assert.equal(privateProof.snapshot.schemaVersion, "decision-card-public.v1");
  assert.match(privateProof.snapshot.comparison.whatCompanyChoseOrShipped, /desktop command center/i);

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
  const [packageJson, hosting, migration, generatedMigration, poolMigration, curriculumMigration] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0000_unknown_invisible_woman.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../drizzle/0001_married_exodus.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0002_familiar_nocturne.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_vengeful_power_pack.sql", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
  assert.match(packageJson, /"name": "pm-reps"/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": null/);
  assert.match(migration, /CREATE TABLE `attempts`/);
  assert.match(migration, /CREATE UNIQUE INDEX `idx_cards_slug`/);
  assert.match(generatedMigration, /CREATE TABLE `generated_cases`/);
  assert.match(generatedMigration, /idx_generated_owner_status_created/);
  assert.match(poolMigration, /CREATE TABLE `candidate_product_pool`/);
  assert.match(poolMigration, /idx_pool_owner_status_fit/);
  assert.match(curriculumMigration, /CREATE TABLE `evaluation_disputes`/);
  assert.match(curriculumMigration, /idx_skill_attempt_dimension_signal/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("uses selected-only current sync and historical backfill for the practice pool", async () => {
  const [aiHotSource, poolSource, nextSource, revisionSource, backfillSource] = await Promise.all([
    readFile(new URL("../app/lib/ai-hot.server.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/candidate-pool.server.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/cases/next/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/attempts/[attemptId]/revise/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/candidates/backfill/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(aiHotSource, /api\/v1\/items\?mode=selected&category=ai-products/);
  assert.match(aiHotSource, /item\.selected !== true/);
  assert.doesNotMatch(aiHotSource, /mode=all/);
  assert.match(aiHotSource, /api\/v1\/selected\/snapshot/);
  assert.match(aiHotSource, /fields", "default"/);
  assert.match(aiHotSource, /candidateTimelineAt/);
  assert.match(poolSource, /dimensions\.length >= 2/);
  assert.match(poolSource, /score >= 75/);
  assert.match(poolSource, /eq\(candidateProductPool\.status, "queued"\)/);
  assert.match(poolSource, /RANDOM\(\)/);
  assert.match(nextSource, /claimRandomUncompletedProduct/);
  assert.match(nextSource, /replacement < 3/);
  assert.match(revisionSource, /candidateProductPool/);
  assert.match(revisionSource, /status: "completed"/);
  assert.match(backfillSource, /backfillSelectedProductPoolSince/);
  assert.match(backfillSource, /selected_product_history_backfilled/);
});

test("uses DeepSeek V4 Flash without committing a credential", async () => {
  const [evaluationSource, generationSource, workerSource, envExample] = await Promise.all([
    readFile(new URL("../app/lib/evaluation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/case-generation.server.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(evaluationSource, /https:\/\/api\.deepseek\.com\/chat\/completions/);
  assert.match(evaluationSource, /deepseek-v4-flash/);
  assert.match(evaluationSource, /response_format:\s*\{ type: "json_object" \}/);
  assert.match(generationSource, /https:\/\/api\.deepseek\.com\/chat\/completions/);
  assert.match(generationSource, /blind-generator\.v2/);
  assert.match(generationSource, /reviewer\.v2/);
  assert.match(generationSource, /optionQuality/);
  assert.match(generationSource, /sourceQuote/);
  assert.match(workerSource, /DEEPSEEK_API_KEY\?: string/);
  assert.match(envExample, /^DEEPSEEK_API_KEY=$/m);
  assert.doesNotMatch(`${evaluationSource}\n${generationSource}\n${workerSource}\n${envExample}`, /OPENAI_API_KEY|api\.openai\.com|GEMINI_API_KEY|generativelanguage\.googleapis\.com/);
});
