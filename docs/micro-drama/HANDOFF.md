# Micro-drama build: handoff

Written 11 Oct 2026. Read this first if you are picking the build up.

Companions in this folder: `STRATEGY-REPORT.md` (market and investment case),
`SCRIPT-PLAYBOOK.md` (craft rules; section 12 is superseded), `BUILD-PLAN.md`
(the architecture and phasing this handoff executes against).

---

## 1. Where things stand

Two repositories, two branches, one open PR.

| Repo | Branch | State |
|---|---|---|
| `sammywilko/channel-changers-script-engine` | `claude/channel-changers-micro-dramas-x60lq3` | Pushed. Docs only: strategy report, playbook, build plan, this handoff. No PR. |
| `channelchangers/cc-gensuite` | `claude/microdrama-pipeline` | Pushed. **PR #12 open.** 4 commits, code plus specs. |

**PR #12**: https://github.com/channelchangers/cc-gensuite/pull/12

At the time of writing, 7 of 8 CI checks green (`bff`, `studio-build`,
`typecheck (backend)`, `typecheck (frontend)`, `deny-list`,
`docker-build (backend)`, `docker-build (frontend)`), with `lock-suite` still
running. No review comments. Check the PR for the final verdict.

**Nothing on that branch changes behaviour.** The drama prompt corpus exists but
nothing routes to it, so both estates render exactly as before. That inertness is
deliberate: it is what let the golden bytes be captured honestly.

Also published, for investor and broadcaster conversations:
https://claude.ai/artifact/9gdv4n6DCLjpURFVpYgm8t

---

## 2. Get a working environment first

The suite is at `/home/user/cc-gensuite` in a fresh session (clone it if absent).

```bash
cd backend && npm install
npm install --no-save "@google/genai-v2@npm:@google/genai@2.18.0"   # see trap 1
cd ../frontend && npm install
```

Then confirm the baseline before you touch anything:

```bash
cd backend  && npx tsc --noEmit    # expect clean
cd ../frontend && npx tsc --noEmit # expect clean
cd ..
bash infra/source-estate-gate.sh && bash infra/denylist-check.sh && bash infra/series-registry-gate.sh
```

All three gates pass on this branch. If any fails, it is something you added.

---

## 3. What is committed, and why each piece exists

### `6ba9dc9` Drama prompt corpus

Four new files in `backend/src/lib/autogen/prompts/`: `drama-system-type-1.md`,
`drama-system-type-2.md`, `drama-creative-direction-system.md`,
`drama-scene-anchor-builder.md`.

Parallel to the documentary corpus rather than a generalisation of it, because
the same codebase ships to a sibling estate and existing documentary renders must
stay byte-identical. Each file inverts a specific documentary rule: era becomes
optional with continuity replacing it, the 1940s-to-1980s scene-density guardrail
becomes 1 to 3 people, the archival "Feels like" closer becomes a contemporary
"Plays like" anchor, and the scene anchor stops forbidding the dramatic close-up.

They also lift the corpus-wide ban on aspect language and teach vertical
composition, which is the real point: two-shots fail on the narrow horizontal
axis, so the prompts teach depth blocking covered in alternating singles.

Interpolation variables are identical to the documentary counterparts, so no call
site changes.

### `35f6337` Byte-identical golden guarantee

`backend/src/lib/autogen/prompts.documentary-golden.test.ts` plus fixtures in
`__fixtures__/documentary-prompt-golden/` (33 goldens, `inputs.json`,
`generate.ts`, `MANIFEST.sha256`).

This is the guard rail for everything that follows. Root digest
`5093827b1649472daec9aa8f0102b1308fa317397ab1218b8733480878a5e06f`.

Captured before any drama routing existed. There is no `UPDATE_GOLDEN` flag, by
design: regeneration runs `generate.ts` explicitly and produces a diff a human
reads. Drift reports a byte offset and both digests, not "strings differ".

Proven red before being trusted: appending one line to `classifier-system.md`
failed at byte 3139 with exit 1, then passed again after revert.

### `9c0f500` Seam proof fixture

`backend/src/lib/scriptengine/__fixtures__/microdrama-seed.ts` and
`microdrama-seed.test.ts`. A ten-episode builder plus 45 assertions against the
real `parseFromScriptBody`.

Settles the wire contract by test rather than at integration time. 150 shots over
10 episodes, 12 to 18 per episode, because a 90-second episode is not one clip
(Omni caps 3 to 10s, Veo tiers are 4/6/8s).

### `eb02d81` Three specifications

