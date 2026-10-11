# Video brief: the micro-drama workflow

Written 11 Oct 2026, for an on-camera piece in the style of the AI Workflows
content on the Channel Changers site.

**One caveat up front.** The site is not reachable from the build container and
is not indexed by the search available to it, so the house format for those
pieces could not be inspected. What follows is the substance in the order it
wants to be told, with the on-screen actions marked, so it can be poured into
whatever the established structure is. If that structure is fixed (cold open,
problem, walkthrough, result), the beats below map onto it cleanly.

---

## 1. The honest position, before anything is said on camera

This matters more than the script, because the fastest way to lose an audience
of people who build things is to demo something that does not exist.

**What is true today:**

- The suite takes a script and produces a board of generated images. That half
  is live, in production, and has been for months.
- A 9:16 session now generates 9:16 throughout, including the character
  reference images that anchor every shot. That landed on 11 Oct 2026.
- A parallel drama prompt corpus is merged, with a test that proves adding it
  changed the existing output by zero bytes.
- Video generation exists with three providers behind flags.
- A secret-authenticated ingest endpoint accepts a finished shot list and builds
  an episode from it, one episode per board.

**What is not true today:**

- You cannot type a brief in and get episodes out. The brief-to-script half is
  specified and not built.
- The drama prompts are merged but not yet routed, so a drama session still
  renders through the documentary register.
- No micro-drama episode has been produced end to end. Not one.

**So the video is about a workflow being built, and the thinking behind it.** It
is not a product demo. Said that way it is stronger content, because the
interesting material is the decisions, and nobody else is publishing those.

If the house format requires a finished artefact on screen, this video should
wait until the ten-episode proof season exists. If the format tolerates "here is
how we are building it and here is what we got wrong", shoot it now.

---

## 2. The spine

### Beat 1. The format, in thirty seconds

Vertical micro-drama: 60 to 100 episodes, roughly 90 seconds each, paid
mid-cliffhanger. Chinese-origin, now a global business.

The one number that lands: **ReelShort turns about $1.05bn of revenue into about
$63m of EBITDA.** Roughly six per cent. Because marketing runs at five to nine
times production cost.

*On screen:* a vertical phone frame, a paywall card mid-scene.

*Why open here:* it reframes the whole thing. The audience assumes this is a
content business. It is a user-acquisition business wearing content as a costume.
Everything downstream in the video follows from that.

### Beat 2. The decision that is actually interesting

Downloads grew 140% year on year. Revenue grew 20%. Revenue per install is
falling. And 80 to 90 per cent of individual titles never recoup.

So the obvious build order is wrong.

The obvious order is: build the pipeline, then make the shows. A pipeline is a
throughput asset, and throughput is worth having only once something sells.
Nothing sells yet.

**What gates the first pound is a finished sample.** The submission package for
the largest platforms is a synopsis, a twenty-episode breakdown, and three to
five completed episodes at final production quality. Platforms do not read decks.

So the order is inverted: make the smallest set of engineering changes that lets
one real episode come out of the existing system, make ten episodes, and let what
those ten teach decide what the pipeline should be.

*On screen:* the two orderings side by side, the second one circled.

*Why this is the strongest beat:* it is a real decision with a real cost, argued
from numbers, and it contradicts what the audience expects an AI-tooling video to
say. Most of this genre is "look how fast we can generate". This is "we
deliberately did not build the fast thing yet".

### Beat 3. The workflow as it is designed

Four stages, with one human gate.

```
  BRIEF -> research -> series bible -> episode grid -> episode scripts
                                   |
                           HUMAN REVIEW AND AMEND
                                   |
                           shot list per episode
                                   |
                    one POST per episode into the suite
                                   |
          parse -> references -> preflight -> generate -> board
```

Two points worth making out loud:

- **The human gate sits at scripts, not at shots.** One brief can fan out into
  eighty deliveries. If the gate were any later, nobody would read anything.
- **The authoring half is a separate service, not part of the suite.** The suite
  is deliberately script-in, image-out. The ingest endpoint's own documentation
  already said the upstream half belonged elsewhere. That boundary was drawn
  before any of this work started, and the correct move was to respect it rather
  than grow the suite into something shapeless.

*On screen:* the diagram, built up one stage at a time.

### Beat 4. The test that proves nothing happened

This is the beat for the engineering audience, and it is the one worth labouring.

The same codebase serves more than one slate. Adding a drama prompt register
risks silently changing how the existing work renders. A reviewer cannot eyeball
that: the prompts are thousands of words and the changes would be subtle.

So before the drama prompts went in, every existing prompt was rendered against
fixed inputs and the exact bytes committed. Thirty-three files, one SHA-256
manifest.

