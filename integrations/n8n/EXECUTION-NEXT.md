# Bucks Home Advisor — execution checkpoint

Updated 2026-10-11. Primary domain remains `buckscountyhomevaluenow.com`, verified by the repository CNAME and current project documents. “Home Advisor” is the product name; a replacement domain has not been configured.

## Outcome and architecture

Deliver useful property guidance, capture an explicit seller service request, save it reliably, and deliver an actionable summary to Paul. Agent delivery is a later verified step. Voiceflow stays the conversation interface; n8n provides the private ATTOM valuation service; HubSpot holds consented contacts and notes. Do not restart the old n8n conversational-advisor workflow or build a replacement website.

The next milestone is one staging seller conversation that confirms the provider-matched property, shows a sourced and dated estimate, explicitly requests help, saves one TESTING contact, and delivers one summary to Paul. Decline, unavailable valuation, CRM failure and notification failure must each have truthful outcomes.

## Current evidence

| Item | Evidence and status |
| --- | --- |
| ChatGPT HubSpot access | CONTACT/DEAL/NOTE/TASK read and write AVAILABLE, verified this evening. This does not prove Voiceflow OAuth is healthy. |
| Earlier seller email | Today's Voiceflow TestLead email to Paul exists; synthetic Doylestown address. This is an earlier flow test, not ATTOM end-to-end proof. |
| Earlier seller CRM claim | Prior chat reported a save, but a current CONTACT search for TestLead returned total 0. Do not assume that old test record still exists. |
| ATTOM/backend code | Current draft PR #11; 17 valuation and 21 intake tests passed again. Local tests do not establish live provider coverage or CRM delivery. |
| n8n runtime | Existing instance realestateaiagent.app.n8n.cloud opened; Bucks ATTOM valuation — staging, workflow cG49sE7oQ5Falk6b, visibly Saved and Inactive. Earlier sample/outage responses were not rerun. Webhook now uses the separate saved Header Auth credential “Bucks valuation inbound — TESTING” with header X-Bucks-Valuation-Token. The ATTOM provider credential was not changed. |
| Voiceflow access | RealEstateAI workspace opened successfully this evening. |
| Voiceflow isolation | Testing project version 6acc083af3eda240004108d6 inspected. All seven visible CRM URLs point to crm-disabled.invalid/testing-only; closing prompt prohibits email/CRM/agent tools. |
| Saved testing changes | Buyer Renter Post-Phone Details no longer assumes a contact exists or promises follow-up. Renter Agent Offer provides a checklist and no longer promises available listings or delivered options. |
| Voiceflow regression | Synthetic buyer conversation reached the disabled CRM path and the corrected post-phone step visibly said: “This test has not submitted your request or contacted an agent.” This validates that staging message, not successful CRM transport. Continuing to the final closing agent exposed a contradictory promise of agent follow-up. Its inherited exit condition still requested Gmail; that condition was replaced with TESTING-only exit behavior and the closing instructions now require one exact completion sentence. Second buyer retest ended with the truthful no-agent/no-live-lead statement and no final agent-follow-up promise. The model still appended unsupported reassurance that everything was working; replace this closing agent with a deterministic message before release. Earlier buyer steps repeated already supplied details and exposed internal variable names. Those quality defects remain open. CONTACT search for TestingBuyer returned total 0. |
| CRM enums | buyer_help_interest accepts accepted/maybe_later; renter_help_interest accepts Accepted/Maybe later, checked against current schema. The May mapping file is stale and must not drive installation. |
| Dan forwarding | Prior chat says Google verification pending for dan@lvhomegroup.com. Current forwarding state not inspected; no Dan testing is authorized. |

## Next implementation specs, in order

1. Complete staging conversation corrections. Replace the buyer offer's unverified agent promise; move recipient-specific deterministic opt-in before contact creation; permit chosen email or phone. Remove seller success claims from failure routes. New prompt text alone is not a consent gate or delivery integration.
2. Connect the existing private valuation workflow to the TESTING copy. Bind separate inbound service authentication, confirm street/city/state/ZIP, require confirmation of ATTOM's matched address/ID, clear prior estimates on every lookup, and display source/date. ZIP fallback is market context, never a house valuation. Keep provider credentials server-side.
3. Add staging CRM transport after isolation of notifications. Use current verified fields/enums, one server-generated submission ID, explicit TESTING flag and stable contact ID. An ambiguous create timeout must not trigger blind duplicate creation. Persist consent receipt and preferences in a configured private store or appropriate CRM note.
4. Implement deterministic delivery states. A CRM success requires an actual saved contact ID; notification success requires a delivery response. Display queued/sent/failed separately. Never claim an agent received a lead merely because contact entry completed. Testing destination is Paul only.
5. Run end-to-end seller, buyer and renter tests, plus decline, email-only, stale email, provider unavailable, wrong property match, CRM rejected payload, duplicate retry and notification failure. Verify records and delivery evidence separately. No live publication until these pass and provider account coverage/display/quota checks are complete.
6. After verified rollout, measure starts → confirmed property → useful report → explicit help request → consented contact → successful delivery → agent response → revenue. Count real leads separately from TESTING. Focus the first growth experiment on the existing Quakertown, Sellersville and Doylestown entry pages with campaign attribution. Establish a baseline before increasing spend.

