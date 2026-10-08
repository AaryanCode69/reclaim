# Rules.md — Reclaim

These rules are non-negotiable for everyone on the team, human or AI. When a rule conflicts with a task, the rule wins. Raise the conflict instead of working around it.

The rules are grouped by prefix so they're easy to cite in reviews, for example "violates S2":

| Prefix | Topic |
|---|---|
| H | Hackathon compliance (disqualification risk) |
| S | Scope |
| E | Engineering |
| P | Security and privacy |
| C | Cost |
| X | Product safety and ethics |
| G | Git and workflow |
| D | Demo and submission |
| A | AI usage |

---

## H — Hackathon compliance

Breaking any of these risks disqualifying the whole team.

- **H1. New work only.** No code, assets or designs from before the hackathon opened on **8 Oct 2026**. That includes rewritten old projects. Learning and planning notes are fine.
- **H2. Git history must match the event dates.** Never rebase, squash or amend commits to change dates. Never import an old repo's history.
- **H3. Public repo** on GitHub, from the first commit to submission.
- **H4. AWS must be visibly used.** The project must use AWS open-source tools (SAM) or deploy on AWS, and the **demo video must show it**. Mentioning AWS only in the writeup doesn't count.
- **H5. Credit everything we didn't write.** Third-party code, icons, fonts, images, sounds and music need credit and a compatible licence. List them in `README.md`, under Credits & Licences.
- **H6. List every AI tool used** in the writeup. `AI_USAGE.md` is the running log (see A1).
- **H7. Every team member registers individually** with their own WeMakeDevs account and a **verified** AWS Builder Center student profile. Verification must be done *before* the event, or as early as possible, because it is required for the fast-track interview.
- **H8. Submission rules:**
  - one submission per team, on the official form;
  - a public repo link;
  - a YouTube demo **under 3:00** (aim for 2:55), set to public or unlisted, and tested in a signed-out browser;
  - a writeup covering the problem, the build, and where AWS fits.
- **H9. Deadline.** The official deadline is **Sun 11 Oct, 20:00 IST**, and the form closes then. Our internal deadline is **18:00 IST**.
- **H10. Judges see only what we submit.** There is no live demo. Anything that isn't in the video, repo or writeup doesn't exist.

---

## S — Scope

- **S1. ExecutionPlan.md is the single source of truth** for what gets built and in what order. Work outside the current cycle needs a team decision.
- **S2. MoSCoW is enforced:**
  - *Must:* report, clean-and-claim (three photos, ghost overlay), Bedrock verification, map, basic leaderboard.
  - *Should:* hold and check-ins, contest and grace period, anti-sabotage weights.
  - *Could:* peer review, volunteer-hours screen.
  - *Won't:* chat, notifications, rich profiles, admin panel, web dashboard, iOS build.
- **S3. Cut lines are decided at checkpoints, not in panic.** If a checkpoint fails, apply the cut written in `ExecutionPlan.md` immediately.
- **S4. One working feature beats five that almost work.** Never leave a half-built feature visible in the app. Hide it behind a flag instead.
- **S5. No new dependency** without a one-line justification in the commit message. Prefer the standard library and what is already in the stack.

---

## E — Engineering

- **E1. `main` is always deployable.** If `go test ./...`, `sam build` or `npx tsc --noEmit` fails, the change doesn't merge.
- **E2. Spot state changes only happen through `domain.Transition`.** No handler or Lambda writes `spot.state` directly.
- **E3. Every state-changing write uses a conditional `version` check** (optimistic locking). A retry on conflict re-reads the item first.
- **E4. Logic in `domain/` and `verify/` is pure and tested.** It has no AWS SDK calls, and every rule has a table-driven test.
- **E5. All thresholds, timers and point values live in `internal/config`.** No magic numbers in handlers or prompts.
- **E6. `DEMO_MODE` only changes timers**, never thresholds or rules. The demo must show the real logic.
- **E7. Lambdas must be idempotent:**
  - SQS and Scheduler events may be delivered more than once;
  - claims carry an idempotency key;
  - schedules have deterministic names: `spot-<id>-<kind>`.
- **E8. Every Bedrock call has a timeout, at most 2 retries, and a stored raw verdict** together with `PROMPT_VERSION`.
- **E9. Errors return the standard envelope** `{"error":{"code","message"}}` with stable `code` values. The app never shows raw stack traces.
- **E10. Logs are structured JSON (`slog`)** with correlation IDs. Never log photo bytes, tokens, or exact reporter coordinates.
- **E11. TypeScript runs in `strict` mode with no `any`.** API types in `app/lib/types.ts` change in the same commit as the Go structs.
- **E12. Photos are captured only through `lib/capture.ts`.** No gallery or image-picker libraries may be added.

---

## P — Security and privacy