**There is no update flag.** Most golden-file suites ship with an environment
variable that regenerates the expected output. That variable is how a golden
suite dies: the first time it fails, somebody runs it, the diff disappears, and
the test has been quietly converted into a test of nothing. If this one goes red,
a human has to look at the drift report and decide.

And then the part that actually makes it evidence: **the suite was seeded red on
purpose.** One line appended to one prompt file. It failed at byte 3,139 with a
full drift report, exit code 1. Then reverted, green again.

A green check that has never been seen red is not evidence. It is a check that
has never been tested.

*On screen:* the terminal, red then green. The byte offset is the detail that
sells it.

### Beat 5. The one-line fix that was not one line

Every image the suite generates passes through a single function. Inside it, one
expression decided the frame:

```ts
const aspectRatio = input.aspectRatio ?? '16:9'
```

Meanwhile the session carried a `default_aspect` field. It was in the type. It
was writeable from the settings panel. **It was read by nothing.** A vertical
session could be configured, saved, confirmed on screen, and every image still
came out landscape.

Five of the callers pass no aspect at all, so fixing the one expression fixes all
five without touching them.

Three things make it more than a one-liner:

1. The column is free text. An unrecognised value, a missing row, or a failed
   query all have to degrade to landscape rather than fail the generation. A
   generation that dies because somebody typed nonsense into a settings field is
   a worse bug than the one being fixed.
2. The lookup has to be lazy, so a caller that already specified an aspect pays
   no database round trip.
3. The character reference images were separately pinned landscape at four sites.
   That pin mattered more than it looks: a locked character's reference image is
   the anchor every later shot is generated from, so a landscape reference
   propagates into vertical work. That was the defect that would have made the
   whole proof look wrong rather than merely imperfect.

And one piece of copy in the interface said "Fixed at 1K and 16:9", which stopped
being true the moment this shipped. Fixing the code and leaving the label is how
a product starts lying to its own users.

*On screen:* the expression, then the settings field with an arrow to nothing,
then the test output.

*Why this beat works:* it is the most relatable thing in the video. Everyone who
has shipped software has found a setting that was wired to nothing.

### Beat 6. What is deliberately not built

Close on the gap, not on a flourish.

There is a function in the codebase that looks exactly like the right place to
route the new drama prompts. It takes a type argument, it loads a system prompt,
the change is three lines.

**It has no callers.** Routing it would have produced a clean diff, a green
build, and no behaviour change whatsoever. The real call sites are in two
different files.

That is the texture of this kind of work and it is worth saying plainly: the
hard part is almost never writing the change. It is working out which of the
four plausible places is the one that actually runs.

*Closing line, roughly:* the pipeline is not the asset. Ten finished episodes
are the asset. The pipeline is what you build once you know what the ten
episodes cost you.

---

## 3. Numbers, and which ones are safe to say

The strategy report labels every claim by provenance. For camera:

**Safe, these are disclosed or widely reported:**

- ReelShort around $1.05bn revenue, around $63m EBITDA.
- Marketing spend at five to nine times production cost.
- Downloads up around 140% year on year, revenue up around 20%.
- 80 to 90 per cent of titles do not recoup.
- Submission package: synopsis, twenty-episode breakdown, three to five
  completed episodes.

**Say with a hedge, these are modelled or inferred:**

- A 90-second episode is roughly 12 to 18 generated shots, because the video
  models cap at three to ten seconds a clip. An eighty-episode series is
  therefore in the order of 1,000 to 1,500 generations before re-rolls. Say
  "on our modelling", because it is ours.
- Any cost per episode. The retry assumptions behind it come from documentary
  stills and have never been tested on drama. This is exactly what the ten
  episodes are for.

**Do not say on camera:**

- Any platform revenue-share percentage. No verified public figure exists for
  any app. Several numbers circulate and none are sourced.
- Any UK micro-drama revenue figure in pounds. Audience and ranking data exist;
  the money does not.
- Any named client, broadcaster or partner.

---

## 4. Shot list for the screen recording

Capture these before the shoot. They are the whole B-roll.

1. The golden suite going red, then green. Keep the byte offset legible.
2. The `?? '16:9'` expression, then the settings field it ignored.
3. The new test run, all nine assertions.
4. The five gates passing in sequence.
5. A vertical session in the interface. If a real 9:16 generation exists by
   shoot day, that is the money shot and everything else is support.

Item 5 is the gating question for scheduling. Without it the video is architecture
and discipline, which is real content but a different video. With it, lead on the
frame and let the engineering be the second half.

---

## 5. What would make this a much better video

One episode. Ninety seconds, vertical, cliffhanger, generated through the
workflow described above. Shown at the top and again at the end.

That is the proof season's first deliverable and it is blocked on three answers
rather than on code: the series registry row for the drama slate, whether the
shot list gets its own human gate, and the budget cap collision. All three are in
`HANDOFF.md` section 6.

Nothing about the shoot needs to wait for the authoring service.