In `cc-gensuite/docs/`: `micro-drama-authoring-service.md` (1,738 lines, 7 stages,
20 tables, API contract, the mapper), `micro-drama-vertical-audit.md` (488 lines,
line-precise 9:16 patch list), `micro-drama-test-strategy.md` (821 lines, how this
repo actually tests).

---

## 4. Decisions already taken. Do not relitigate without asking.

1. **Seedance**: add as a third provider, isolated behind a flag, off by default,
   never reachable from the sibling estate's deployment.
2. **Autonomy**: the brief runs straight through to episode scripts in one pass,
   then a human reviews and amends before anything is handed to AutoGen.
3. **Where the authoring half lives**: a new service POSTing to the existing
   `from-script` seam. Not inside Gen Suite.
4. **Prompt corpus**: parallel drama corpus routed by a mode flag. Documentary
   output stays byte-identical.
5. **The old Script Engine is not to be extended.** Keep its architectural
   position (authoring upstream of `from-script`), build the service properly.
   Worth carrying over: the `dialogueDNA` idea and the structured-update pattern.
   Not worth carrying over: the 5-phase chat flow, the 16:9 storyboard view, the
   Supabase sync.

---

## 5. Next task, in order

### Step 1: route the drama corpus (the next code change)

This is small, and the golden suite now guards it. Three edits:

- `backend/src/lib/autogen/prompts.ts`, `TypedPromptBaseName` (around line 79):
  add `| 'drama-system'`.
- Same file, `SharedPromptName` (lines 18 to 76): add
  `| 'drama-creative-direction-system'` and `| 'drama-scene-anchor-builder'`.
- `backend/src/lib/autogen/agent-prompts.ts:104`: `getSystemPrompt(type)`
  hardcodes the base name `'system'`. It needs a register argument.

`chooseType()` needs no change: the drama filenames keep the `-type-1` /
`-type-2` suffix so A/B routing works untouched.

**The trap**: the register must resolve from session or registry data, never a
string literal. `infra/series-registry-gate.sh` fails on `?? 'drama'`, on two
literals on one executable line, and on `series === 'x'`. It bans `'demo'` too, so
you cannot develop against a seeded slug by hardcoding it. A column on
`autogen_sessions` (defaulting to the documentary register) is the clean shape, and
matches decision 4.

Also extend the catalogue in `backend/src/lib/autogen/prompts.test.ts`
(`SHARED_PROMPTS` / `TYPED_BASE_NAMES` around lines 47 to 66, and the
`assert.equal(expectedCount, 20)` near line 209). It does not readdir, so the new
files will not turn it red on their own, but it already lags the union.

After the edit, run the golden suite. If it goes red, you changed documentary
behaviour and must stop.

### Step 2: the vertical chokepoint (one line, nil risk)

`backend/src/lib/autogen/imagegen.ts:494`:

```ts
const aspectRatio: NanoBananaAspect = input.aspectRatio ?? '16:9'
```

Resolve it from the session instead. Five callers (`preflight`,
`anchor-lifecycle`, `chat-agent`, `character-board-seam`, `conformance-worker`)
pass no aspect at all, so fixing the chokepoint fixes them without touching them.

Risk is nil because `autogen_sessions.default_aspect` is already
`NOT NULL DEFAULT '16:9'`. That column exists, is writeable through the settings
patch, and **is currently read by nothing**, which is exactly why every default
falls back to a literal.

Then work the ordered sequence in `cc-gensuite/docs/micro-drama-vertical-audit.md`
section 6. Real scope is 70 live sites, 24 of them operator-facing frontend. The
audit recommends one shared `useProjectAspect()` hook rather than threading
through 14 files.

### Step 3: prove the seam end to end

The fixture is built; nothing has been POSTed yet. Send one ten-episode season at
`POST /api/autogen/sessions/from-script` against a dev series row, and confirm ten
boards are created. This is the cheapest possible validation of the whole
architecture and it needs no authoring code.

Requires: a `series` registry row (see open ruling 4) and the service secret
(`backend/src/lib/scriptengine/service-principal.ts`).

### Step 4: instrumentation, before a real slate rather than after

- **Keeper rate.** Join `autogen_generations` (`status='succeeded'`,
  `deleted_at IS NULL`) against `autogen_panel_final_picks`. Two traps: the solo
  path allows multiple finals per shot, so use `COUNT(DISTINCT shot_version_id)`
  not `COUNT(*)`; and `autogen_composite_panel_overrides` is a second, separate
  acceptance signal. Add a fourth key to `metrics-rollup.ts`, which currently has
  exactly three.
