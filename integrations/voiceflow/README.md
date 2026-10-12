# Staged Voiceflow valuation conversation

Testing project version: `6acc083af3eda240004108d6`. Isolated workflow: `6acc25c02367a77a17343b79`. Nothing here is published to the live site.

The three JavaScript files mirror the code staged in this private testing workflow. They use project variables, not external requests or credentials. Register `valuation_address1`, `valuation_address2`, `confirmed_attom_id`, `valuation_display`, and `valuation_response` with cross-session persistence disabled. Existing property and estimate variables are reused; address parsing preserves the original full address in `property_address`.

Run the local checks with `node integrations/voiceflow/valuation.test.cjs`. Sixteen checks passed on October 12. These execute the scripts independently; they do not establish browser wiring, provider coverage or live delivery.

## Intended graph

Testing intent → address message → entire-reply capture (`last_utterance`) → parser.

- Parser Default → private API; parser `invalid` → final display.
- API Success → formatter; API Failure → final display.
- Formatter Default → final display; formatter `confirm` → confirmation message → entire-reply capture → confirmation code.
- Confirmation Default → the same private API; confirmation `declined` → final display.
- Every Code Failure must lead to a static failure message that does not interpolate previous results.

The API body is `{"address1":"{valuation_address1}","address2":"{valuation_address2}","confirmed_attom_id":"{confirmed_attom_id}"}`. Capture the entire `response` to `valuation_response`. Keep the existing secret reference for `X-Bucks-Valuation-Token`. The endpoint remains an inactive n8n test webhook, armed manually for each backend request; do not activate production to make testing easier.

Both confirmation and final messages use `{valuation_display}`. Only an exact Yes (optionally followed by a period or exclamation mark) confirms the matched ID. No, uncertainty, qualified agreement, malformed state, or absent match stops. The formatter also requires that the returned property ID equals the stored confirmation ID and the estimate has a recent date before displaying a range. ZIP fallback leaves all property estimate fields clear.

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
