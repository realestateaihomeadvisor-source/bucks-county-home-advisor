# Product quality checkpoint — 2026-10-25

## What changed

- Address parser accepts common comma-free input, unit numbers, pasted line breaks, flexible spacing/punctuation and Pennsylvania written out. It clears stale property fields before parsing and rejects incomplete or ambiguous addresses. ATTOM match and explicit property-confirmation gates are unchanged.
- Homepage candidate resizes the chat to the visible mobile viewport and scrolls a focused embed into view after keyboard resize. The existing widget header clip is retained; desktop dimensions and provider configuration are unchanged.
- `AGENTS.md` assigns bounded investigator, builder and independent reviewer roles, evidence requirements and release criteria.
- `node scripts/check-quality.cjs` runs all offline integration and viewport tests. A pull-request workflow runs the same command without product credentials or live writes.

## Observed evidence

Base: draft ATTOM branch commit `5bf716a88ba41004d7e499ab3903fcc5b84b3714`.

| Check | Outcome | Limit |
| --- | --- | --- |
| Offline quality command | Passed: 55 Node runner entries; custom nested scripts report 17 ATTOM, 5 CRM, 22 intake and 60 valuation checks | Counts use different test formats; do not sum them as one total. No live API calls. |
| Independent reviewer | No blocking regression; reran suite, diff whitespace check and 10 additional address variants | Read-only local code review |
| Mobile logic tests | Passed shrink/restore, focus, desktop, landscape offset, pinch-zoom skip, no-VisualViewport fallback and event coalescing | Mocked DOM, no actual iOS keyboard |
| Voiceflow access | Creator redirected to `/start` and visibly offered Log in | No authenticated staging canvas in this session |
| Production | No merge, publish, workflow activation or contact notification | Changes are prepared, not deployed |

These findings do not establish the root cause of Paul's two address failures. Historical staging uses inactive test webhooks that consume one armed call; a full match-and-confirm flow needs two separately armed calls. Parser normalization cannot repair an unarmed webhook, missing wiring or a provider coverage failure.

## Ordered remaining work

1. Restore authenticated Voiceflow TESTING access and inspect current usage/credits before optional previews. Install the parser in the isolated address Code step; verify success, invalid and failure connections. Do not alter the production project while testing.
2. Run complete staging conversations: comma-free address, pasted multiline/unit input, exact match Yes/No, correction, no match, provider unavailable, and timeout. Record response time and actual node outcomes. Use documented/public samples or synthetic fixtures; do not commit personal addresses.
3. Verify the mobile candidate on an actual iPhone/Safari with keyboard open/closed, portrait/landscape, long input and widget iframe/shadow focus. Check viewport offset-only panning, which the controller does not explicitly listen for. Ensure both typed text and send control stay visible.
4. Complete the existing synthetic consent/CRM/idempotency/notification staging gates. Verify actual contact ID and notification outcome separately; no unsupported follow-up success text and no agent contact without opt-in.
5. Incorporate reviewed changes into the current main branch without reverting newer content changes. Test again, retain the prior deploy/version for rollback, then release only the verified changes.

## Bully Buster companion

A separate portable package contains 28 synthetic scenarios, a fixture validator, scoring/release rubric, evidence template and bounded three-worker workflow. Fixture validation passed; all 28 product scenarios remain NOT RUN. No Bully Buster source checkout, test endpoint or app output was available in this task. Its actual policy and mobile behavior have not been modified or evaluated.

## Automation scope

The repository workflow supplies repeatable offline checks when the PR event runs. Its presence is not evidence that GitHub Actions has executed. This checkpoint installs no runtime agent service, background monitor, recurring content schedule or paid dependency. Product improvements remain bounded tasks with explicit outcomes.
