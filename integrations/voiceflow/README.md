# Staged Voiceflow valuation conversation

Testing project version: `6acc083af3eda240004108d6`. Isolated workflow: `6acc25c02367a77a17343b79`. Nothing here is published to the live site.

The three JavaScript files mirror the code staged in this private testing workflow. They use project variables, not external requests or credentials. Register `valuation_address1`, `valuation_address2`, `confirmed_attom_id`, `valuation_display`, and `valuation_response` with cross-session persistence disabled. Existing property and estimate variables are reused; address parsing preserves the original full address in `property_address`.

Run the local checks with `node integrations/voiceflow/valuation.test.cjs`. Seventeen checks passed on October 13 after correcting the custom Code-step return values to route-name strings. These execute the scripts independently; they do not establish browser wiring, provider coverage or live delivery.

## Intended graph

Testing intent → address message → entire-reply capture (`last_utterance`) → parser.

- Parser Default → private API; parser `invalid` → final display.
- API Success → formatter; API Failure → final display.
- Formatter Default → final display; formatter `confirm` → confirmation message → entire-reply capture → confirmation code. The capture's 90-second No reply path follows its reminder to the static failure message in New Block 10; ordinary captured replies continue to the confirmation gate.
- Confirmation Default → the same private API; confirmation `declined` → final display.
- Every Code Failure must lead to a static failure message that does not interpolate previous results.

The API body is `{"address1":"{valuation_address1}","address2":"{valuation_address2}","confirmed_attom_id":"{confirmed_attom_id}"}`. Capture the entire `response` to `valuation_response`. Keep the existing secret reference for `X-Bucks-Valuation-Token`. The endpoint remains an inactive n8n test webhook, armed manually for each backend request; do not activate production to make testing easier.

The Code-step custom paths return `"invalid"`, `"confirm"`, and `"declined"` as route-name strings. The formatter clears `last_utterance` before each confirmation message so a previous Yes cannot be reused if a later confirmation times out. Array returns advanced through Default in the live preview even though the earlier local harness treated their first element as the route. Both confirmation and final messages use `{valuation_display}`. Only an exact Yes (optionally followed by a period or exclamation mark) confirms the matched ID. No, uncertainty, qualified agreement, malformed state, or absent match stops. The formatter also requires that the returned property ID equals the stored confirmation ID and the estimate has a recent date before displaying a range. ZIP fallback leaves all property estimate fields clear.

## Saved UI steps

| Step | Node ID |
| --- | --- |
| Private API | `6accc4f59bf0946f0b809635` |
| Formatter / New Block 2 | `6accc8378dcd3b05b7199e15` |
| Final display / New Block 3 | `6accc8ba8dcd3b05b7199e23` |
| Address prompt / New Block 4 | `6acccb911a821f9d5f9119a9` |
| Address capture / New Block 5 | `6acccbc81a821f9d5f9119b1` |
| Parser / New Block 6 | `6acccc0b1a821f9d5f9119ba` |
| Confirmation message / New Block 7 | `6accce760c14e469f895861d` |
| Confirmation capture / New Block 8 | `6accce900c14e469f8958625` |
| Confirmation gate / New Block 9 | `6acccebe0c14e469f895862e` |

## October 12 preview evidence and blocker

The separate TESTING preview captured the full ATTOM documentation address `468 SEQUOIA DR, SMYRNA, DE 19977`, ran the private authenticated n8n webhook, and displayed ATTOM's matching address without an estimate. This verified runtime secret resolution and the first provider match, not the final valuation. The test webhook was armed manually for that request; n8n remains inactive.

The capture-to-gate, gate Default-to-API and declined-to-final-display lines, plus static Code Failure destinations, are now visibly connected. A direct preview launched from the confirmation message accepts `No`, executes the gate and reaches downstream routing. The full preview launched from Start or the address message instead logs `End` roughly ten seconds after the matched-address message, before a confirmation response can be submitted. The confirmation capture has a saved 90-second No reply setting and reminder; the formatter's prompt was shortened. Neither change resolved the full-path end. The gate's decline result also needs a dedicated preview with its final visitor text checked; the first direct preview had no armed backend and ended on the API failure message.

