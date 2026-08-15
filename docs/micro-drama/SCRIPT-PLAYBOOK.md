# The Micro-Drama Script Playbook

**A writers' room manual and AI-tooling specification**

Version 1.0 — 15 August 2026
Companion to [STRATEGY-REPORT.md](./STRATEGY-REPORT.md)

---

## How to use this

Two audiences, one document.

**Writers** should read §1–§9 as craft rules. They are drawn from Chinese-language industry sources (Zhihu, Douban, thepaper.cn, chinawriter.com.cn, lmtw.com), English trade craft writing (Real Reel, Filmustage, John August), and the structure of titles that have actually performed.

**Engineers** should read §10, which specifies how these rules encode into the Gen Suite's Series Architect module.

**Provenance labels:** `[S]` = sourced, with the source named. `[INF]` = our inference from sourced material — useful, but not evidence. The distinction is maintained deliberately; do not let it erode when this is copied into a brief.

---

## 1. The specification

| Parameter | Value | Status |
|---|---|---|
| Episodes per season | 60–100 (ReelShort commonly 80–90) | `[S: filmustage, crewstudio, unstar]` |
| Episode runtime | 60–180s; modal ~90s; Chinese standard "1 min × 100 eps" | `[S: filmustage; zhihu]` |
| Total runtime | ~90–150 min — a feature, sliced | `[INF]` |
| Script length | **400–600 words per episode** | `[S: flicknexs]` |
| Shoot schedule | Full season in 8–10 days | `[S: crewstudio]` |
| Central characters | **2–3 maximum** | `[S: real-reel]` |
| Free episodes | 5–15, varies by title, territory and A/B test | `[S: multiple, inconsistent]` |
| Coin cost per episode | 50–200 coins (~$0.10–0.20) | `[S: flicknexs]` |
| Full-series unlock | $20–50 | `[S: streaming-radar]` |

**The governing principle: the unit of storytelling is the tap, not the episode.**

Traditional television asks "what happens in act two?" Micro-drama asks **"what unresolved consequence makes someone tap next?"** `[S: real-reel; pexo]` Every other rule in this document descends from that question.

---

## 2. Series architecture — the unlock blocks

Map macro turns first — inciting reveal, false win at ~1/3, betrayal at midpoint, lowest point, payoff — then slice the space between turns into episode-sized beats, each ending on a question or reversal `[S: real-reel; filmustage]`.

| Block | Episodes | Function |
|---|---|---|
| **A — Free block** | 1–6 (sometimes to 8–15) | Premise, humiliation, the *promise* of reversal. Paywall lands mid-cliffhanger |
| **B — First paid arc** | 7–20 | First partial vindication. Publish and test this arc before committing to the rest `[S: pexo]` |
| **C — Escalation** | 20–45 | Antagonist upgrade; false win then betrayal |
| **D — The reveal** | 45–75 | Identity reveal proper; the largest 打脸 (face-slap) sequence |
| **E — Payoff** | 75–100 | Consequences, secondary antagonist, wedding/coronation |

*(Block naming and episode ranges are `[INF]`; the underlying structure is `[S]`.)*

**The Chinese outline convention that Western producers miss:** the 分集大纲 (episode breakdown) **must mark the paywall points explicitly** — 一卡 (first wall) and 二卡 (second wall) — annotated by episode range `[S: zhihu; douban]`.

> **The paywall is a script decision made at outline, not a commercial decision made after delivery.** This single convention should be built into the tool as a required field.

---

## 3. The hook: 黄金3秒

The viewer's stopping threshold is near zero. If you do not hold them in three seconds, nothing later matters `[S: zhihu; yizhuan5]`.

### The three-hook taxonomy

Pick **one**. Do not blend them `[S: zhihu]`.

| Type | Chinese | Execution |
|---|---|---|
| **Direct conflict** | 直接冲突型 | Public face-slap, betrayal, confrontation, screaming row |
| **Hard suspense** | 强悬念型 | Gun to the head, a dropped DNA result, an unknown caller |
| **Extreme contrast** | 极致反差型 | Adored one second, in the gutter the next |

