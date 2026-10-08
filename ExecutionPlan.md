# ExecutionPlan.md — Reclaim

The build runs from **Thu 8 Oct, when the hackathon opens, to Sun 11 Oct 2026**. The internal deadline is **Sun 18:00 IST**. The form closes at 20:00 IST.

How this plan works:
- The project is split into **phases**, and each phase is split into **cycles**.
- A cycle is a timeboxed unit of work with an explicit **exit criterion**. A cycle is done only when its exit criterion passes on a real device or the deployed stack.
- Tick the boxes in the same commit that completes the work (Rules G4).
- **Checkpoints** are fixed go/no-go moments. If one fails, apply the cut written there at once (Rules S3).

---

## Status

| | |
|---|---|
| **Current phase / cycle** | Phase 0 / C0.1 |
| **Last checkpoint** | — |
| **Cuts applied** | none |
| **Blockers** | none |

---

## Timeline at a glance (IST)

| When | Phase | Outcome |
|---|---|---|
| Thu 8 Oct, rest of day | **P0** Setup & de-risk | The three risky integrations are proven: Bedrock, Amazon Location maps, dev build. The skeleton is deployed. |
| Fri 9 Oct, morning | **P1** Backend core | The full loop works over curl, using a stub verifier |
| Fri 9 Oct, afternoon to night | **P2** App core loop | The full loop works on a phone, using a stub verifier |
| Sat 10 Oct, morning | **P3** Verification layer | Real AI verification works on real photos |
| Sat 10 Oct, afternoon | **P4** Hold & contest *(Should)* | The full lifecycle runs in DEMO_MODE |
| Sat 10 Oct, 15:00–17:30 | **P6** Field test & filming | A real cleanup is filmed through the app (daylight window) |
| Sat 10 Oct, evening | **P5** Peer review & volunteer log *(Could)* | Optional extras |
| Sun 11 Oct, 08:00–13:00 | **P7** Harden & freeze | Bug bash, docs, tag `v1.0` at 13:00 |
| Sun 11 Oct, 13:00–18:00 | **P8** Submission | Video, writeup, blog, form submitted by 18:00 |

P6 is scheduled by daylight rather than by phase order. The field shoot takes priority over P4 and P5 work on Saturday afternoon.

---

## Phase 0 — Setup and de-risking (Thu)

**Goal:** prove the three integrations most likely to block us before building anything on top of them.

### C0.1 — Accounts and compliance (≈45 min)
- [ ] Every member: WeMakeDevs registration, check in to Environmental Hacks, and **AWS Builder Center student verification** started or completed (H7).
- [ ] AWS account in `ap-south-1`. Budget alarms at $5 and $20 (C1). Add MFA on the root account.
- [x] Public GitHub repo `reclaim`, with `CLAUDE.md`, `Rules.md`, `ExecutionPlan.md`, `AI_USAGE.md`, `LICENSE` (MIT), `.gitignore` and `.env.example` as the first commit.
- [ ] Join the WeMakeDevs Discord and the Builder Center space.

**Exit:** the repo is public with its first commit dated today, and the budget alarms are active.

### C0.2 — Bedrock spike (≈1 h)
- [ ] Enable access to a Claude vision model. Record `BEDROCK_MODEL_ID` and `BEDROCK_REGION` in CLAUDE.md §12.
- [ ] Write `scripts/bedrock-spike/main.go`: send 2 local JPEGs through the Converse API with a forced `submit_verdict` tool, then print the JSON.
- [ ] Run it on one before/after pair you photograph today.

**Exit:** the script returns valid verdict JSON in under 15 s.

### C0.3 — Mobile spike (≈1.5 h)
- [ ] `npx create-expo-app app` with TypeScript and `expo-router`. Add `expo-dev-client`.
- [ ] Add `@maplibre/maplibre-react-native` with its Expo config plugin. Create an Amazon Location API key restricted to Maps, and render Vellore with the Standard style.
- [ ] `GhostCamera` prototype: a `CameraView` with a bundled sample image overlaid at 35% opacity, and a capture button.
- [ ] Get a dev build onto a physical Android phone with `npx expo run:android`.

**Exit:** the phone shows the Vellore map and the ghost-overlay camera.

