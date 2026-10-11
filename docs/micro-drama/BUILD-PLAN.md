# Micro-drama pipeline: plan and handoff

Status: planning complete, no code written. Written 11 Oct 2026.

---

## Context

Channel Changers TV wants to move into vertical micro-drama (60 to 100 episodes of
roughly 90 seconds, 9:16, paywalled mid-cliffhanger). Research is done and
committed; see "Delivered so far" below.

The ask that drove this plan: put a **brief** into the CC Suite and have it work out
the research, the series architecture, the script and the shots, generate everything
inside the suite, and leave it amendable. In the user's words, "changing what the
suite is in a bigger sense".

The key discovery from exploring `cc-gensuite` is that this does not need a new
monolith. Gen Suite v2 is deliberately **script-in / image-out**, and it already
carries a secret-authenticated ingest seam, `POST /api/autogen/sessions/from-script`,
whose own payload documentation states that the authoring half (a "beat to ai-visual
mapper") belongs to an upstream service. The brief-to-script stage was always meant
to live in front of that seam. So the work splits cleanly into an authoring service
we build properly, and a set of targeted changes inside Gen Suite to make it
vertical-drama capable.

---

## Delivered so far (already committed and pushed)

Branch `claude/channel-changers-micro-dramas-x60lq3` on
`sammywilko/channel-changers-script-engine`, commit "Add micro-drama strategy report
and script playbook":

- `docs/micro-drama/STRATEGY-REPORT.md`: market sizing with competing analyst
  figures reconciled rather than averaged, monetisation and unit economics,
  distribution platforms and deal structures, UK production costs, the negative
  AVEC tax-relief finding, the 2026 AI stack, the broadcaster case, a three-year
  model, a risk register and a phased plan. Every claim provenance-labelled.
- `docs/micro-drama/SCRIPT-PLAYBOOK.md`: the craft manual, built partly from
  Chinese-language duanju sources (the hook taxonomy, the cut/conflict/reversal
  triad, the satisfaction beat, explicit first and second paywall marking at outline
  stage), plus a tooling specification.
- Published artifact (red and bone CCTV brand, no lockup):
  https://claude.ai/artifact/9gdv4n6DCLjpURFVpYgm8t

Note: the playbook's tooling section (section 12) was written before cc-gensuite was
readable and assumes the work lands in the old Script Engine. **It is superseded by
this plan** and should be revised when the authoring service is built.

---

## Decisions already taken by the user

1. **Seedance**: add as a third provider, isolated behind a flag, off by default,
   never reachable from the sibling estate's deployment. The suite was deliberately
   refactored to Vertex-only ("NO dev-API key, NO off-Vertex billing, NO off-Vertex
   data residency"), so this must not silently reverse that for existing work.
2. **Autonomy**: the brief runs straight through to episode scripts in one pass,
   then a human reviews and amends before anything is handed to AutoGen.
3. **Where to build**: a new authoring service POSTing to the existing `from-script`
   seam. Not inside Gen Suite.
4. **Prompt corpus**: a new parallel drama corpus routed by a mode flag. Existing
   documentary renders must stay byte-identical, because the same codebase ships to
   the sibling estate.
5. **The existing Script Engine is not to be extended.** The user's assessment is
   that it did not work well. Keep the architectural position (authoring upstream of
   `from-script`) but build the service properly rather than growing the old
   Gemini chat app.

---

## Architecture

```
  BRIEF
    |
    v
  [NEW] Authoring service ................ brief -> research -> series bible
    |                                      -> episode grid (with paywall marks)
    |                                      -> episode scripts -> ai-visual mapper
    |                                              |
    |                                      HUMAN REVIEW AND AMEND
    |                                              |
    v
  POST /api/autogen/sessions/from-script ... one delivery PER EPISODE
    |
    v
  Gen Suite AutoGen ...................... parse -> refs -> preflight -> generate
    |                                      -> conformance -> export to board
    v
  Board per episode -> rough cut -> delivery
```

### Why one delivery per episode

The seam enforces it. From `backend/src/lib/scriptengine/from-script-payload.ts`:

- `MAX_SEED_ROWS = 500`, with the comment "A delivery bigger than an episode's shot
  list is a mapper defect, not a big episode, and the seed runs as ONE transaction."
- `boardId: null` means "create a new board".
- `SHOT_IDENTIFIER_RE = /^[A-Z](?:\.\d{1,3})?$/` and `MAX_SHOTS_PER_SCENE = 26`.
- `seriesId` is accepted from the series registry only, must be `creatable`, no
  fallback.
- Authentication is by service secret, not user (`service-principal.ts`).
- `payloadHash` detects a divergent re-send; `delivery.ts` drives
  pending -> seeded -> confirmed.

This matches the schema decision recorded in `backend/src/lib/schema.ts`
("One board = one episode = one story"). An 80-episode series is therefore 80 boards
and 80 AutoGen sessions under one `series` row, created by 80 deliveries.

---

## Work package A: the authoring service

A new service, not an extension of `channel-changers-script-engine`. Suggested home:
a new repo, or `cc-studio-services`. Node and TypeScript to match the house stack,
Postgres for state, deployed to `cc-studio-prod`.

### A1. Stages

Each stage persists its output so a run is resumable and amendable:

1. **Brief intake.** Free text plus structured fields (genre, territory, episode
   count, tone, cast size, locations available, budget ceiling).
2. **Research.** See A2.
3. **Series bible.** Trope and genre selection from the playbook taxonomy, the
   injustice, the concealed advantage, 2 to 3 central characters with speech
   patterns, 3 to 5 fixed locations written to what can actually be shot or
   generated.
4. **Episode grid.** 60 to 100 rows: per-episode hook type, beat spine,
   cliffhanger type, and the first and second paywall positions as required fields.
5. **Episode scripts.** 400 to 600 words per episode, final three seconds written
   first.
6. **AI-visual mapper.** Scripts to `ScriptSeedRow[]`, one array per episode,
   respecting the shot grammar above.
7. **Delivery.** One POST per episode, with retry and divergent-resend handling.

Stop at stage 5 for human review before stage 6 fires anything.

### A2. Research: port the dead engine, do not rewrite it

`cc-gensuite/backend/src/lib/autogen/kb-search.ts` is a complete, working research
engine with **no callers**:

- `extractTopicsFromBriefs(brief_blob: string): Promise<string[]>` (the only place in
  either codebase that treats a brief as an input unit)
- `groundedSearchForTopic(topic, context): Promise<GroundedFact[]>`, running
  Gemini 2.5 Pro with `tools: [{ googleSearch: {} }]`, returning facts paired with
  `groundingChunks` source URLs and titles

Lift this into the authoring service and retarget its prompt. Its current prompt is
hard-wired to documentary period research ("architecture of a named place in a
specific era, period-appropriate vehicles"). For drama the research targets are
different: trope saturation, territory taste, comparable titles, platform house
style.

Two constraints carried from `agent.ts`:

- **Grounding and `responseSchema` are mutually exclusive** (`agent.ts:170`:
  `const schemaForCall = useWebSearch ? undefined : responseSchema`). Grounded calls
  must enforce JSON by prose and validate after.
- Grounding is region-gated. `kb-search.ts` pins a separate client to
  `location: 'global'` because `europe-west2` rejects the `googleSearch` tool.

There is also an empty table waiting for this: `autogen_knowledge_facts`
(`topic`, `fact`, `source_url`, `source_title`, `confidence`, `user_pinned`,
`user_dismissed`) has live readers (`routes/autogen.ts:4708`,
`export-slot-map.ts:1029`, `lineage.ts:746`) and no writer. Decide whether the
authoring service writes research facts back through the seam so the existing
readers light up, or keeps them local. Writing them back is the smaller change and
makes research visible in the suite where the UI already expects it.

### A3. What the old Script Engine is worth keeping

Not the app. Possibly two ideas:

- `CharacterProfile.dialogueDNA` (per-character speech pattern) maps onto Gen Suite's
  `character_profiles.identity_prompt` concept and is the right shape for drama.
- The `json:update` structured-extraction pattern (model emits a typed block that
  drives state) is a reasonable interim mechanism, though a real job pipeline is
  better.

Everything else (the 5-phase chat flow, 16:9 storyboard view, Supabase sync) should
not be carried over.

---

## Work package B: Gen Suite changes

All behind flags, all leaving documentary behaviour unchanged.

### B1. Drama prompt corpus (`backend/src/lib/autogen/prompts/`)

Add `drama-*.md` siblings and route by a new session mode. Per the user's decision,
a parallel corpus, not a generalisation.

The existing corpus actively fights drama. Specifics found:

- `system-type-1.md:30`: "Accuracy is paramount. This is a real documentary.
  Every detail must be historically and technically correct for the era."
- `creative-direction-system.md` scene-density guardrail is tuned to 1940s to 1980s
  rural America ("Pedestrians in an exterior shot: 1-5 maximum").
- `system-type-1.md:72`: a mandatory archival "Feels like" closer naming an era
  archival fantasy. A contemporary vertical soap wants the opposite register.
- `element-synth-type-1.md:37`: "no environmental drama", "no period-appropriate
  vehicle drama".
- `scene-anchor-builder.md:8` forbids drama grammar outright: "not a dramatic
  close-up, not a canted angle, not a character portrait".
- Every `style.ts` preset is a documentary or period film-stock register. There is no
  drama preset.

Start with the prompts a 90-second vertical episode actually touches: per-shot synth,
creative direction, scene anchor. Storyboard, element and coverage prompts can stay
documentary-only until needed.

Reusable as-is: the `conformance-qa-judge.md` precision discipline ("a false alarm on
good work is worse than a miss") and the controlled-imperfection framework in
`system-type-1.md:124`.

### B2. Vertical (9:16): the real scope

9:16 works **only** for the single ad-hoc and per-row image path. Correcting an
earlier wrong assessment, it is not supported end to end. What needs doing:

- `storyboards.ts:337`: `aspectFromGrid()` ignores its parameter and returns
  `'16:9'`. The synth prompts do panel arithmetic off that outer ratio
  ("the outer composite is always 16:9 regardless of grid"), so a 9:16 outer inverts
  every stated panel ratio.
- `element-candidates.ts` (lines 1692, 1740, 1960, 2002) hardcode `'16:9'`, and the
  frontend fixes it with no UI (`ElementLockConfirmSubmodal.tsx:69`,
  `const FIXED_ASPECT = '16:9'`). A locked character's founder image is therefore
  always landscape, and becomes the i2i anchor for a vertical shot. **This is the
  highest-value single fix.**
- `coverage-run.ts:275` hardcodes `'16:9'`; `CoverageSetSpec` has no aspect field.
- `director-desk.ts:761` hardcoded.
- `storyboard-pdf.ts`: A4 landscape, cover-fit, so 9:16 frames centre-crop.
- 18 frontend components hardcode `aspect-video` or `16 / 9`.
- **The prompt corpus bans aspect language** ("No aspect-ratio language ('16:9',
  'anamorphic', 'vertical'). Aspect is set elsewhere"), repeated across nine synth
  prompts. So the builder cannot compose for a vertical frame even when handed
  `9:16`. The drama corpus (B1) must lift that ban and teach vertical blocking:
  single subject, tight, stacked negative space, no two-shots, depth instead of
  side-by-side.

### B3. Seedance provider

The extension point is clean. `backend/src/lib/generation/video-types.ts` declares
`interface VideoGenerationProvider` with `readonly name: 'vertex' | 'omni'`, and
`generation/index.ts` has `getVideoProvider(model?)` dispatching by model id.

Work: widen the union, add `seedance-video.ts` implementing the interface, register
it in the factory, add pricing rows (see B5), key in Secret Manager, and a flag that
is off by default and cannot be enabled in the sibling estate. Document the data
residency position explicitly in the file header, because the current headers assert
the opposite and someone will read them.

### B4. Keeper rate metric

The inputs exist; nothing computes it. Join `autogen_generations` (status
`succeeded`, `deleted_at IS NULL`) against `autogen_panel_final_picks`. Two traps:

- The solo path allows **multiple finals per shot** (the unique index is
  `(shot_version_id, final_generation_id)`), so use `COUNT(DISTINCT shot_version_id)`
  not `COUNT(*)`.
- `autogen_composite_panel_overrides` is a second, separate acceptance signal.

Add a fourth key to `metrics-rollup.ts` (currently exactly three:
`gen_success_rate_per_element`, `row_build_retry_count_avg`,
`panel_crops_failure_rate`).

Precedent: `job-estimate.ts:114` documents a hand-run prod query computing the
reciprocal of this, once, in June 2026, frozen into two series constants. The SQL
file it names (`estimator/measure-attempts-per-shot.sql`) is not in the repo.

### B5. Cost estimation for a series

`computeJobEstimate(sessionId)` is per-session and video-centric: shots times
`NAPKIN_SECS_PER_SHOT = 5` times a retry band times a Veo per-second rate. For a
series we need an aggregate across 80 sessions. Also:

- `DEFAULT_RETRY_BAND = {3, 6, 12}` is derived from documentary **stills** re-rolls
  and has no micro-drama data behind it. Treat the first title as calibration.
- `estimateCostPence()` in `imagegen.ts:211` is hardcoded pence, not table-driven,
  and is what actually lands on `autogen_generations.cost_pence`.
- A 90-second episode is **not one clip**. Omni caps at 3 to 10s, Veo tiers are
  4/6/8s, so an episode is roughly 12 to 18 generated shots and an 80-episode series
  is roughly 1,000 to 1,500 generations before re-rolls. This number drives the
  whole financial model in the strategy report.

### B6. Episode budget cap collision (must fix before a real slate)

`app_settings.episode_budget_caps_cents` is a JSON object keyed by episode **number**
globally, for example `{"5": 50000}`, and `getEpisodeSpendByNumber(ep)` sums across
**all series**. Eighty episodes in one drama will collide with every other project's
episodes 1 to 80. Either key the caps by `(series, episode)` or add a series-level
cap. Note also that caps are **alert-only**: nothing refuses a generation, and
`boards.budget_cap_cents` is display-only except in two Look Studio preflights.

### B7. Things that are dark and will mislead

- `conformance_qa_enabled` defaults false. When on, it stamps a verdict and surfaces
  nothing, and `generations-ledger.ts:281` **deletes** `conformance_status` and
  `conformance_result` from every normal API read. A new metric must query the table
  directly.
- The conformance judge only checks `anachronism` and `prompt-contradiction`, and
  **refuses to judge anachronism without an era**. Contemporary drama has no era, so
  as built it returns `conforms: true` for everything. The automatic QA is a no-op
  for this use case until it gets a drama rubric.
- Continuity drift thresholds are explicitly uncalibrated: `config.ts` says
  `DRIFT_AMBER_PCT = 35` / `DRIFT_RED_PCT = 55` are "PLACEHOLDERS, these are NOT
  calibrated". Only character centroids exist, no look or scene.
- `autogen_character_refs.phash` is written and indexed but **never read for
  comparison**. Drift uses multimodal embeddings, not phash.

---

## Hard constraints on landing this

From `CLAUDE.md`, `AGENTS.md` and `.claude/skills/gs-dev-workflow`:

- **Gates that must pass before any commit touching code or docs:**
  `bash infra/source-estate-gate.sh && bash infra/denylist-check.sh && bash infra/series-registry-gate.sh`
- **The series-registry gate is the sharpest.** A new drama series must be a **row in
  the `series` table** with `creatable`, `internal`, `archive_prefix`, `studio_id`.
  Any `?? 'drama'`, any two-literal array on one line, any `series === 'drama'` fails
  CI. `demo` is banned too, so you cannot develop against a seeded slug by
  hardcoding it.
- **No em dashes** anywhere in code, prompts or docs. Use `--`. British spelling.
- Any new `/api` router must go through `scoped()`; `scoped-routes-gate.sh` bans raw
  `router.verb` on a fenced router, and `series-visibility.mounts.test.ts` asserts
  every mount is fenced or exempt.
- Any new table must survive `initializeSchema` twice (CI-only, real pgvector
  Postgres).
- `npx tsc --noEmit` clean on both `backend/` and `frontend/`. No aggregate test
  runner; suites run individually via `tsx`. A fresh checkout shows roughly 18
  pre-existing backend failures that are not yours.
- Commit hygiene: branch in a **worktree**, one commit per unit, stage files **by
  name**, never `git add -A`.
- Push to `main` is pre-authorised (solo maintainer, no PR step). CI runs on push to
  main and on PRs, not on branch pushes.
- **Deploys are gated to Sam's machine via `ccdeploy` only.** A remote session's job
  ends at `git push`. Never `gsdeploy`, it serves the sibling estate.
- Known build trap: `TS2307: Cannot find module '@google/genai-v2'` after any
  `npm ci`. Fix with
  `cd backend && npm install --no-save "@google/genai-v2@npm:@google/genai@2.18.0"`.
- AutoGen sits behind `app_settings.autogen_enabled`; a new stage inherits that.

---

## Suggested sequencing

**Phase 1, prove the seam (smallest useful thing).** Hand-write one 10-episode
`ScriptSeedRow[]` payload per episode and POST it to `from-script` against a dev
series row. Confirms the contract, the board-per-episode shape, and the series
registry path before any authoring code exists.

**Phase 2, vertical fixes in Gen Suite.** B2 element base refs first (the i2i anchor
problem), then the drama corpus for the three prompts that matter (B1), then
storyboard aspect. Gate behind the mode flag.

**Phase 3, authoring service.** A1 stages 1 to 5 plus the ported research engine
(A2). Human review gate. Then the mapper and delivery (stages 6 and 7).

**Phase 4, instrumentation.** Keeper rate (B4), series-level cost estimate (B5),
budget cap fix (B6). Do this before a real slate, not after.

**Phase 5, Seedance** (B3), measured against Veo and Omni Flash on real episodes.

---

## Verification

- Seam: `npx tsx backend/src/lib/scriptengine/from-script-payload.test.ts` and
  `delivery.test.ts`, `delivery.fence.test.ts`. These are the existing contract
  tests and must stay green.
- Vertical: generate one 9:16 element base ref, then one 9:16 per-row shot anchored
  on it, and confirm the founder image is no longer landscape.
- Drama corpus: fire the same shot under both modes and diff the built prompt.
  Documentary output must be byte-identical to before.
- Keeper rate: run the join against prod read-only and sanity-check against the
  frozen constants in `job-estimate.ts`.
- End to end: one brief to ten episodes to ten boards, with a human amend in the
  middle, and a cost estimate that matches actual spend within the retry band.

---

## Open questions

1. **Where does the authoring service live?** New repo, or `cc-studio-services`?
   Not yet inspected.
2. **Do research facts get written back** through the seam into
   `autogen_knowledge_facts` so the existing readers light up, or stay local?
3. **Series registry row**: what `archive_prefix` and `studio_id` for the drama
   slate? Must be unique.
4. **Does the sibling estate need fencing beyond the flag** for Seedance, given the
   same codebase ships there? Worth a written ruling in the ledger, per AGENTS.md
   rule 7.
5. The **18 frontend `aspect-video` surfaces**: fix all, or add a vertical variant
   only to the screens a drama operator actually uses?

---

## Still outstanding from the research phase

Blocking items from the strategy report, unchanged:

- Platform revenue-share percentages. No verified figure exists publicly for any app.
- SAG-AFTRA Verticals Agreement: extended past its 30 June 2026 sunset, or lapsed?
- Apple's 15% external-link proposal (13 to 14 Aug 2026): granted, modified or
  withdrawn?
- UK micro-drama revenue in pounds. Audience and rank exist; the money does not.
- Channel 4 Digital Originals commissioning terms, unread.
- Whether each target platform accepts AI-generated content, and disclosure rules.
- MIPCOM Cannes ran 12 to 15 October 2026. If it was attended, the revenue-share
  number may now be in hand.