### Micro-timing

| Mark | Requirement |
|---|---|
| 0:03 | Hook landed |
| 0:06 | In conflict |
| 0:10 | Suspense question explicitly stated |
| 0:15 | The "explosion point" — spend the season's most cinematic beat here |

`[S: zhihu; flicknexs]`

**Padding the first 15 seconds burns 25% of the episode before anything happens** `[S: real-reel]`.

### Hard rules writers are given

`[S: filmustage; real-reel; inktip; cinelyai]`

- **No slow builds. No establishing shots.** Establish location through detail in close — a doorway, a desk, a street sign.
- **Conflict on line one** — and the conflict must be *structural*, built into the premise, not manufactured scene by scene. "The premise has to do the lifting before the first line of dialogue."
- **Open mid-crisis.** No exposition.
- **One conflict, one location, one hook per episode.**
- **Something changes every episode.** No table-setting scenes.
- **End mid-tension, never on resolution.**

### Episode 1 job list

`[INF, consistent with the above]`

1. State the injustice.
2. Name the concealed advantage — without proving it.
3. Show the antagonist enjoying power.

**Withhold the protagonist's true status. That withholding *is* the season.**

---

## 4. Beat rhythm and cliffhangers

### Inside a 90-second episode

The per-episode spine `[S: pexo]`:

**Status setup** (who has power) → **Disruption** (secret, insult, danger, debt, opportunity) → **Reaction** (an emotionally legible choice) → **Unresolved consequence** (cut *before* the answer lands).

High-retention micro-dramas deliver **a core emotional beat every 15–20 seconds** `[S: vitrina]` — implying **4–6 emotional beats and 2–3 genuine turns per 90-second episode** `[INF]`.

The macro-pattern behind almost every vertical hit is three beats — **Shock → Hurt → Release** — where **Shock is unarguable *evidence*, not feeling**: a text thread, a bank transfer, a wedding invitation with two names `[S: medium/real-reel]`.

### The professional method

**Decide the final three seconds first. Write backwards to them.** `[S: filmustage; real-reel]`

### Cliffhanger catalogue

| # | Type | Mechanism | Best placement |
|---|---|---|---|
| 1 | **Bombshell** | Drop the revelation, cut before anyone reacts. Power is in the withheld aftermath | Anywhere; strongest at the wall `[S]` |
| 2 | **Question hook** | End on a specific unanswerable question. One open question beats several | Early blocks `[S]` |
| 3 | **Revealed secret** | The person who must never know, knows | Mid-season `[S]` |
| 4 | **Reversal (反转)** | Power flips inside the last line | Everywhere `[S: lmtw]` |
| 5 | **New arrival** | A new character walks in on the tableau | Block transitions `[S: zhihu]` |
| 6 | **Interruption (掐断)** | Sever the scene at maximum tension | The wall `[S: xhby; zhihu]` |
| 7 | **Threat** | Gun, blade, ambulance, contract deadline | Action/mafia `[S: zhihu]` |
| 8 | **Misunderstanding lock-in** | A wrong conclusion hardens into action | Romance `[INF]` |
| 9 | **Line-cut** | A single conflict line as the button. Cheap, universal | Anywhere `[S: zhihu]` |
| 10 | **Identity threshold** | The protagonist is *about* to be recognised | Pre-reveal `[INF]` |
| 11 | **Countdown** | An explicit clock — "48 hours" | Arc spine `[INF]` |
| 12 | **Intimacy escalation (暧昧升级)** | A romantic line is crossed | Named wall type in Chinese outlines `[S: zhihu]` |

**Two rules:** answer one question before opening another `[S: dramapilot]`; and alternate types — three consecutive Bombshells read as noise `[INF]`.

---

## 5. The paywall episode