- **Series-level cost estimate.** `computeJobEstimate(sessionId)` is per-session
  and video-centric. `DEFAULT_RETRY_BAND = {3, 6, 12}` comes from documentary
  stills re-rolls and has no micro-drama data behind it, so treat the first title
  as calibration.
- **Budget cap fix.** See open ruling 3.

### Step 5: the authoring service

Build to `cc-gensuite/docs/micro-drama-authoring-service.md`. Port
`kb-search.ts` rather than rewriting it: `extractTopicsFromBriefs(brief_blob)` and
`groundedSearchForTopic()` are a complete grounded research engine with zero
callers, and `autogen_knowledge_facts` is a table with readers and no writer.

### Step 6: Seedance

> **CORRECTION, 11 Oct 2026.** Seedance is **already built and shipped dark on
> `main`** (verified at `cb909d8`), and more thoroughly than this section
> assumed. Do not rebuild it. What exists: `generation/seedance-video.ts` and
> `seedance-video-failure.ts` with suites, `seedance-fires.ts` for durable fire
> tracking, routes with pg tests, `frontend/src/features/seedance/`,
> `docs/SEEDANCE-PLAN.md` and `docs/runbooks/seedance-reconciliation.md`. It is
> Seedance **2.5**, not 2.0, and the pricing rows are token-based and confirmed
> against a real invoice rather than estimated. `VideoProviderName` is now a
> named type, so the `'vertex' | 'omni'` union described below no longer exists.
>
> The shipped flag design is better than the one specified here: alongside
> `seedance_enabled` there is `seedance_allowed_series` (a pilot allowlist),
> `seedance_max_cents_per_fire` (a hard per-fire ceiling) and
> `seedance_confirm_above_cents`. That per-fire ceiling is worth copying for the
> episode budget cap problem in the open rulings.
>
> Still genuinely missing, and worth doing: an isolation suite
> (`seedance-isolation.test.ts`) and a route gate
> (`generate-video.seedance-gate.test.ts`). See
> `cc-gensuite/docs/micro-drama-test-strategy.md` Package E.


`backend/src/lib/generation/video-types.ts` declares
`interface VideoGenerationProvider` with `readonly name: 'vertex' | 'omni'`, and
`generation/index.ts` has `getVideoProvider(model?)` dispatching by model id.
Widen the union, add `seedance-video.ts`, register it, add pricing rows, key in
Secret Manager, flag off by default.

