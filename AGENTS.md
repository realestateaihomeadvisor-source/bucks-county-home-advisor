# Product improvement workflow

Read CLAUDE.md, BUG_LOG.md and the relevant integration README first. CLAUDE.md describes the March setup; use current code and dated evidence for current state. This file governs the improvement process and does not install a runtime swarm.

## Coordinator and workers

Use a small team for separable, substantial work: one investigator, one implementer and one independent reviewer. Default to no more than three simultaneous workers, one review cycle and one revision cycle; expand only for a concrete unresolved defect. Simple changes need one worker. Reuse existing tools; do not buy subscriptions or run unbounded agent loops.

The coordinator owns the task list, evidence and integration. Give each worker an explicit scope, input commit, file ownership, expected output and stop condition. Prefer separate worktrees. Two workers must not edit the same files concurrently. Do not merge competing fixes blindly. The reviewer must inspect the final diff and independently run relevant checks.

## Acceptance and evidence

Before editing, define the visitor problem and measurable acceptance criteria. After editing, run `node scripts/check-quality.cjs`. Record the exact commit, command, result, environment and remaining gaps in a dated evidence note. Distinguish proposed, locally verified, staging verified and production verified. Never call a passing mock or document sample an end-to-end product success.

For Bucks, protect property-match confirmation; sourced and dated valuation; truthful failure messages; optional service-specific contact consent; deduplication; and separate confirmation of CRM save and notification delivery. Phone, email, browsing or estimate completion alone are not agent-contact permission. Use synthetic fixtures; keep secrets and personal visitor data out of code, test output and public notes.

## Priorities and completion

Fix blocked visitor paths before adding features or increasing marketing. First priorities: forgiving address input, mobile composer visibility, then a complete synthetic ATTOM-to-CRM-to-notification staging run. Track completion, error rate, latency and cost using observed data. Save each verified failure as a regression test where practical; update BUG_LOG.md only with accurate deployment status.

Prepare changes on a branch. Keep the live site operational. Release only after relevant checks, independent review, staging evidence and a rollback path exist. A local parser fix does not update Voiceflow: install it in the isolated TESTING canvas, verify complete conversations and then deploy the verified change. Do not activate unfinished n8n workflows. Do not claim continuous monitoring unless an actual scheduled task or running service is verified.