Next isolate the formatter custom `confirm` path → confirmation message → capture runtime transition. Rebuild the message and capture as one sequence or replace the routing with a deterministic Choice/Condition step if the existing separate-block transition is the cause; then verify a full `Yes` flow with a second armed n8n test call, plus `No` and no-reply outcomes. Do not count visual lines or local code checks as proof of a complete visitor conversation. No live publish, CRM contact, or agent notification occurred.

## October 13 isolation progress

A full preview with the test webhook unarmed reached API Failure and displayed the static failure message; it showed no valuation or lead/notification claim. An incomplete `Main Street` address had incorrectly advanced to the API while the parser returned `["invalid"]`. With the scalar `"invalid"` return, a repeat from Start went to the address guidance without an API call. The formatter and gate have the same scalar-route correction, and all three saved edits were verified after a TESTING canvas reload.

Confirmation capture is set to 90 seconds, a reminder to answer Yes or No without showing an estimate, and Follow path after reprompts enabled; its No reply output is visibly connected to the gate. The script check with a stale address as `last_utterance` declines and clears the estimate, but a live timeout has not been demonstrated. This timeout route has not yet been exercised in a complete runtime conversation. The n8n browser session remains at sign-in with a valid-email form error, so no staging test listener was armed on October 13. Full provider-backed Yes, No, no-reply and unsuccessful lookup conversations remain required. Do not infer ATTOM valuation, HubSpot contact, or notification delivery from the 17 script checks. Leave the test workflow inactive and the PR draft.

## October 13 armed end-to-end preview results

After secure n8n sign-in, the inactive `Bucks ATTOM valuation — staging` workflow was manually armed through **Execute workflow** for each backend call. It remained inactive throughout. These were isolated Voiceflow TESTING previews using the exact `TESTING ATTOM runtime` intent; no production publish or CRM/notification step was involved.

| Conversation | Observed result |
| --- | --- |
| Yes, documentation sample `468 SEQUOIA DR, SMYRNA, DE 19977` | First webhook call returned the exact matched property and held the estimate. The preview stayed open for `Yes`; a separately armed second call returned `$253,561 – $292,345`, source ATTOM, estimate date `2026-09-24`, with the not-an-appraisal and no-lead/no-agent language. The n8n editor reported successful execution for both calls. This is a complete provider-backed valuation conversation for the documentation sample, not proof of coverage or accuracy for other properties. |
| No, same sample | The full preview accepted `No` at the confirmation and displayed `Stopped — no property estimate was released, no lead created and no agent contacted. Start a new test if you want to correct the address.` No second API call or range appeared. |
| No reply, same sample | After the configured inactivity period, the visitor saw `Please reply Yes or No to confirm the exact property. No estimate has been shown.` A second inactivity timeout logged `End` and closed the chat without an estimate or success message. The final exit is silent; the saved Follow path after reprompts setting was checked, but the observed runtime did not display the gate's decline text. Treat this as a remaining timeout UX issue, not a demonstrated final-message pass. |
| Unsuccessful lookup, synthetic `99999 TEST LANE, DOYLESTOWN, PA 18901` | n8n returned a ZIP context fallback. The visitor saw `A property estimate is unavailable` and a dated Zillow tier benchmark description explicitly saying it is a broad area benchmark, not the property's valuation or a confidence interval. No numeric property range or submitted-request claim appeared. |

The exact visitor output for Yes and no-match is in the Voiceflow preview logs; both chats logged `End` only after the final text. The prior full-path early End at confirmation was not reproduced in these armed previews after the scalar custom-route correction. `node integrations/voiceflow/valuation.test.cjs` passed all 17 checks again. The Voiceflow UI subsequently showed a maximum-credit-consumption warning; no upgrade or purchase was made. A browser inspection of the final no-reply connection stalled, so the silent terminal timeout remains to fix and retest when editor access is stable. The earlier October 12 and isolation-progress sections above are historical blockers superseded by these observed results.