- **P1. No secrets in the repo.** Use `.env.example` with placeholder values. Real values go in SAM parameters, or in local `.env` files that are gitignored.
- **P2. Least-privilege IAM.**
  - Each Lambda gets only the actions and resources it needs.
  - No `"Action": "*"` and no `"Resource": "*"`, except where an AWS service requires it. Document any such exception inline.
- **P3. Photo storage:**
  - the S3 bucket is private;
  - all public access is blocked;
  - uploads use presigned PUT URLs (5 min TTL, `image/jpeg`, 3 MB or less);
  - reads use presigned GET URLs (15 min TTL).
- **P4. Reporter privacy.**
  - Only the **spot's** coordinates are public.
  - Users' capture coordinates are used for checks and never returned by the API.
  - A user's location history is never exposed.
- **P5. Faces.** The capture screen tells users to photograph the spot, not people. Photos are not shown on any public feed outside the spot's own detail screen.
- **P6. All routes except `/health` require a Cognito JWT.** User identity always comes from the token claims, never from the request body.
- **P7. Treat model output as untrusted.** Validate the verdict JSON against the schema and clamp values to their ranges. If parsing fails, send the claim to peer review; never approve by default.
- **P8. Treat image content as untrusted input.** The prompt tells the model to ignore text or instructions inside images.

---

## C — Cost

- **C1. Set an AWS Budgets alarm** at $5 and another at $20 on Day 1.
- **C2. Images are resized on the device** to a 1280 px long edge, JPEG quality 0.7, before upload. The server rejects images over 3 MB.
- **C3. Bedrock calls only follow integrity checks.**
  - Claims that fail cheap checks never reach the model.
  - There is a per-user cap of 30 Bedrock-backed actions per day.
- **C4. On-demand everything:** DynamoDB on-demand capacity, no provisioned resources, no NAT gateways, no always-on compute.
- **C5. Use the free-tier credits first.** Request the organisers' $25 code only once they run out (one request per team, made by the team leader).

---

## X — Product safety and ethics

- **X1. Hazardous waste is never a volunteer task.**
  - Any `hazards` result sets the spot to HAZARD, and the UI says "Report to municipal authority — do not handle."
  - Volunteers are never shown a claim button on a HAZARD spot.
- **X2. Safety guidance is shown at session start:** gloves, closed shoes, bags, no sharp objects by hand, public land only.
- **X3. Volunteer hours are only credited for approved claims.** Unverified hours are never shown as verified.
- **X4. The AI is triage, not a judge.**
  - Uncertain claims go to peer review.
  - The app never says "AI-certified."
  - The pitch is honest about the system's limits.
- **X5. No public shaming.** Lost spots and rejected claims are visible to the group concerned, not broadcast to everyone.

---

## G — Git and workflow

- **G1. Commit small and often**, at least every 1–2 hours of work. The history is also evidence for H2.
- **G2. Use Conventional Commits:** `feat(app): ghost overlay camera`, `fix(verifier): clamp cleared pct`, `chore(infra): budget alarm`.
- **G3. Work on short-lived branches** (`p2/c2.4-session-flow`) and merge to `main` when the cycle's exit criteria pass. A solo developer may commit directly to `main` if E1 holds.
- **G4. Tick boxes in `ExecutionPlan.md`** in the same commit that completes the task.
- **G5. Tag milestones:** `v0.1-loop` (core loop working), `v0.5-verified`, `v1.0` (code freeze).
- **G6. Code freeze is Sun 13:00 IST.** After that, the only allowed changes are fixes for bugs that break the demo, plus docs.

---

## D — Demo and submission

- **D1. The demo is filmed with real footage:** a real garbage spot, a real cleanup, and real in-app captures. Seeded data may fill out the map, but it must look realistic and must not be presented as real user activity.
- **D2. The video shows, in order:**
  1. the problem;
  2. report;
  3. clean and claim, with the ghost overlay;
  4. live verification;
  5. hold and contest;
  6. the AWS architecture, with a glimpse of the console or logs;
  7. the closing metric.

  It runs under 3:00 and follows `docs/demo-script.md`.
- **D3. Demo-mode timers must be disclosed in the video**, for example a caption saying "timers shortened for demo."
- **D4. The README lets a judge understand the project in 60 seconds:**
  - a one-line pitch;
  - an architecture diagram;
  - the core loop;
  - how to run it;
  - credits.
- **D5. The writeup covers the problem, the users, how verification works, the AWS services used and why, its limits, and the AI tools used.**
- **D6. The Builder Center blog post is published** before the form is submitted, and linked in the submission (for the AirPods prize).

---

## A — AI usage

- **A1. `AI_USAGE.md` is the running log.** It has one line per session: date, tool, and what it produced or changed.
- **A2. AI-generated code is reviewed before it's committed.** The committer is responsible for it as if they wrote it.
- **A3. No AI-generated assets** that copy a recognizable brand, character or copyrighted work.
- **A4. Claude Code follows `CLAUDE.md` §11.** It works on the current cycle only, asks before expanding scope, and never commits secrets.
