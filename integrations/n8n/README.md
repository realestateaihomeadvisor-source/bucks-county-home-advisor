# ATTOM valuation staging connection

This inactive n8n workflow is a proposed private backend for Voiceflow. It does not change the website, published Voiceflow flow, lead delivery, or any existing n8n workflow. No API keys or credentials are included.

## Installation still required

Import `attom-valuation.workflow.json` into the existing n8n Cloud workspace as a new workflow. Leave it inactive until the checks below pass. The workflow has been imported and saved in n8n. Its authenticated webhook → ATTOM → confirmed AVM path returned HTTP 200; an unauthenticated test was rejected with HTTP 403. Production and end-to-end Voiceflow operation remain pending.

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

When ATTOM is unavailable or returns unusable data, a supported ZIP can return `status: zip_fallback` with dated Zillow ZIP tier benchmarks, explicitly labeled as market context. Unknown ZIPs return a null estimate. An unconfirmed matched property still requires confirmation and never bypasses that step through the matrix. Clear prior estimate variables on each new lookup, and route `zip_fallback` to a separate ZIP market context report. Do not show a previous property's value or describe a matrix fallback as an ATTOM result. Other errors get an unavailable message plus an optional review. The 180-day age ceiling is a conservative product choice to review during staging, not an ATTOM quality guarantee. No recent sales have been independently verified by this workflow.

## Verification and cutover

1. Run `node integrations/n8n/attom-valuation.test.cjs`. These tests validate the embedded code locally. The separate n8n runtime checks confirm the sample provider path and simulated outage fallback; Voiceflow operation remains unverified.
2. Import and inspect all node fields and credentials in n8n; test the approved sample through both confirmation stages. Verify missing and incorrect webhook authentication is rejected before a provider call.
3. Test no-result, denied/quota responses, timeout, missing AVM, and invalid address. Confirm neither provider response nor logs expose keys. Successful, error, and manual execution persistence is disabled in the draft settings; verify those settings are honored by the installed version.
4. Duplicate the Voiceflow flow and add the server-side API request, explicit confirmation, variable reset, and unavailable routes there. Leave the existing live calculator/routing intact until complete transcript tests pass, including lead delivery to Paul.
5. Before publishing, confirm ATTOM trial expiry, quota, and permitted customer-facing display for this account. No new subscription or spending is authorized by this draft.
6. Publish only after end-to-end staging checks. Record the previous Voiceflow version and retain the original calculator backup for rollback; rollback must also restore its broad-estimate wording.

## Evidence and limitations

The approved direct ATTOM sample test returned HTTP 200 and one AVM with value $272,953, range $253,561–$292,345, date 2026-09-24, and provider score 93. This confirms the key can access that sample endpoint; Bucks County coverage and production reliability remain unverified. No scraping, county map, CRM follow-up automation, or live deployment is included.

References: [n8n Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/), [n8n HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/), [ATTOM API documentation](https://api.developer.attomdata.com/docs).

## Inspected older advisor workflow

The inspected inactive n8n workflow “Real Estate Home Advisor – working v5.2g” contains a webhook, JavaScript conversation-prompt construction, an OpenAI step, response handling, and HubSpot contact/note steps. Its inspected code does not calculate property values. Keep numeric estimates sourced from the valuation path rather than generated by the conversational model. Voiceflow remains the customer interface; no migration or replacement is included.

## Current dated ZIP benchmark matrix

`zip-matrix.current.json` supersedes the legacy fallback values in the current draft. It uses Zillow's published ZIP ZHVI lower-tier and upper-tier series dated 2026-08-31 for all 19 previously supported ZIPs. The lower endpoint is the typical value of homes in the 5th–35th percentile tier; the upper endpoint is the typical value in the 65th–95th percentile tier. These are ZIP-wide market benchmarks, **not property-value bounds, a prediction interval, comparable sales, or a valuation of the visitor's house**. Heading: **ZIP MARKET CONTEXT**. Display the source, date, and returned explanatory message. Benchmarks older than 120 days return unavailable rather than silently persisting.

The old matrix and the typical-value audit are retained only for traceability. For example, the old 18938 upper bound was $850,000 while the dated mid-tier typical value was $982,508. Do not present the old numbers as recalibrated. Dated tier benchmarks for 18938 are $593,044 and $1,732,955; their breadth reflects area-level housing variation rather than uncertainty about one specific property.

Source definitions: https://www.zillow.com/research/data/. CSV source URLs and dates are embedded in the matrix. Customer-facing display permissions must be checked before publishing. Data retrieval here is for internal audit/staging. No redistribution entitlement is asserted.

Local validation: 17 tests passed. Live n8n staging tests confirmed rejection without authentication, matching-property confirmation, and provider values after explicit confirmation. Before production, bind a separate private inbound service token: n8n auto-selected the newly created ATTOM Header Auth credential for both compatible nodes during staging. The workflow remains inactive; do not use the ATTOM key as a public widget token.

A simulated HTTP 503 provider response was tested inside n8n, returning the dated 18901 market benchmarks with `property_verified: false`. The provider node was pinned only for this simulation; remove that pin before further provider tests or publication.