## Boundaries

No production website publish, main-branch merge, agent test email, new subscription, commercial lead sale, address resale or raw address-register activation in this checkpoint. No pricing or income projection is validated by these technical checks. Revenue depends on contactable, requested service leads and an actual fulfillment arrangement.

## Authorized private connection — 2026-10-11 evening

Paul explicitly approved creation and saving of a separate private token in n8n and the Voiceflow testing project. The token value is not included in this repository, this checkpoint, or screenshots.

- n8n credential: **Bucks valuation inbound — TESTING**, header **X-Bucks-Valuation-Token**; saved and bound to the staging Valuation request webhook. Workflow saved and inactive; no production activation occurred.
- Voiceflow restricted secret: **BUCKS_VALUATION_TEST_TOKEN**, created in the isolated TESTING project. The API workflow step references the secret by name, not a literal key or a model-generated input.
- API workflow step: **TESTING — Private ATTOM request**, step ID **6acc24000b66e1bae76a5e9f**, in Start workflow. It is unconnected to visitor intake and uses the provider documentation sample. Request reset to the unconfirmed sample after testing.
- The first newly created API tool did not show a Secrets selector in its source editor. It was detached from Seller Mini Report; the deterministic API workflow step was used instead. An empty workflow **TESTING — ATTOM runtime smoke**, canvas ID **6acc25c02367a77a17343b79**, was created to prepare a preview check. Copy/paste did not complete; no smoke workflow execution was verified.

| Check | Observed result | Limit |
| --- | --- | --- |
| Voiceflow API editor → full n8n workflow, correct token | HTTP 200, status confirm_property, matched ATTOM ID 147435254, estimate null | Editor requested a manual test value for the secret reference; automatic preview resolution remains unverified. |
| Same provider sample with confirmed_attom_id 147435254 | HTTP 200, status ok, ATTOM value 272953, range 253561–292345, source date 2026-09-24 | Documentation sample in Delaware; does not establish Bucks County coverage. |
| Deliberately wrong token | HTTP 403 Forbidden | n8n remained waiting for a valid webhook; the test listener was stopped afterward. |

An initial Listen-for-test-event check executed the webhook node only and returned an empty body. It is not counted as a valuation pass. The later tests used Execute workflow and verified the full returned JSON and successful workflow execution.

### Resume here

1. Restore browser-control access: its transport disconnected during smoke-test preparation, and the supported troubleshooting call timed out. Credentials are saved in both services; do not create duplicate credentials or ask Paul to approve the same token again.
2. Verify the restricted secret resolves in an actual private Voiceflow preview without the API editor's manual test-value override. Finish the dedicated smoke workflow using the existing unconfirmed sample API configuration. Keep it separate from seller intake and CRM.
3. Replace the static sample body with validated address variables in a separate intake path; add explicit matched-property confirmation and result/error routing. Remove the old calculator path from that staging branch, clear stale estimate variables, and map only successful provider results. Supported ZIP fallback is market context.
4. Continue the consented CRM and notification specs above. No HubSpot records, agent notifications, website publication, or full seller/buyer/renter delivery test occurred in this credential step.


## Runtime secret verified — 2026-10-12

Browser control recovered. Voiceflow and n8n required fresh secure sign-in; both were verified signed in. Their unfinished work tabs were marked for continuation. This preserves tabs for later work but does not guarantee permanent authentication or prevent cloud environment restarts.

The isolated TESTING — ATTOM runtime smoke workflow now contains a copy of the private request step (ID 6accc4f59bf0946f0b809635), connected to its own testing-only intent trigger. The intent TESTING ATTOM runtime has the explicit sample phrase `run private attom smoke test`. No production project was published.

An actual Voiceflow preview resolved that phrase to the testing intent, jumped to the private request, and reported `[API tool] succeeded` after 2.93 seconds. The full n8n staging workflow simultaneously reported Workflow executed successfully, with one item through the valuation nodes. No API-editor Send action, manual secret override, replacement credential, CRM write or notification was used. This verifies automatic runtime secret authentication and backend execution. The response was not yet mapped to customer-visible fields in this smoke path; do not count it as a finished seller report or Bucks coverage validation.

Resume with validated seller address variables, property-match confirmation, captured response and deterministic source/date/error display. Then implement consented CRM and Paul-only notification delivery. Existing buyer/closing quality defects remain open. n8n remains Saved and Inactive; no production activation or live website change occurred.

## Conversation staging — 2026-10-12 morning