### C0.4 — Infrastructure skeleton (≈1 h)
- [ ] `infra/template.yaml` containing:
  - HTTP API with a Cognito JWT authorizer
  - Cognito user pool and app client
  - DynamoDB table `reclaim` with GSI1
  - private S3 bucket
  - SQS queue and DLQ
  - `ApiFunction` on Go `provided.al2023` arm64
- [ ] `GET /health` returns `{"ok":true,"version":...}`.
- [ ] `sam deploy --guided`, and save `samconfig.toml`.

**Exit:** `curl $API/health` returns 200, and a test Cognito user can get a JWT.

### ✅ Checkpoint 0 — Thu night

| Check | If it fails |
|---|---|
| Bedrock returns a verdict | Try a different region or model, or request a quota increase. If it's still blocked by Fri 10:00, fall back to **Rekognition DetectLabels** heuristics (garbage-label counts before vs after) and say so in the writeup. |
| MapLibre + Amazon Location renders | Switch to `react-native-maps` for rendering, and use Amazon Location for **reverse geocoding** spot addresses so it stays in the architecture. |
| Dev build on the phone | Use Expo Go with `react-native-maps` for development, and do the EAS build on Saturday. |

---

## Phase 1 — Backend core (Fri morning)

**Goal:** the entire Must loop works over HTTP, with a **stub verifier that always approves**.

### C1.1 — Domain and config (≈1.5 h)
- [ ] `internal/config` with every key in CLAUDE.md §9 and `DEMO_MODE` handling.
- [ ] `internal/domain`:
  - entities: Spot, Session, Claim, Group, User;
  - the states and events;
  - `Transition()` covering the full table in CLAUDE.md §5.2;
  - effects;
  - scoring functions.
- [ ] Table-driven tests for every legal transition and a sample of illegal ones.
- [ ] `internal/geo`: haversine, geohash encoding, and bbox → geohash5 cells, all with tests.

**Exit:** `go test ./...` passes with tests covering every row of §5.2.

### C1.2 — Store and auth (≈1 h)
- [ ] `internal/store`: get and put for each entity, conditional `version` writes, membership dual-write.
- [ ] `httpapi` middleware: JWT claims → userId, request ID, the error envelope, and slog.
- [ ] Endpoints: `GET/PUT /me`, `POST /groups`, `POST /groups/join`, `GET /groups/{id}`.

**Exit:** two test users create and join a group over curl.

### C1.3 — Spots and uploads (≈1 h)
- [ ] `POST /uploads`: presigned PUT with content-type and size conditions.
- [ ] `POST /spots`: report with geofence and metadata validation. Writes Spot and history.
- [ ] `GET /spots?bbox=`, which queries GSI1 for each geohash5 cell, and `GET /spots/{id}`, which returns presigned GET URLs.

**Exit:** upload a photo, report a spot, and see it in a bbox query.

