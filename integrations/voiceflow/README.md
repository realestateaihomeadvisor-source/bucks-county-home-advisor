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