Before CRM testing, give the final timeout an explicit safe closure, verify it in a fresh complete preview, and confirm the intended staging-to-CRM handoff design separately. There is no demonstrated HubSpot contact creation or notification delivery. Keep the staging workflow inactive and PR #11 draft; do not deploy or merge.

### Minimal timeout repair plan (completed October 13)

Use the existing static failure message in **New Block 10** for the final no-reply exit. Inspect the output connector on confirmation capture **New Block 8** (`6accce900c14e469f8958625`) after its one reminder and `Follow path after reprompts` setting. Remove any dangling or ambiguous final No reply edge and connect that specific output directly to New Block 10, whose text explicitly says the property check could not finish and that no lead or notification was sent. Keep ordinary captured replies connected to the Yes/No gate **New Block 9**. This reuses an existing deterministic message, adds no API request or AI generation, and avoids relying on stale `last_utterance` for a timeout. Do not change the 90-second inactivity interval without a separate UX reason.

Retest from Start with an armed first webhook call and the documentation sample, then leave the confirmation unanswered through both timer periods. Require the reminder, then the static final message and `End`, with zero estimate fields and no second webhook request. Also rerun one `Yes` and one `No` preview to ensure the new edge has not diverted captured replies. If the capture still logs `End` before New Block 10, inspect whether Voiceflow's No reply path only fires after the reprompt setting is exhausted or rebuild that one Capture step; do not mark the timeout fixed from canvas lines alone.

## October 13 confirmed timeout repair and regression

The final **No reply** output on confirmation Capture **New Block 8** was connected in the isolated TESTING canvas directly to the existing static failure message **New Block 10**. Its ordinary entire-reply output remains connected to gate **New Block 9**. The 90-second inactivity setting, one Yes/No reminder, and Follow path after reprompts setting were unchanged. A canvas reload preserved the edge.

Fresh complete previews from Start, with each first provider call manually armed on the inactive n8n staging workflow, produced:

| Conversation | Observed visitor outcome |
| --- | --- |
| Yes, ATTOM documentation sample `468 SEQUOIA DR, SMYRNA, DE 19977` | Exact matched property was offered without a range; `Yes` reached the gate and a separately armed second staging call. The response showed ATTOM `$253,561 – $292,345`, dated `2026-09-24`, with the appraisal caveat and explicit no-lead/no-agent testing language. |
| No, same sample | `No` reached the gate and ended with `Stopped — no property estimate was released, no lead created and no agent contacted. Start a new test if you want to correct the address.` No range or second call appeared. |
| No reply, same sample | After the first 90-second interval the visitor saw `Please reply Yes or No to confirm the exact property. No estimate has been shown.` After the final inactivity interval the visitor saw `We could not finish this property check right now. Please try again later. This TESTING flow did not submit a lead or notify anyone.` The chat then ended. No range or second provider call appeared. This closes the previously silent exit. |
| Unsuccessful lookup, synthetic `99999 TEST LANE, DOYLESTOWN, PA 18901` | `A property estimate is unavailable` followed by dated ZIP market context labeled as a broad area benchmark, not a property valuation or confidence interval; no numeric range or submitted-request claim. |

`node integrations/voiceflow/valuation.test.cjs` passed all 17 local script checks again. These preview results validate the isolated conversation for the tested samples; they do not establish ATTOM coverage or accuracy across properties. n8n staging remained inactive. Production site/chatbot and existing lead routing were not published or changed. No HubSpot contact or notification delivery was tested. PR #11 remains a draft and must not be merged or deployed as a completed seller workflow. The next gate is a separately designed and verified staging-to-CRM handoff, including contact creation, duplicate handling, notification confirmation, and truthful failure messaging before any production release.

## October 13–14 isolated follow-up gate