**Where it lands.** ReelShort commonly free to episode 5–6, some titles to 8; other apps 8–15. *The Double Life of My Billionaire Husband* gave episodes 1–8 free, then charged 50–70 coins each `[S: reelpulse; unstar; filmustage]`. Treat as a range, not a constant — it almost certainly varies by title and A/B test.

**How it is engineered.** The wall is chosen **at outline stage**, at the point where audience emotion peaks. Cut there and most viewers pay. The three canonical wall situations `[S: zhihu; xhby]`:

1. Protagonist in crisis
2. A plot reversal
3. An intimacy escalation

**The purchase decision happens in the final few seconds of the episode.** Hook design at the episode button *is* the commercial lifeline of the show `[S: zhihu]`.

### Wall-episode construction checklist

`[INF, built on the sourced rules above]`

1. **Debt maximised** — the humiliation stack is at its worst, and *publicly witnessed*.
2. **Vindication visibly one beat away** — the phone is dialling, the door is opening, the file is in hand.
3. **The reveal is promised and proven imminent — never delivered.**
4. **Cut on the antagonist's face** at the instant confidence cracks. Not the protagonist's.
5. **Open no new question at the wall.** The viewer must pay to close an *existing* one.
6. **Never resolve emotional debt in the last free episode.** Free-block episodes may pay small satisfaction beats. The wall pays none.

---

## 6. Emotional design: 情绪价值 and 爽点

**The governing insight: micro-drama runs on emotional suspense, not plot suspense** `[S: thepaper.cn; chinawriter.com.cn]`.

The central engine is the protagonist moving from 被侮辱、被损害 (*humiliated and damaged*) to 逆袭 (*reversal into power*). Audiences want the **complete emotional circuit from insult to revenge** — not the plot mechanics `[S: thepaper.cn]`.

| Concept | Meaning | Craft implication |
|---|---|---|
| **爽点** (*shuǎng*) | The satisfaction discharge — identity revealed, villain face-slapped | Hold key 爽点 shots **slightly slower, 3–5 seconds**, to enlarge the emotion `[S: csdn]` |
| **打脸** (*face-slap*) | Public humiliation of the antagonist | Functions as "emotional necessity" — lets viewers metabolise real-world pressure through reversal `[S: 163.com; qq.com]` |
| **情绪价值** (*emotional value*) | The overall emotional return on attention | The thing actually being sold |
| **逆袭** (*counter-attack*) | The reversal itself | The season's spine |

**Identification mechanism:** viewers project onto the protagonist and feel they have *become* them. The pleasure is daydreaming — the identity transformation from ordinary to powerful `[S: 163.com; qq.com]`.

**Ending discipline:** the final act only has to *pay out the emotional value already promised*. The target audience response is **值了** — "that was worth it" `[S: csdn]`.

**The variable-reward layer:** cliffhangers trigger dopamine release; autoplay delivers the next one. The uncertainty structure works like a slot machine `[S: youngpostclub; real-reel]`.

### The ledger rule

`[INF]` **Every humiliation is a debt entered in a ledger. Every 爽点 is a repayment.**

- Repay **small and often** in the free block.
- Repay **never** at the wall.
- Repay **with compound interest** in Blocks C–D.

Under-repay and viewers churn. Over-repay early and the wall has no leverage.

### Complication engines

`[S: lmtw]` Triangular relationships · false identity · abrupt emotional reversal (情绪突变) · forced extreme choices.

The named Chinese craft triad — **卡点 / 冲突点 / 反转点** (cut-point / conflict-point / reversal-point) — is the equivalent of a beat sheet. The two hard problems are (a) packing dense conflict into no time and (b) keeping that conflict internally logical and in character `[S: lmtw; gmw.cn]`.

---

## 7. Format and shooting conventions

### The page

