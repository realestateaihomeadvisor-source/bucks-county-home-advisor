# Valuation audit — 2026-10-11

## Live inspection and change

Voiceflow project 6a97385ba2e6e60fee4143bd; editable version 6a97385ba2e6e60fee4143be. The production embed pins this editable version, so saved flow edits can affect visitors without Publish.

Inspected JavaScript node 6a2bcf3c45d10c347c80a7df, Calculate Seller Mini Report. Original source is preserved in voiceflow-calculator-original-2026-10-11.js. It contains fixed price bands for 19 ZIP codes, a default $320,000–$520,000 band, and preset bedroom/bathroom/size/condition multipliers. There is no API request, comparable-sale retrieval, data date, parcel match, or evidence source in this calculation.

The legacy Seller Mini Report agent prompt differs from the JavaScript formula. Do not edit the legacy prompt as if it were the actual engine.

Message 3 (node 6a2bcfd345d10c347c80a7fc) previously claimed “Based on recent home sales and market activity near {estimate_area}.” Replaced the source statement, preserving the variable tokens and numeric engine:

PRELIMINARY HOME VALUE ESTIMATE

Estimated Range:
{estimate_low_display} – {estimate_high_display}

Broad starting range. Recent comparable sales have not been verified. Not an appraisal. ZIP-level assumptions and your details for {estimate_area}.

Rollback: restore the old Message 3 source sentence above. No formula, connections, contact routing, or production website code changed in this audit.

## Reproduced findings

Executed the copied JavaScript with Node vm and synthetic property inputs (not accuracy validation):

| Input | Low | High | Internal confidence |
| --- | ---: | ---: | --- |
| Doylestown 18901, 3 beds, 2 baths, 2,000–2,500 sqft, good condition | 550000 | 650000 | stronger |
| Different street address, otherwise identical inputs | 550000 | 650000 | stronger |
| Unsupported ZIP 99999, otherwise same details | 385000 | 455000 | stronger |
| Doylestown, unknown size | 530000 | 670000 | moderate |

“Stronger” only reflects supplied ZIP/size, not observed accuracy. Unsupported ZIPs can still receive that label. Property type is intentionally ignored, so a condo and detached home with identical answers can receive the same range. No empirically supported calibration or source date was found in this node.

## Next integration: ATTOM, gated on account access

Official references:
- https://api.developer.attomdata.com/docs
- https://api.developer.attomdata.com/documentation
- https://api.developer.attomdata.com/docs/guides

ATTOM documents /attomavm/detail with address/address1+address2 or ATTOM ID filters and property.avm.amount.value/high/low/scr plus eventDate. The API key belongs in a server-side request header, never in this public static index.html or GitHub.

Before wiring production:
1. Confirm trial/package entitlements for property detail and ATTOM AVM, Bucks County coverage, usage limits, and permitted public display/attribution. No paid plan has been purchased.
2. Choose the already-owned backend (n8n/Twin/server) and enter ATTOM credentials in its secret store.
3. Resolve an exact property including unit; show the matched address for confirmation when ambiguous. Do not substitute ZIP averages for failed matches.
4. Return provider low/high/value, provider valuation date, source and raw provider confidence separately. Do not invent an “accuracy percentage” or modify the provider AVM with the old condition multipliers.
5. Missing/no-match/error/stale data returns “Estimate unavailable” and useful next steps; never a $0 estimate or fabricated price.
6. Keep homeowner-reported repairs/upgrades separate from public-record facts. Offer optional professional review for material discrepancies.
7. Test detached, condo, townhome, multiple units, ambiguous address, unknown ZIP, no AVM, timeout, rate limit, stale date, invalid/inverted ranges, and a failing backend before switching traffic.
8. Compare licensed reference valuations for an authorized sample; report error distribution and provider coverage honestly.
9. Isolate a test copy/version and change the live version target only after end-to-end tests and rollback are verified.

An AVM response alone does not substantiate claims that the chatbot independently retrieved 8 nearby sales within 1.2 miles or reviewed recent upgrades. The staged website copy and other pages also need claims reviewed when the data connection is chosen.

## Red End Chat / Cancel buttons

Both controls were visible in the embedded widget during a normal conversation. DOM inspection showed a vfrc-prompt inside an article whose class includes withPrompt-false. Cancel did not remove the controls in this browser. The widget places the prompt with an absolute position and a translateY(136px), but its bounds still fall inside the chat panel here. This points to rendering/clipping behavior; no reliable widget fix has been deployed. Do not hide all prompt controls blindly, because the intended end-chat confirmation must still work.

## Prototype verification

After saving Message 3, ran the complete home-value intake with synthetic 123 Example Lane, Doylestown PA 18901; 3 bedrooms; 2 bathrooms; 2,000–2,500 sqft; Good condition; Just exploring. Logs confirmed the JavaScript ran, the report resolved to $550,000–$650,000 and Doylestown, displayed the corrected source disclaimer, and continued to the two post-report choices. Stopped there: no name/phone/email, HubSpot submission, or notification. Numeric accuracy remains unvalidated. Production text change shares the pinned editable version; this turn's full-flow test was in the prototype.