After the final `{valuation_display}` message, New Block 11 checks that the response is `status: ok` from ATTOM, the property ID equals `confirmed_attom_id`, the numeric range equals the formatter's displayed low/high fields, and the estimate date is within 180 days. Only the `offer` custom path reaches New Block 12. Default and Fail stop without inviting a lead on unsuccessful lookup or a declined confirmation. `valuation-offer-gate.js` mirrors this Code step; 23 local valuation checks now pass.

New Block 12 asks whether Paul should follow up but explicitly says the TESTING conversation sends no request. New Block 13 captures the entire reply to `last_utterance`. New Block 14 routes exact case-insensitive `Yes` to New Block 16, which says no request, contact or notification occurred. Other replies route through Default to the neutral New Block 15 with the same no-write disclosure. No CRM node or notification was added. The new capture's initially enabled empty No reply branch ended a full preview shortly after its question; that branch was disabled. A focused Yes capture preview then reached New Block 16, and a focused No preview reached New Block 15 after its Default connector was repaired. The follow-up's inactivity UX has **not** passed a timed preview and remains open. The existing property-confirmation capture's 90-second reminder and final static failure route are separate and previously passed.

A fresh full preview from the isolated trigger with the inactive n8n staging workflow manually armed for both requests accepted the ATTOM documentation sample, waited for the property's Yes confirmation, then showed `$253,561 – $292,345`, ATTOM, `2026-09-24`, and the appraisal/no-lead caveat. It reached New Block 12's guarded follow-up prompt. The first attempt without an armed webhook displayed only the static failure message, as intended. These runs do not prove accuracy for other addresses or a real seller handoff.

Before staging CRM writes, settle the follow-up timeout and final visitor message, test complete No and unsuccessful-lookup paths after the added gate, implement deterministic service-specific consent and verified contact details, then bind the separately connected `Bucks HubSpot CRM — TESTING OAuth` credential to a gated inactive workflow. Verify contact ID, duplicate handling, failure behavior, and Paul-only delivery with synthetic consent before any production publish. n8n staging remains inactive, the production site and lead routing remain untouched, and PR #11 stays draft.

## October 13 follow-up inactivity preview

New Block 13's No reply branch is enabled with a 90-second inactivity interval, one neutral reminder (`Would you still like Paul to follow up? Reply Yes or No. This TESTING conversation will not send a request.`), and Follow path after reprompts. Its No reply output is connected directly to New Block 17's static ending: `We did not receive a reply, so this TESTING conversation has ended. No follow-up request was sent, no HubSpot contact was created, and Paul was not notified.` Ordinary replies still go to New Block 14.

A focused Voiceflow preview started at New Block 12 and was left unanswered. It logged the first `No reply timeout` at 20:25:12, displayed the reminder, logged a second `No reply timeout` at 20:26:50, displayed New Block 17's exact ending, then logged `End` at 20:27:00. No CRM or notification claim appeared. This passes the new post-report inactivity path in a focused preview; it is not a fresh complete provider-backed conversation. The 23 valuation checks and 21 intake checks passed locally again, without network or CRM writes.

The complete confirmation No and unsuccessful-lookup regressions after the success-only offer gate are recorded below. Before CRM testing, implement and verify explicit seller consent/contact capture and a gated synthetic HubSpot write with contact ID, duplicate/failure handling, and Paul-only delivery. Keep staging inactive, production untouched, and PR #11 draft.

## October 14 full-path regression after the offer gate

After secure Voiceflow sign-in, two new previews launched from the isolated `TESTING ATTOM runtime` intent. The inactive n8n ATTOM test workflow was armed only for each initial request and returned to idle after each call.

| Conversation | Observed visitor outcome |
| --- | --- |
| No, ATTOM documentation sample `468 SEQUOIA DR, SMYRNA, DE 19977` | The first call matched that exact property and the confirmation asked for Yes or No without a range. `No` reached the gate and displayed `Stopped — no property estimate was released, no lead created and no agent contacted. Start a new test if you want to correct the address.` The chat ended. No second request, price or follow-up offer appeared. |
| Unsuccessful lookup, synthetic `99999 TEST LANE, DOYLESTOWN, PA 18901` | The chat displayed `A property estimate is unavailable. ZIP market context from Zillow home-value tier benchmarks dated 2026-08-31. This is a broad area benchmark, not a valuation of your property or a confidence interval. Not an appraisal. Testing only — no request has been submitted.` It then ended with no numeric property range or follow-up offer. |