- Scene-by-scene short-form format, **400–600 words per episode**, one episode per document or section, with cut-point annotations in the outline `[S: flicknexs; zhihu]`.
- **Inverted priorities versus screenplay:** location description minimal; **reaction beats scripted explicitly**; micro-expressions written on the page, because the frame is a face most of the time `[S: filmustage; medium/real-reel]`.

### The frame

- **Two-shots fail.** Side-by-side bodies fight for the narrow horizontal axis. Block for **depth** — one figure foreground, one at distance — and cover in alternating single close-ups. Use a shoulder at the foreground edge to imply the two-hander `[S: axisaistudios; premiumbeat; danmears]`.
- **Close-ups and eye-level dominate.** Hands, eyes and objects carry more than dialogue `[S: filmustage]`.
- **No wides, no establishing geography.** Dead in 9:16 `[S: filmustage]`.

### Dialogue

- Every line either **advances conflict** or **reveals character under pressure**. No small talk, no setup lines, no conversational exposition `[S: real-reel]`.
- `[INF]` Target **≤12 words per line, ≤3 exchanges before a turn**.
- **Voiceover is a last resort.** On-screen dialogue survives sound-off viewing via subtitles; VO without subtitle simply does not reach part of the audience. When VO earns its place, the pattern is a composed spoken line ("I'm fine") immediately followed by the private truth underneath `[S: real-reel]`.
- `[INF]` Assume sound-off viewing. Burned-in captions. Reveal documents — texts, DNA results, transfers — written as **full-frame inserts**, since the sourced "Shock = unarguable evidence" beat is usually an insert.

---

## 8. Genre and trope taxonomy

Global watch-time leader: romance/CEO. **US-specific leader: werewolf/fantasy. Highest completion rates: revenge**, because every episode delivers a payoff `[S: opendrama.ai]`.

Every major app competes on the same four families — folk-tale architecture (Cinderella, Monte Cristo, the returning king) retooled for a coin economy `[S: intelligenthq]`.

| Trope | Core fantasy | Audience | Reliable beats | Supply 2026 |
|---|---|---|---|---|
| Billionaire/CEO romance | Being chosen by absolute power | W 25–54, global | Forced proximity → contract → jealousy → public claiming | **Over** `[S]` |
| Secret heir / hidden identity | Concealed superiority | Mixed | Disguise → contempt → threshold → reveal → mass apology | **Over** `[S]`; still highest-yield engine `[INF]` |
| Revenge / comeuppance | Justice with interest | Broad | Betrayal → fall → rebuild → serial face-slaps → ruin | Over-supplied, **best completion** `[S]` |
| Werewolf / alpha-Luna | Being *fated*, not merely chosen | US female, younger | Rejected mate → hidden bloodline → prophesied Luna → reclaim | **Saturated in US** `[S]` |
| Vampire | Danger + eternal devotion | As above | Bloodlust restraint → clan politics → turning choice | Over `[S]` |
| **Mafia romance** | Protection by a dangerous man | UK/US female | Debt → forced marriage → rival family → he kills for her | **Proven in UK production** `[S: onsetoctopus]` |
| Contract marriage | Intimacy on your own terms | Global female | Signing → rules broken → real feeling → contract exposed | Over `[S]` |
| Secret baby | Being irreplaceable | Female 30+ | One night → hidden child → discovery → custody war | Over `[S]` |
| Time travel / rebirth / regression | A second run with foreknowledge | Travels well | Death → rewind → pre-empt betrayal → invert fate | `[INF]` |
| Revenge on in-laws | Domestic dignity restored | Female 35+ | Servitude → false accusation → status reveal at family dinner | `[INF]` |
| Secret genius | Competence recognised | Mixed | Menial role → crisis only they can solve → reveal | `[INF]` |
| Cheating-husband revenge | Refusal made glamorous | Female 30–60 | Discovery → cold divorce → glow-up → he begs | `[INF]` |
| Second-chance romance | Repair without humiliation | Female 35+ | Reunion → old wound → renegotiated terms | `[INF]` — likely **under-supplied** |
| Medical / military | Competence + rank hierarchy | Skews older | Emergency → insubordination → vindication | `[INF]` |
| **Comedy / slice-of-life** | Relief from melodrama | All ages | — | **Under-supplied; easily age-adapted** `[S: kidscreen]` |
| **Psychological horror** | Dread, ambiguity | Gen Z, male-skewing | Slow-burn supernatural, ambiguous threat | **Rising ~2× faster than romance** `[S: filmustage — directional]` |
| Deep-lore fantasy | World immersion | — | — | **Avoid — cannot build stakes in 45s** `[S: kidscreen]` |