The isolated workflow now contains address prompting, full-reply capture, address validation/reset code, the variable-bound private request, a response formatter, separate confirmation/final messages, confirmation reply capture and a strict Yes-only gate. Dedicated valuation request/display/confirmation variables were created with cross-session persistence disabled. The API captures its full response to valuation_response; temporary registration mappings were removed.

Before replacing the sample body, an actual preview successfully displayed ATTOM's matched address and withheld the estimate through the response-capture → formatter → message path. This is a limited property-match display pass, not a completed seller conversation.

The scripts are saved under integrations/voiceflow with 16 passing local checks covering full/unit addresses, rejected partial/JSON-breaking inputs, unconfirmed/mismatched properties, explicit/declined/qualified confirmation, stale/future/malformed dates, ZIP context and stale results. See that directory's README for node IDs and exact unfinished connections. The variable-bound preview and final branch wiring remain unverified.

Two concrete interruptions occurred: browser transport briefly disconnected; after recovery Voiceflow displayed “You've reached your maximum credit consumption.” Editing remained possible, but the browser subsequently returned to Voiceflow login during final wiring. No upgrade, credit purchase or production publication occurred. Finish confirmation capture → gate verification, gate success/decline connections, static Code Failure routes, and actual preview tests before connecting this workflow to seller intake. No HubSpot contact or notification was created in this step.

## Usage and spending gates — 2026-10-12

**Later account verification, October 12:** Voiceflow re-authentication succeeded. Workspace Pro usage for Oct 11–Nov 11 is $60 total, $1.21 used (2%), $58.79 remaining; auto top-ups are off. Billing shows $60/month credit bundle plus $50/month editor seats, next renewal Nov 11, and a $110 paid Oct 11 invoice. Both seats are occupied by Paul and a collaborator. This supersedes the unknown-balance wording below. No credit purchase, plan/access change, preview run or publication followed. The cause of the earlier maximum-consumption warning was not established. See `ADVISOR-ROADMAP.md` for the architectural and cost decision.

The published BucksCountyHomeValueNow.com widget answered one fresh text message at about 8:35 a.m. America/New_York on October 12. Its initial greeting was automatic; the sent message was “What can you help me with?” and the reply offered buy/sell/rent/home-value choices. That proves one live turn, not the valuation path, CRM delivery, remaining Voiceflow credits or continued service after a hard cap. The Voiceflow billing screen was unavailable after sign-out. Do not infer that an upgrade is necessary or that live capacity is safe from this single check.

Before further credit-consuming Voiceflow previews or any new production rollout, record the workspace plan, remaining credits, consumption history, next reset, auto-upgrade setting and any hard stop behavior from its actual billing/usage UI. If the maximum-consumption warning remains or the remaining allowance is unclear, stop optional previews. Do not buy credits, enable automatic upgrades or change a paid tier without a specific cost and decision from Paul. Keep the live project unchanged while finishing free local code and graph review.

For the staging seller flow, use local tests for parser/formatter/consent logic first, then one targeted preview per corrected path. Record start/end credit readings and the steps exercised; stop if the expected debit is exceeded or the warning returns. Reuse the Delaware provider documentation fixture for integration checks; a separate, limited Bucks address check is needed to establish actual ATTOM coverage before any public property claim. Keep n8n staging inactive and arm only the intended test webhook. Count ATTOM requests and n8n executions separately from Voiceflow credits; neither is assumed free. Add per-session request limits, duplicate suppression and cached provider results with a documented freshness period before opening production traffic.

| Service | Currently verified | Next measurable boundary |
| --- | --- | --- |
| Voiceflow | Pro, $60 credits for Oct 11–Nov 11, $1.21 used, $58.79 remaining; auto top-ups off; $110 monthly subscription including editor seats. Earlier warning remains unexplained. | Meter staging preview debit; audit seat need before Nov 11; no credit purchase currently indicated. |
| n8n and ATTOM | Private TESTING request works; staging workflow saved inactive; no current execution/provider quota read | Inspect plan execution quota and ATTOM usage/allowance; budget calls per isolated test and later per confirmed address. |
| Higgsfield | Connected balance read: 371.1 credits, Pro workspace, one Genjutsu free generation and five AI Influencer Builder free generations; Viral free generations zero | Daily read-only balance watch alerts below 150 credits or a >50-credit drop; obtain cost estimate before each paid generation and record debit after. |
| Metricool | Connected brands and publication/analytics tools verified; billing or quota is not exposed by the connector | Review subscription/usage in its own account UI before paid scheduling changes; continue separate brand and duplicate-post checks. |
| CapCut | No connected billing/usage meter verified in this work | Check current subscription and export/AI credit cost in the app before any paid effect or renewal change. |

No cross-platform spending dashboard is implemented. The Higgsfield watch is a real scheduled read-only balance check; the other rows are explicit gates for work sessions until their meters are accessible. Do not represent the social queue review as a subscription monitor.