Reran `node integrations/voiceflow/valuation.test.cjs` (23 passed), `node integrations/n8n/lead-intake.test.cjs` (21 passed), and `node integrations/n8n/attom-valuation.test.cjs` (17 passed) at PR head `10486fde`. These local checks do not prove broader ATTOM coverage or CRM delivery. A fresh full provider-backed Yes conversation also passed through the guarded follow-up answer: the sample matched exactly, Yes released ATTOM $253,561 – $292,345 dated 2026-09-24 with appraisal caveat, and a second Yes at the optional follow-up ended with `You chose Yes in this TESTING conversation. No follow-up request was sent, no HubSpot contact was created, and Paul was not notified.` The chat logged End. Earlier focused No and timeout follow-up previews passed. The confirmation timeout passed in a prior full preview. The isolated ATTOM n8n workflow remains inactive and idle; no production publish, CRM write or notification occurred.

Before seller CRM testing, implement deterministic service-specific opt-in and contact capture, bind the connected TESTING HubSpot credential only to an inactive gated workflow, and verify a synthetic contact ID, duplicate/failure responses and Paul-only delivery with truthful visitor wording. Keep PR #11 draft and production routing untouched.

## October 14 isolated consent and synthetic contact continuation

The successful ATTOM report's optional follow-up Yes now continues from New Block 16 to a TESTING-only sharing question in New Block 18. It names Paul at Bucks County Home Advisor and explicitly says this test will not create a contact or notify him. New Block 19 captures the reply; New Block 20 clears `last_utterance` and routes only an exact Yes (optional final period/exclamation mark) to New Block 21. No and other replies use the neutral no-write ending in New Block 15. New Block 21 asks only for a made-up first name and `@example.invalid` email, comma separated. New Block 22 captures that reply; New Block 23 clears it and routes the strict synthetic format to New Block 25, while malformed entries end at New Block 24. Both endings explicitly say nothing was sent to n8n/HubSpot and no contact or notification was made. No transport or CRM step was added.

The saved sharing-question step ID is `6acf59467fb7577c04b3b833` (New Block 18); follow the connected New Blocks 19–25 on the isolated canvas.

The TESTING canvas was reloaded and these blocks persisted. Focused previews launched at New Block 18 passed: `No` reached the neutral ending; `Yes` then `Test, test@example.invalid` reached the valid-format no-write ending; `Yes` then `Test, not-an-email` reached the invalid ending and logged `End`. These are focused continuation tests, not new full ATTOM-to-contact conversations. The earlier full ATTOM Yes/No/timeout/no-match tests remain the valuation evidence above. The n8n fixed notice includes the two disclosure sentences but not the Voiceflow instruction `Reply Yes or No`; matching request text to that notice is not proof of a displayed or clicked consent receipt. The selected seller service, consent event, verified contact channel, authenticated webhook transport, and actual CRM write are not wired together.

Before a CRM write, finish the service choice and consent receipt contract, test a complete conversation through the new continuation, then exercise an authenticated no-write webhook with accepted/declined/incomplete/withdrawn cases. Keep real details out of tests. A separate inactive HubSpot path must return a contact ID and handle duplicates and failures before any visitor success claim or Paul-only notification. Production remains untouched, n8n staging inactive, PR #11 draft.

### October 14 new-capture inactivity repair

New Blocks 19 and 22 each have a saved 90-second No reply interval, one stage-specific reminder, Follow path after reprompts, and a final No reply edge to New Block 26. The static ending says no contact details were submitted, no HubSpot contact was created, and Paul was not notified. Ordinary replies still go through the exact-Yes and synthetic-format gates. The initial reminder entry made with a generic set-value operation did not persist; direct editor typing corrected it. A canvas reload showed both reminders and both 90-second values saved.

