# Handoff prompt

Paste the block below as the first message of a new session. It assumes no prior
context. It is written to be used as-is; edit only the "Your task" section when
you want a different next step.

---

## The prompt

```
You are picking up a build in progress. Read this fully before acting.

## Context

Channel Changers TV is moving into vertical micro-drama: 9:16, 60 to 100 episodes
of roughly 90 seconds, paywalled mid-cliffhanger. The research and the
architecture are done. Groundwork has landed and is green in CI. Your job is to
continue the build.

The architecture, settled and not up for revision: Gen Suite (cc-gensuite) is
deliberately script-in / image-out, and it already carries a secret-authenticated
seam, POST /api/autogen/sessions/from-script, whose own payload documentation
states the authoring half belongs to an upstream service. So brief-to-script
lives in front of that seam, not inside the suite. One delivery per episode,
boardId: null creates the board, MAX_SEED_ROWS 500 is a defect alarm rather than
a budget. An 80-episode series is 80 deliveries.

## Attach and clone these

1. channelchangers/cc-gensuite  -- the suite. This is where you work.
   Use add_repo with access "push", then clone it. Give the clone a generous
   timeout, roughly 10 minutes; it is large and index-pack looks stalled when it
   is not.
2. sammywilko/channel-changers-script-engine -- docs only. The old Script Engine
   app in it is NOT to be extended; it is kept for reference.

## Read first, in this order

1. docs/micro-drama/HANDOFF.md in channel-changers-script-engine. This is the
   full state of play: what is committed and why, the decisions already taken,
   the next task with exact file and line targets, five open rulings, nine traps,
   and the verification commands. Everything below is a summary of it.
2. cc-gensuite/docs/micro-drama-vertical-audit.md if you are doing 9:16 work.
3. cc-gensuite/docs/micro-drama-authoring-service.md if you are building the
   upstream service.
4. cc-gensuite/docs/micro-drama-test-strategy.md before you write any test.
5. cc-gensuite/CLAUDE.md and AGENTS.md. Non-negotiable house rules.

## Environment, before you touch anything

cd cc-gensuite/backend && npm install
npm install --no-save "@google/genai-v2@npm:@google/genai@2.18.0"
cd ../frontend && npm install

That second line is not optional. Any npm install or npm ci wipes the
@google/genai-v2 alias and tsc then fails with TS2307. If you see that error,
this is why.

Then establish your baseline BEFORE editing, so you can tell your breakage from
the repo's:

cd backend && npx tsc --noEmit        # expect clean
cd ../frontend && npx tsc --noEmit    # expect clean
cd .. && bash infra/source-estate-gate.sh && bash infra/denylist-check.sh && bash infra/series-registry-gate.sh

All five of those pass on the current branch. If one fails after your edit, it is
yours.

## Where the work is

PR #12 is open and green: https://github.com/channelchangers/cc-gensuite/pull/12
Branch claude/microdrama-pipeline. Four commits. main is untouched.

Nothing on that branch changes behaviour. The drama prompt corpus exists but
nothing routes to it, which is deliberate: it is what let the documentary golden
bytes be captured honestly.

## Your task

Route the drama prompt corpus. Three edits, all small:

1. backend/src/lib/autogen/prompts.ts, TypedPromptBaseName (around line 79):
   add | 'drama-system'
2. Same file, SharedPromptName (lines 18 to 76): add
   | 'drama-creative-direction-system' and | 'drama-scene-anchor-builder'
3. backend/src/lib/autogen/agent-prompts.ts:104: getSystemPrompt(type) hardcodes
   the base name 'system'. It needs a register argument.

chooseType() needs no change: the drama filenames keep the -type-1 / -type-2
suffix so the A/B routing works untouched.

The trap: the register must resolve from session or registry data, NEVER a string
literal. infra/series-registry-gate.sh fails on ?? 'drama', on two literals on
one executable line, and on series === 'x'. It bans 'demo' too, so you cannot
develop against a seeded slug by hardcoding it. A column on autogen_sessions
defaulting to the documentary register is the clean shape.

Also extend the catalogue in backend/src/lib/autogen/prompts.test.ts
(SHARED_PROMPTS / TYPED_BASE_NAMES around lines 47 to 66, and
assert.equal(expectedCount, 20) near line 209). It does not readdir, so the new
files will not turn it red on their own, but it already lags the union.

After your edit, run the golden suite:

cd backend && TENANT_ID=ci-dummy-tenant TZ=UTC npx tsx src/lib/autogen/prompts.documentary-golden.test.ts

If it goes red you have changed documentary behaviour. Stop and work out why.
This codebase deploys to more than one estate, so a silent change to documentary
prompt output is the worst available outcome. That suite is the reason the
corpus landed before the routing. It has been proven to go red, so trust it.

## Already decided. Do not relitigate without asking the user.

1. Seedance: ALREADY BUILT and shipped dark on main as of cb909d8. Do not
   rebuild it. It is Seedance 2.5 with token-based pricing confirmed against a
   real invoice, durable fire tracking, routes, frontend controls and a
   reconciliation runbook. Flags: seedance_enabled, seedance_allowed_series (a
   pilot allowlist), seedance_max_cents_per_fire and
   seedance_confirm_above_cents. Only two test suites are still missing: an
   isolation suite and a route gate.
2. The brief runs straight through to episode scripts in one pass, then a human
   reviews and amends before anything reaches AutoGen.
3. The authoring half is a new service POSTing to from-script. Not in the suite.
4. Parallel drama prompt corpus routed by a mode flag. Documentary output stays
   byte-identical.
5. The old Script Engine is not to be extended. Keep its architectural position,
   build the service properly.

## Rules that will bite you

- NO em dashes anywhere in code, prompts or docs. Use --. British spelling. This
  is the most common failure in this repo.
- Never name a client, company or broadcaster in a tracked file.
  infra/source-estate-gate.sh scans every tracked file AND every filename. It
  held CI red on main for three weeks because two docs named another estate.
  Write "the sibling".
- Commit hygiene: one commit per unit, stage files BY NAME, never git add -A. Do
  not commit package-lock.json churn from your installs.
- Do not push to main. Work on claude/microdrama-pipeline or a branch off it.
- CI only runs on main or a PR, not on a branch push.
- NEVER deploy. Deploys are ccdeploy only, from the owner's machine, from a clone
  carrying an untracked marker file. Your job ends at git push. Never gsdeploy:
  it serves the sibling estate and would succeed.
- Expect 18 local test failures with no database, all environmental: 15
  ECONNREFUSED on 127.0.0.1:5432, 2 from an unset APP_URL (CI sets
  https://ci-dummy.invalid), 1 egress tripwire on
  shot-conformance.integration.test.ts. Do not chase them. A nineteenth is yours.

## Open rulings. Ask the user, do not decide these yourself.

1. Does the mapper need its own human gate? As specified there is one gate, at
   scripts, which means nobody inspects a shot list before 80 deliveries fire.
2. Conformance QA for contemporary drama. The judge only checks anachronism and
   prompt-contradiction and refuses to judge anachronism without an era, so for
   era-less drama it passes everything. No-op, or write a drama rubric?
3. The episode budget cap collision. app_settings.episode_budget_caps_cents is
   keyed by episode number GLOBALLY and getEpisodeSpendByNumber sums across all
   series, so 80 episodes collide with every other project's episodes 1 to 80.
4. The series registry row: what archive_prefix (must be unique) and studio_id
   for the drama slate? Nothing can be delivered until that row exists.
5. Where does the new authoring service live: a new repo, or cc-studio-services?

## Before you commit anything

Run all three gates plus both typechecks plus the suites you touched, and quote
the exit codes in your commit message. The repo's standard is "prove before you
claim": a green check that has never been seen red is not evidence. If you add a
guard, seed it red once to show it works, then revert.
```

---

## Notes for whoever pastes this

- The "Your task" section is the only part to swap. The handoff document's
  section 5 lists the next six steps in order if you want a different one.
- Step 3 in that list, proving the seam end to end, is the cheapest high-value
  task: the fixture and 45 assertions exist, but nothing has ever been POSTed to
  a running instance. It needs open ruling 4 answered first.
- If the session will do 9:16 work, add one line: the single highest-value fix is
  imagegen.ts:494, where `input.aspectRatio ?? '16:9'` is the chokepoint for
  every image generation, and five callers pass no aspect at all so fixing it
  there fixes them untouched.