Document the data residency position in the file header, because the current
headers assert the opposite ("NO dev-API key, NO off-Vertex billing, NO off-Vertex
data residency") and someone will read them and be misled.

---

## 6. Open rulings. These block build, not the PR.

1. **Does the mapper need its own gate?** As specified there is one human gate, at
   scripts. That means nobody inspects a shot list before eighty deliveries fire.
2. **Conformance QA for contemporary drama.** The judge only checks `anachronism`
   and `prompt-contradiction`, and refuses to assess anachronism without an era.
   Contemporary drama has no era, so as built it returns `conforms: true` for
   everything. Ship as a no-op, or write a drama rubric? Faking a period is not an
   option.
3. **The episode budget cap collision.** `app_settings.episode_budget_caps_cents`
   is keyed by episode number **globally**, and `getEpisodeSpendByNumber` sums
   across all series. Eighty episodes collide with every other project's episodes
   1 to 80. Key by `(series, episode)`, or add a series-level cap? Note caps are
   alert-only today: nothing refuses a generation, and `boards.budget_cap_cents`
   is display-only outside two Look Studio preflights.
4. **The series registry row.** What `archive_prefix` (must be unique) and
   `studio_id` for the drama slate? Nothing can be delivered until this row
   exists.
5. **Where does the authoring service live?** New repo, or `cc-studio-services`?

---

## 7. Traps that will cost you an afternoon

1. **The `@google/genai-v2` alias.** Any `npm ci` or `npm install` wipes it and
   `tsc` fails with `TS2307`. Reapply with
   `npm install --no-save "@google/genai-v2@npm:@google/genai@2.18.0"`. If
   worktrees symlink `node_modules`, all of them break at once.
2. **Scene identifiers must be fixed-width zero-padded.** The suite reads shots
   through two orderings that do not agree: `shots.ts:475` orders
   `scene_identifier` as TEXT in SQL, while `compareSceneShot`
   (`export-slot-map.ts:311`) sorts numerically only when
   `String(parseInt(s)) === s` and otherwise falls back to `localeCompare`.
   Unpadded breaks the first reader at ten scenes, since `'10'` sorts before
   `'2'`. **The seam validates none of this**, so the mistake never raises an
   error, it just lays a board out in the wrong order. Three assertions in
   `microdrama-seed.test.ts` encode the rule.
3. **No em dashes** anywhere in code, prompts or docs. Use `--`. British
   spelling. This is the single most common failure in this repo.
4. **Never name a client, company or broadcaster** in a tracked file.
   `infra/source-estate-gate.sh` scans every tracked file **and every filename**.
   It held CI red on main from 17 Aug to 9 Sep 2026 because two docs named another
   estate. Write "the sibling".
5. **Commit hygiene**: branch in a worktree, one commit per unit, stage files **by
   name**. Never `git add -A`. Do not commit `package-lock.json` churn from
   installs.
6. **CI only runs on `main` or a PR**, not on a branch push.
7. **Deploys are `ccdeploy` only, from Sam's machine**, from a clone carrying the
   untracked `scripts/.ccdeploy-from-here` marker. A remote session's job ends at
   `git push`. Never `gsdeploy`: it serves the sibling estate and would succeed.
8. **AutoGen sits behind `app_settings.autogen_enabled`.** A new stage inherits
   that kill switch.
9. **Everything consistency-related is dark and some of it is uncalibrated.**
   `conformance_qa_enabled` defaults false and the verdict is stripped from normal
   API reads by `generations-ledger.ts:281`, so a new metric must query the table
   directly. Continuity drift thresholds are explicitly placeholders
   (`DRIFT_AMBER_PCT = 35`, `DRIFT_RED_PCT = 55`, "NOT calibrated").
   `autogen_character_refs.phash` is written, indexed and never read.

---

## 8. Verification commands

```bash
# gates (run all three before any commit touching code or docs)
bash infra/source-estate-gate.sh && bash infra/denylist-check.sh && bash infra/series-registry-gate.sh

# typecheck
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# a single suite, the way CI runs it
cd backend && TENANT_ID=ci-dummy-tenant TZ=UTC npx tsx <path>.test.ts

# the two suites added here
cd backend && TENANT_ID=ci-dummy-tenant TZ=UTC npx tsx src/lib/autogen/prompts.documentary-golden.test.ts
cd backend && TENANT_ID=ci-dummy-tenant TZ=UTC npx tsx src/lib/scriptengine/microdrama-seed.test.ts

# the whole set, by discovery (a new *.test.ts is in CI the moment it lands)
cd backend && TENANT_ID=ci-dummy-tenant TZ=UTC bash scripts/ci-test-suites.sh
```

**Expected local failures without a database: 18, all environmental.** Fifteen are
`ECONNREFUSED 127.0.0.1:5432` (CI runs `pgvector/pgvector:pg15`; plain postgres
builds the schema half-complete). Two are an unset `APP_URL`, which CI sets to
`https://ci-dummy.invalid`. One is the egress tripwire firing on
`shot-conformance.integration.test.ts`, which reaches `aiplatform.googleapis.com`.
Do not chase these. If you see a nineteenth, it is yours.

---

## 9. Worth someone's attention, unrelated to this work

`shot-conformance.integration.test.ts` trips the repo's own egress tripwire by
calling out to Vertex. The tripwire says what it wants: stub it through the
module's `__setXxxTestOverrides` seam rather than calling out. As it stands the
suite cannot pass in a sandbox, and in CI it either needs credentials or is not
proving what it appears to prove.

---

## 10. Monitoring state

This session subscribed to PR #12 activity and armed one safety-net check-in
(`trig_01PLj2YpnCMxuTiLQzGiMSn2`, fires 02:03Z). If you continue in a new session,
that subscription does not follow you: re-subscribe, or watch the PR yourself.

---

## 11. Still outstanding from the research phase

Blocking items for the investment case, unchanged and all external:

- Platform revenue-share percentages. No verified figure exists publicly for any
  app. MIPCOM Cannes ran 12 to 15 October 2026; if it was attended, this may now
  be in hand.
- SAG-AFTRA Verticals Agreement: extended past its 30 June 2026 sunset, or lapsed?
- Apple's 15% external-link proposal (13 to 14 Aug 2026): granted, modified or
  withdrawn?
- UK micro-drama revenue in pounds. Audience and rank exist; the money does not.
- Channel 4 Digital Originals commissioning terms, unread.
- Whether each target platform accepts AI-generated content, and disclosure rules.
- The YouTube video that started this was never analysed: every route to it was
  blocked by the network egress policy. The title or a transcript would still be
  useful.