Focused timeout previews temporarily used 10-second intervals to exercise the routing. New Block 18 with no reply reached the static ending and `End`; its initial test did not show a reminder because that text had not persisted yet. After the reminder correction, a focused preview from New Block 21 displayed the contact-format reminder after the first `No reply timeout`, then the static ending after the second timeout, then `End`. No success, contact, or notification claim appeared. The contact interval was restored to 90 seconds and verified after another reload; the consent interval remained 90 seconds with its reminder saved. The consent reminder itself and the actual 90-second elapsed timing have not been re-observed in a fresh preview. These are focused continuation tests, not a complete provider-backed seller conversation. No n8n or CRM request was made.

## October 14 complete seller continuation and authenticated no-write intake

A fresh preview from the isolated `TESTING ATTOM runtime` intent used the ATTOM documentation sample `468 SEQUOIA DR, SMYRNA, DE 19977`. The inactive ATTOM n8n workflow was manually armed for the match and again for the confirmed valuation. The chat stayed open at the exact matched-property question; `Yes` released the ATTOM `$253,561 – $292,345` range dated `2026-09-24`, with the appraisal caveat and explicit no-lead/no-agent disclosure. `Yes` at the optional professional-valuation follow-up reached New Block 18's separate sharing question. `Yes` there, followed by `Test, test@example.invalid`, reached New Block 25's valid-format ending and logged `End`. The ending explicitly said the entry was **not submitted** to n8n or HubSpot and that no contact or notification occurred. This is a complete provider-backed visitor conversation for the tested documentation sample, including the synthetic contact continuation. The earlier full No, confirmation timeout and unsuccessful-lookup results above remain the other valuation branches; the later consent/contact timer tests were focused previews.

An additional, separate workflow `TESTING — Intake webhook smoke (no writes)` was saved in the same isolated Voiceflow project at workflow ID `6acf73b7d947b09f2fe9dc11`. Its exact internal intent is `TESTING intake no-write smoke`; its sole connected block is an authenticated POST to the **test** URL of the inactive `TESTING — Bucks advisor intake — NO CRM WRITES` n8n workflow. It uses the existing `BUCKS_VALUATION_TEST_TOKEN` secret reference in the `X-Bucks-Valuation-Token` header and a synthetic accepted fixture. It is not connected to the seller visitor path. An initial disconnected copy on the seller canvas was removed, and a reload confirmed the seller graph kept New Block 25 without that copy. The smoke block's accepted fixture persisted after reload.

With n8n manually armed through **Execute workflow**, the accepted synthetic request completed all three no-write nodes: Webhook → Code payload gate → Respond. The response-node output was `testing_ready`, `would_create_contact: true`, `crm_write_performed: false`, `notification_sent: false`, category `professional_home_valuation`, and field names only (`firstname`, `lead_type`, `hs_lead_status`, `email`, `property_address`, `seller_next_step`). Changing only consent choice to `no` for a separately armed full execution returned `no_contact_consent`, `would_create_contact: false`, and both write/notification flags false. The fixture was restored to `yes` afterward. A preliminary **Listen for test event** run received the authenticated webhook but ran only its trigger until the Code node was manually executed; the full-execution evidence is from the later **Execute workflow** runs.

All local checks reran: 23 Voiceflow valuation, 22 intake and 17 ATTOM checks, 62 total. The no-write workflow remains saved and inactive, as does ATTOM staging. These tests prove the authenticated synthetic intake gate and its response; they do not prove the visitor's synthetic answers were transported from the seller path, that a real opt-in receipt was stored, that a HubSpot contact was created or deduplicated, or that Paul received a notification. Before a CRM write, connect the deterministic selected service, displayed consent decision and contact channel to the server-controlled intake contract, verify the visitor-facing success/failure wording against actual webhook outcomes, then test an inactive synthetic HubSpot write, contact ID, duplicate/failure behavior and Paul-only delivery. Production and existing lead routing remain untouched; PR #11 stays draft.