### C1.4 — Sessions and claims (≈1.5 h)
- [ ] `POST /spots/{id}/sessions`: checks the geofence, applies the CLEANING lock through a conditional write, generates a 6-character code, and schedules `SESSION_EXPIRED` (it's fine to only log the schedule until P4).
- [ ] `POST /sessions/{id}/join` (geofence-checked) and `POST /sessions/{id}/submit`, which moves the spot to VERIFYING and enqueues the claim on SQS.
- [ ] `cmd/verifier` **stub**: consume the queue, approve, apply `ClaimApproved`, and award points and hours.
- [ ] `GET /claims/{id}` and `GET /leaderboard`.
- [ ] `scripts/e2e.sh`, which runs the whole loop with curl.

**Exit:** `e2e.sh` goes report → session → join → submit → approved → HELD → the leaderboard shows +50. Tag `v0.1-loop-api`.

---

## Phase 2 — App core loop (Fri afternoon to night)

**Goal:** the same loop runs on a physical phone.

### C2.1 — App foundation (≈1 h)
- [ ] Amplify v6 Auth configured (Cognito). Sign-in and sign-up screens. The session persists across restarts.
- [ ] `lib/api.ts`: a fetch wrapper with JWT and error envelope parsing. React Query provider. `lib/types.ts` mirrors the Go types.

**Exit:** sign in on the phone and see `/me` rendered.

### C2.2 — Map home (≈1.5 h)
- [ ] The map tab, centred on the user's location. Pins are coloured by state (CLAUDE.md §5.1). Data refetches when the map moves (debounced bbox).
- [ ] A spot bottom sheet showing photo, state, owner and a primary action button that depends on the state.

**Exit:** reported spots show up as red pins, and tapping one opens the sheet.

### C2.3 — Capture and report (≈1 h)
- [ ] `lib/capture.ts`:
  - `CameraView` capture;
  - GPS read at capture time (accuracy recorded);
  - resize to a 1280 px long edge at JPEG quality 0.7;
  - presigned upload.

  It returns a `photo` object.
- [ ] The report screen: capture, an optional note, and POST.

**Exit:** reporting from the phone creates a red pin within 5 s.

### C2.4 — Cleanup session flow (≈2.5 h) ⭐ the core of the demo
- [ ] Step 1: a safety checklist screen (X2), then the **before** capture, then the session starts and the code appears large on screen.
- [ ] Step 2: other members tap "Join session", enter the code, and the GPS check runs.
- [ ] Step 3: the **after** capture using `GhostCamera`, with the before photo overlaid at 35% opacity.
- [ ] Step 4: the **disposal** capture, then submit.
- [ ] Step 5: a status screen that polls `GET /claims/{id}` every 3 s and moves through verifying → approved, rejected or review.

**Exit:** on the phone, red → blue → grey → green pin, with the stub verifier.

### C2.5 — Group and leaderboard (≈1 h)
- [ ] Group tab: create or join with an invite code, a member list, and held spots.
- [ ] Leaderboard tab: groups ranked by points.

**Exit:** two groups on two phones and a ranking that updates.

### ✅ Checkpoint 1 — Fri night

| Check | If it fails |
|---|---|
| The full loop runs on a phone, end to end | **Drop P4 and P5 entirely.** Saturday becomes: P3 → finish P2 → P6. Hold and contest appear only as a "next steps" slide. |
| The loop works but the UI is rough | Continue. Polish happens in P7. |

Tag `v0.1-loop` when the loop passes.

---

## Phase 3 — Verification layer (Sat morning)

**Goal:** replace the stub with real verification that is trustworthy and explains itself.

### C3.1 — Integrity checks (≈1 h)
- [ ] Every check in CLAUDE.md §6 step 2, with a reason code for each.
- [ ] dHash computed for each photo, compared within the geohash5 cell, and stored as `PHASH#` items.
- [ ] Tests for each reason code.

**Exit:** a deliberately bad claim (reused photo, wrong place, too fast) is rejected with the correct code.

### C3.2 — Bedrock verifier (≈1.5 h)
- [ ] `internal/verify`:
  - the prompt (with `PROMPT_VERSION`);
  - the tool schema;
  - a Converse client with timeout and retries;
  - schema validation and clamping (P7).
- [ ] Store the raw verdict on the claim.
- [ ] The single-image variant for reports and check-ins (`garbage_present`, `hazards`).

**Exit:** a real claim gets a stored verdict within 20 s.

### C3.3 — Decision and hazard path (≈1 h)
- [ ] `verify.Decide()` with the thresholds from config, plus table tests.
- [ ] HAZARD transition. A purple pin and the "do not handle" UI (X1).
- [ ] Peer-review outcome: in Must scope, PEER_REVIEW resolves through the timeout rule (≥ 0.5 → approve).
- [ ] The app status screen shows the result and the model's `reasons` text.

**Exit:** approve, reject and review outcomes all appear correctly in the app.

### C3.4 — Calibration (≈45 min)
- [ ] Collect **10–15 real photo sets** around campus: clean sets, partial cleanups, fake attempts, and different angles.
- [ ] Run them through the verifier. Record the results in `docs/calibration.md` as a table of set, verdict, decision, and whether it was correct.
- [ ] Adjust thresholds in config if needed, and write down why.

**Exit:** the calibration table is committed. It is useful evidence for the writeup and the video.

Tag `v0.5-verified`.

---

## Phase 4 — Hold and contest (Sat afternoon) · *Should*

**Goal:** the claim-and-hold mechanic that sets the project apart, demonstrable in DEMO_MODE.

### C4.1 — Scheduler (≈1.5 h)
- [ ] `internal/sched`: create and delete one-time schedules named `spot-<id>-<kind>` with `ActionAfterCompletion: DELETE`. Add the IAM role for Scheduler → Lambda.
- [ ] `cmd/scheduler`: handles `SESSION_EXPIRED`, `CHECKIN_DUE`, `UNVERIFIED_TIMEOUT` and `GRACE_EXPIRED`. Idempotent (E7).
- [ ] `cmd/points`: a recurring schedule every `HOLD_TICK` that awards points for each HELD spot.

**Exit:** in DEMO_MODE, a HELD spot turns UNVERIFIED after 10 min with no check-in.

### C4.2 — Check-ins and dirty reports (≈1.5 h)
- [ ] `POST /spots/{id}/checkins` (owner members only): single-image verify, then `CheckinApproved`.
- [ ] `POST /spots/{id}/reports`: the full anti-sabotage logic from CLAUDE.md §5.3 (weights, trust, rate limit, false-report penalty). Table tests.

**Exit:** a neutral report contests a spot, and a single rival report does not.

### C4.3 — Contest in the app (≈1 h)
- [ ] Orange pin. The owner sees a "Re-clean before it's lost" banner with a grace countdown.
- [ ] The owner re-clean reuses the C2.4 flow with the `ownerReclean` flag.
- [ ] A "Report as dirty" action on held spots for non-owners.

**Exit:** in DEMO_MODE, the full cycle HELD → CONTESTED → re-cleaned → HELD, **and** HELD → CONTESTED → lost → REPORTED, each in under 15 min.

### ✅ Checkpoint 2 — Sat 14:30

| Check | If it fails |
|---|---|
| C4.1 + C4.2 working | Ship them as they are. Skip C4.3 polish, and show the contest in the video using a second phone and the pins changing. |
| C4.1 not working | Cut P4. Explain hold and contest with a 15-second animated slide in the video. |

**Whatever the status, stop at 15:00 for P6 while there is daylight.**

---

## Phase 5 — Peer review and volunteer log (Sat evening) · *Could*

Only start this phase if Checkpoint 2 passed and the P6 footage is in hand.

### C5.1 — Peer review (≈1.5 h)
- [ ] `GET /reviews/next` (excludes the voter's own group's claims) and `POST /claims/{id}/votes`.
- [ ] 3 votes with majority wins, the timeout fallback, and trust adjustments.
- [ ] A review tab showing the before and after photos side by side, with approve and reject buttons.

**Exit:** a borderline claim is resolved by 3 votes from 3 accounts.

### C5.2 — Verified volunteer hours (≈1 h)
- [ ] `GET /groups/{id}/activity`: hours per member, from approved claims only (X3).
- [ ] A group-tab section headed "Verified volunteer hours", with a per-member list.

**Exit:** after a real approved claim, the hours shown match the session's join and submit times.

---

## Phase 6 — Field test and filming (Sat 15:00–17:30, backup Sun 07:00–09:00)

**Goal:** real-world footage, which is the strongest impact evidence we can submit.

### C6.1 — Pre-shoot (≈30 min)
- [ ] Choose a real, safe, public garbage spot with no hazardous waste. Get permission if it's on campus property.
- [ ] Prepare 3 accounts: Group A (main), Group B (rival), and a neutral resident. Set `DEMO_MODE=true` and deploy.
- [ ] Seed a realistic handful of other spots around Vellore so the map isn't empty (D1).
- [ ] Bring gloves, bags, closed shoes, and charged phones with screen recording on. Bring a second phone for filming B-roll.

### C6.2 — The shoot (≈1.5 h)
- [ ] B-roll of the spot as it is.
- [ ] Report it in the app (screen-recorded).
- [ ] Start a session: the before photo, and teammates joining with the code.
- [ ] The real cleanup (B-roll, about 20 s of usable footage).
- [ ] The after capture with the **ghost overlay visible**, then the disposal photo at a collection point.
- [ ] Verification result screen, and the pin turning green.
- [ ] If P4 is working: the neutral account reports the spot as dirty, it turns orange, and the countdown is visible.

### C6.3 — Footage check (≈20 min)
- [ ] Review all clips the same evening. Note anything missing or blurry, and reshoot it on Sunday morning if needed.

**Exit:** every scene in `docs/demo-script.md` has usable footage.

---

## Phase 7 — Hardening and freeze (Sun 08:00–13:00)

### C7.1 — Bug bash (≈2 h)
- [ ] Run the full Must loop on a phone three times from a fresh install.
- [ ] Check loading, error and empty states on every screen. Check permission-denied flows for camera and location.
- [ ] Remove or flag-hide anything half-built (S4).
- [ ] Build a shareable APK (`eas build -p android --profile preview`) and link it in the README.

### C7.2 — Documentation (≈1.5 h)
- [ ] `README.md` (D4):
  - pitch;
  - architecture diagram (`docs/architecture.png`);
  - core loop;
  - spot state diagram;
  - setup and deploy steps;
  - Credits & Licences (H5).
- [ ] Final check that `AI_USAGE.md` is complete (H6, A1).
- [ ] Polish `docs/calibration.md`.

### C7.3 — Code freeze, 13:00 (G6)
- [ ] All tests pass and `sam build` succeeds. The deployed stack matches `main`.
- [ ] Tag `v1.0`.

**Exit:** `v1.0` is tagged. From here, only demo-breaking fixes are allowed.

---

## Phase 8 — Submission (Sun 13:00–18:00)

### C8.1 — Demo video (≈2.5 h)
Follow `docs/demo-script.md`. The target is **2:55 or less**.

| Time | Scene |
|---|---|
| 0:00–0:20 | Hook: the real spot, and the problem of re-dumping and unverifiable cleanups |
| 0:20–0:40 | Report, and the map with its state colours |
| 0:40–1:40 | Clean and claim: session code, cleanup B-roll, ghost-overlay after photo, disposal photo, live verification, green pin |
| 1:40–2:10 | Hold and contest: dirty report, orange pin, grace countdown. Caption: "timers shortened for demo" (D3). |
| 2:10–2:35 | AWS architecture diagram, plus a glimpse of the console or CloudWatch logs (H4) |
| 2:35–2:55 | Impact metric, the users (NSS units / RWAs), close |

- [ ] Edit, add captions, and upload to YouTube as **unlisted**. Check that the link opens in a signed-out browser (H8).

### C8.2 — Writeup (≈45 min)
- [ ] `docs/writeup.md`, covering everything in D5. Paste it into the form.

### C8.3 — Builder Center blog (≈45 min)
- [ ] Publish `docs/blog.md` on AWS Builder Center: the problem, the stack, "what fought back", and calibration findings. Link it in the submission (D6).

### C8.4 — Submit by 18:00
- [ ] Fill in the official form with the repo, video, writeup and blog. Submit **once** as a team.
- [ ] Screenshot the confirmation. Post in the team chat.
- [ ] The 18:00–20:00 buffer is for emergencies only.

---

## Definition of Done (submission)

- [ ] The public repo has history that starts on 8 Oct (H1–H3).
- [ ] The Must loop works on a real phone against the deployed AWS stack.
- [ ] The video is under 3:00, on YouTube, and opens signed-out. It shows AWS (H4, H8).
- [ ] The writeup includes the AI tools used (H6).
- [ ] The README has credits and licences (H5).
- [ ] The blog is published on Builder Center.
- [ ] Every member's Builder Center student verification is complete (H7).
- [ ] The form is submitted before 18:00 IST.

---

## Parallel lanes (if the team has 2–4 people)

| Lane | Owns | Phases |
|---|---|---|
| **A — Backend and infra (Go)** | SAM, the API Lambda, domain, store, scheduler | P0 C0.4, P1, P4 C4.1–4.2 |
| **B — App** | Expo, maps, capture, every screen | P0 C0.3, P2, P4 C4.3, P5 UI |
| **C — Verification and story** | Bedrock spike, verifier, calibration, filming, video, writeup, blog | P0 C0.2, P3, P6, P8 |
| Everyone | Bug bash, freeze | P7 |

The contract between lanes is the API in CLAUDE.md §8 and `app/lib/types.ts`. Lane B can work against `e2e.sh` responses, or a small mock in `lib/api.ts`, until P1 is deployed.

For a **solo** builder, follow the phases in order and treat every *Should* and *Could* item as cut unless its checkpoint passes with time left over.
