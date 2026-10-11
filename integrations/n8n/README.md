# ATTOM valuation staging connection

This inactive n8n workflow is a proposed private backend for Voiceflow. It does not change the website, published Voiceflow flow, lead delivery, or any existing n8n workflow. No API keys or credentials are included.

## Installation still required

Import `attom-valuation.workflow.json` into the existing n8n Cloud workspace as a new workflow. Leave it inactive until the checks below pass. Import compatibility and actual n8n execution have not yet been verified.

Bind two separate n8n Header Auth credentials:

| Node | Header name | Value |
| --- | --- | --- |
| Valuation request | `X-Bucks-Valuation-Token` | A newly generated private service token |
| ATTOM valuation | `apikey` | ATTOM API key entered through the credential editor |

Never set the webhook authentication to None. Keep both credentials out of GitHub, website JavaScript, screenshots, and public chat widgets. Use Voiceflow's server-side API step to call the webhook. Confirm the API step's credential handling before connecting it; a browser-side fetch is unsuitable.

## Request and response

POST JSON to the webhook test URL while n8n listens for a test event:

```json
{"address1":"468 SEQUOIA DR","address2":"SMYRNA, DE 19977"}
```

This is ATTOM's documentation sample used in the approved provider test. Address parsing must collect a street line and city/state/ZIP explicitly; do not silently infer them from the old ZIP bands. The existing Voiceflow `property_address`, `city`, and `property_zip` variables need mapping and address confirmation in a duplicated draft flow.

The first successful lookup returns `status: confirm_property`, the provider's matched full address and ATTOM ID, and `estimate: null`. Ask the visitor whether this is their property, including any unit. If they confirm, submit the same address with `confirmed_attom_id` equal to that returned ID. The second lookup returns `status: ok` only if that ID still matches and the valuation passes validation. If they reject it, collect a corrected address.

On `ok`, map `voiceflow.estimate_low`, `estimate_high`, `estimate_low_display`, `estimate_high_display`, `estimate_area`, and `confidence_label` into the corresponding existing variables. Display the source and `estimate.as_of` date. The provider score is metadata, not a probability of accuracy. Do not apply the old bedroom, condition, or size multipliers to this estimate.

All other statuses return a null estimate. Clear prior estimate variables on each new lookup, and route errors to an honest unavailable message plus an optional professional review. Do not show a previous property's value or silently substitute the ZIP calculator. The 180-day age ceiling is a conservative product choice to review during staging, not an ATTOM quality guarantee. No recent sales have been independently verified by this workflow.

## Verification and cutover

1. Run `node integrations/n8n/attom-valuation.test.cjs`. These tests validate the embedded code locally; they do not prove n8n import, credential binding, or Voiceflow operation.
2. Import and inspect all node fields and credentials in n8n; test the approved sample through both confirmation stages. Verify missing and incorrect webhook authentication is rejected before a provider call.
3. Test no-result, denied/quota responses, timeout, missing AVM, and invalid address. Confirm neither provider response nor logs expose keys. Successful, error, and manual execution persistence is disabled in the draft settings; verify those settings are honored by the installed version.
4. Duplicate the Voiceflow flow and add the server-side API request, explicit confirmation, variable reset, and unavailable routes there. Leave the existing live calculator/routing intact until complete transcript tests pass, including lead delivery to Paul.
5. Before publishing, confirm ATTOM trial expiry, quota, and permitted customer-facing display for this account. No new subscription or spending is authorized by this draft.
6. Publish only after end-to-end staging checks. Record the previous Voiceflow version and retain the original calculator backup for rollback; rollback must also restore its broad-estimate wording.

## Evidence and limitations

The approved direct ATTOM sample test returned HTTP 200 and one AVM with value $272,953, range $253,561–$292,345, date 2026-09-24, and provider score 93. This confirms the key can access that sample endpoint; Bucks County coverage and production reliability remain unverified. No scraping, county map, CRM follow-up automation, or live deployment is included.

References: [n8n Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/), [n8n HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/), [ATTOM API documentation](https://api.developer.attomdata.com/docs).