---

## 9. The British question

**What is sourced:** UK vertical production capacity is real and expanding. **Onset Octopus** produced *Mafia Lover* and *The Mafia Obsession* for DramaBox, and ***Pride and Prejudice* for ReelShort** `[S: onsetoctopus]`. Also active: Crew Studio (London), Sea Star Productions (London/Istanbul), Moonshine Vertical (London), TattleTV (UK's first vertical app).

**What is sourced about localisation generally:** platforms localise **plots, not just dubs** — modifying characters, settings and themes for local audiences and regulators `[S: duanju.news; help.com]`. **Direct Chinese imports underperform in the US**; the market has shifted to originals `[S: zenodo preprint]`. What gets toned down for Western audiences: exaggerated familial conflict and supernatural excess `[S: help.com]`.

**What is inference — flagged clearly, because it is the most strategically interesting idea in this document and it is not yet evidenced:**

> `[INF]` **The British lever is heritage and class, not corporate wealth.**
>
> The *Pride and Prejudice* commission to a UK producer points at it. The UK equivalent of the alpha-CEO is **the aristocrat and the estate**; the humiliation engine runs on **class contempt and inheritance** rather than boardroom power. "Billionaire" translates poorly as a *word* and well as a *situation*. British viewers accept status humiliation but resist the American register of explicit wealth worship.
>
> **No source tests this.** It is the highest-value creative hypothesis available to a UK producer and it should be validated with a cheap 10-episode proof before a slate is committed to it.

A second inference worth testing alongside it: **psychological horror in a British register** — folk horror, coastal towns, institutional dread — is under-supplied globally, suits portrait framing, and is somewhere Britain has genuine cultural authority.

---

## 10. Worked examples

| Title | Structure | Why it worked |
|---|---|---|
| **The Double Life of My Billionaire Husband** (ReelShort, 49 eps) | Sebastian Klein, the family's illegitimate "broke jailbird slacker," is secretly a billionaire — the disguise is deliberate cover | Stacks three engines: contract marriage + mistaken identity + underdog vengeance. 500m+ social views; drove ReelShort to #1 on the US App Store entertainment chart above TikTok and Netflix. Eps 1–8 free, then 50–70 coins `[S: reelpulse; reelshort]` |
| **Never Divorce a Secret Billionaire Heiress** (ReelShort) | Joyce Powell, three years a "walking blood bank" for her husband, divorces him — she is secretly a billionaire heiress | **Textbook free-block escalation.** Ep1: pregnancy news collides with a demand she donate blood to a faking sister. Ep2: she has miscarried and he demands *more* blood. Ep3: she demands divorce. Eps 4–5: divorce papers plus a slap from his mother. Humiliation debt is maximised before the wall; her advantage is *named but unproven* `[S: reelshort; ettron]` |
| **Mafia Lover / The Mafia Obsession** (DramaBox, UK-produced) | Mafia romance | Global hits made by a UK production company — proof UK crews can service this lane for a Chinese-owned platform `[S: onsetoctopus]` |
| **Pride and Prejudice** (ReelShort, UK-produced) | Public-domain heritage romance, vertical | The IP-adaptation route, and a British register on a US-facing platform `[S: onsetoctopus]` |

---

## 11. Pitfalls

`[S: real-reel; flicknexs; filmustage; lmtw; kidscreen; johnaugust]`

1. **Compressing a TV or film script.** Pacing logic, information release and emotional logic all belong to long form. Shortening does not convert it.
2. **Manufacturing conflict scene by scene** instead of building it into the premise.
3. **Atmospheric openings.** Fifteen wasted seconds is 25% of the episode.
4. **Too many characters.** More than 2–3 central figures and viewers cannot track who is who.
5. **Table-setting episodes** with no change.
6. **Ending on resolution** rather than tension.
7. **Wide shots and establishing geography.** Dead in 9:16.
8. **VO-dependent storytelling** that dies with the sound off.
9. **Conflict without internal logic.** Density is not licence for characters acting out of character.
10. **Paying out emotional debt too early**, leaving the wall without leverage `[INF]`.
11. **Deep-lore worldbuilding.** Stakes cannot be established in 45 seconds.
12. **Assuming craft prestige transfers.** Verticals are reverse-engineered around data-driven formulas. John August describes the tonal and structural adjustment as the hard part, at ~$1,540/week staff pay.

---

## 12. Tooling specification — Series Architect

How the above encodes into the Gen Suite. This is the build brief.

### 12.1 New phase pipeline

The existing Script Engine runs a five-phase pipeline built for three-act feature and series work. Micro-drama needs a parallel pipeline, not a modified one:

| Phase | Name | Output |
|---|---|---|
| **V1** | **Premise & Trope Lock** | Genre selection from the §8 taxonomy (with supply-state warnings), core fantasy, the injustice, the concealed advantage |
| **V2** | **Cast & World** | 2–3 central characters max (hard limit, enforced). Dialogue DNA per character. 3–5 fixed locations, written *to* what can actually be shot or generated |
| **V3** | **Season Grid** | 60–100 episode grid. Macro turns placed first, then sliced. **一卡 / 二卡 paywall positions are required fields** |
| **V4** | **Episode Engine** | Per-episode: hook type (one of three), 4–6 beat spine, cliffhanger type (from the 12-type catalogue), final-three-seconds written *first* |
| **V5** | **Vertical Shot Pack** | 9:16 shot list. Depth-blocking, no two-shots, no wides. Insert cards for evidence beats. Reference-set IDs per character |

### 12.2 Hard constraints to enforce in the tool

Not suggestions — validation rules:

- Episode script length **400–600 words**. Warn outside.
- **Maximum 3 named speaking characters** per season core cast.
- Every episode must terminate in a **cliffhanger type**, selected explicitly. No episode may end on resolution.
- **No consecutive repetition of the same cliffhanger type** more than twice.
- Every episode must record a **beat count of 4–6**.
- The **wall episode** must be flagged and must satisfy the §5 checklist.
- Emotional **ledger tracking**: running balance of humiliation debt versus 爽点 repayment across the season, surfaced as a chart. This is the single most useful novel feature in the tool — nothing else on the market does it.
- **No establishing shots** in the shot pack. Reject wides.

### 12.3 Reuse from the existing codebase

| Existing | Change needed |
|---|---|
| `SYSTEM_INSTRUCTION` (5-phase) | Fork to `MICRODRAMA_SYSTEM_INSTRUCTION` with the V1–V5 pipeline. Do not modify the original |
| `json:update` structured extraction | Extend schema: `episodeGrid`, `paywallEpisodes`, `cliffhangerType`, `beatCount`, `ledgerBalance` |
| `CharacterProfile.dialogueDNA` | Reuse as-is. Already correct for this format |
| `shared_assets` (Supabase) | **Move from single hero image to a 5–7 image reference set per character** (neutral pose, even lighting, clean background, multiple angles). Directly addresses the character-consistency problem — see STRATEGY-REPORT §8.3 |
| `StoryboardView` | Currently hardcodes `16:9` in the storyboard prompt. Needs 9:16 plus the §7 framing rules |
| `CCScriptExport` → Director | Add per-episode granularity; currently exports a whole script |
| `BeatBoard` | Repurpose as the season grid view |
| Model calls | **Insert an abstraction layer.** The Sora API shutdown on 24 Sep 2026 is the argument — see STRATEGY-REPORT §8.1 |

### 12.4 Instrumentation

Track from the first episode produced, because it is the dominant cost variable:

- **Keeper rate** — accepted shots ÷ generated shots, per episode and per model.
- Cost per finished minute, per title.
- Time from greenlight to delivery.
- Which cliffhanger types correlate with completion, once platform data is available.

---

## 13. Routes to market for a script

`[S: reelytics; character.app; stage32; filmfreeway]`

**ReelShort has no self-serve upload.** Entry is by contract screenwriting, contests, or producer-to-producer pitching with finished sample episodes.

**Expected submission package** (`[UNCLEAR]` — vendor-sourced; verify with the platform directly before building to it):

1. Series synopsis, 500–1,000 words
2. Episode breakdown for at least the first 20 episodes
3. **3–5 sample episodes at final production quality** — finished video, not a script
4. Character descriptions with casting photographs
5. Studio profile

Turnaround 2–4 weeks, up to 6 at peak.

**Contests:** Stage 32 × DramaBox — $5,000 contract plus a vertical development incubator.

---

## 14. Sources

**Chinese-language craft** — the highest-value differentiated material here, and the part most Western producers working from English trade blogs will not have:
zhuanlan.zhihu.com/p/2000551987486418463 (hook taxonomy, 黄金3秒) · zhuanlan.zhihu.com/p/1941534366003079041 (episode outline, 一卡/二卡, cliffhanger types) · douban.com/group/topic/295213472 · thepaper.cn/newsDetail_forward_29971323 (emotional suspense) · chinawriter.com.cn (2026) · lmtw.com (卡点/冲突点/反转点) · news.gmw.cn · damodev.csdn.net (爽点 shot duration) · xhby.net (掐断) · m.163.com, news.qq.com (打脸 psychology) · yizhuan5.com

**English craft:** real-reel.com (script guide, dialogue guide, why good scripts fail, addiction psychology) · medium.com/real-reel · filmustage.com · blog.flicknexs.com · pexo.ai · dramapilot.com · novela.so · cinelyai.com · johnaugust.com, *Writing for Microdramas*

**Frame and shooting:** axisaistudios.com · premiumbeat.com · danmears.tv · character.app

**Genre and market:** opendrama.ai · intelligenthq.com · kidscreen.com · vitrina.ai · sukudostudios.com · dramaexpress.net

**Titles and UK:** reelpulse.net · reelshort.com · ettron.com · onsetoctopus.co.uk · crewstudio.co.uk · seastarfilm.com · moonshinefilm.com

**Localisation:** duanju.news · help.com · zenodo.org/records/16798457 (academic preprint — surfaced but unread; likely the highest-value remaining source)

**Submission:** reelytics.io · stage32.com · filmfreeway.com

---

## 15. What this playbook does not yet know

1. **No primary platform document was obtained.** Everything about ReelShort/DramaBox requirements is second-hand from trade blogs. No official writer bible was located.
2. **The paywall episode number is inconsistent across sources** (5–6 vs 8 vs 8–15). Likely varies by title, territory and A/B test.
3. **No sourced figure for turns-per-episode.** The 4–6 beats / 2–3 turns figure is inference from the "emotional beat every 15–20s" datapoint.
4. **Text-on-screen and subtitle conventions are unsourced.**
5. **British-specific craft is almost entirely inference.** The only hard UK evidence is production capacity and four title credits. No UK audience data, no UK-set original performance figures. §9 is a hypothesis to test, not a finding to build on.
6. **Six trope rows are inference** — time travel/rebirth, in-laws revenge, secret genius, cheating-husband revenge, second-chance, medical/military.
7. **Chinese sources are industry blogs**, not platform documentation — though they are internally consistent and consistent with English trade sources.
