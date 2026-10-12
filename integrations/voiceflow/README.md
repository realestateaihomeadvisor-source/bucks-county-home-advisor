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

## Verification still required

The earlier sample preview verified captured response → matched-address message with no estimate. The later variable-based conversation has not completed a preview test.

Address intake, API Success/Failure routing, parser Default/invalid routing, and formatter confirmation-message/capture routing were visually staged. Recheck every connection after sign-in. Confirmation capture → gate is unverified; gate Default → API and gate declined → final display remain unfinished. Static Code Failure routes also remain unfinished. Do not count a drag attempt as a saved connection.

Voiceflow displayed its maximum-credit-consumption warning during recovery, then returned the browser to login during final wiring. No plan change or credit purchase was made. Finish connections and run actual preview tests once authenticated and the credit limit permits them. The testing workflow must remain isolated from real visitors, CRM and notifications until that verification passes.
