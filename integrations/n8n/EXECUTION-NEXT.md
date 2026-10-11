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
| n8n runtime | Existing instance realestateaiagent.app.n8n.cloud opened; Bucks ATTOM valuation — staging, workflow cG49sE7oQ5Falk6b, visibly Saved and Inactive. Earlier sample/outage responses were not rerun. Webhook currently uses Header Auth account; only that credential exists in its selector. Separate inbound service credential is still pending. |
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
