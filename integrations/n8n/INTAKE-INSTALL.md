# Advisor intake draft — installation and release checks

This is tested code and a mock-only n8n import, not a deployed integration. It uses existing HubSpot fields verified through the connected account on 2026-10-11. No new subscriptions, lead sales, CRM records, agent messages, or address-register persistence are included.

## Confirmed defect and mapping

| Voiceflow value | HubSpot buyer_help_interest | HubSpot renter_help_interest |
| --- | --- | --- |
| accepted | accepted | Accepted |
| maybe_later | maybe_later | Maybe later |

The downloaded V12 test copy's Renter Agent Offer stores lowercase `accepted` and its Create Initial HubSpot Renter Contact sends that variable unchanged. The live HubSpot property's verified internal value is capitalized `Accepted`. Fix this in the test copy before the CRM call. The draft normalizer maps explicit rental opt-in correctly. Declines produce no CRM payload, so a Maybe later contact is not created.

The current Voiceflow buyer/renter copy also creates the contact immediately after the phone and shows its follow-up notice afterward. In testing, move the actual opt-in before the create step. Provide guidance before asking for contact, allow an email-only path, and avoid reporting a successful lead delivery if the CRM call failed.

## Test harness

Run `python integrations/n8n/build-intake-workflow.py` and `node integrations/n8n/lead-intake.test.cjs`. Import `lead-intake.testing.workflow.json` as a **new** n8n workflow, leave inactive, bind a private inbound Header Auth credential, and run only its test webhook. It has no HTTP Request, CRM, Gmail, or agent-delivery nodes. The response explicitly says `crm_write_performed: false`; it lists field names without echoing contact details. This tests construction only, not HubSpot acceptance.

The existing Voiceflow TESTING copy inherits CRM API steps and Gmail. Before connecting this harness or testing contact entry, replace those side-effect paths with the harness/mocks and remove outbound tools from its final-message agent. Do not disconnect workspace-wide integrations used by production. Do not publish the copy or replace the website's project ID.

## Input contract

`prepareLead` takes a server-side request with `intent` (seller, home_value, buyer, renter), explicit `requested_service`, optional `property_address`, the existing route-specific fields, and `contact`. Contact contains `firstname`, `phone` and/or `email`, with `email_choice: yes` only if email was selected. Either a valid email or a US phone is sufficient; an old email is omitted after No. A `preferences` object retains budget, move_timing, bedrooms, must_haves, lease_length and saved_property as bounded private context, rather than posting nonexistent HubSpot fields.

`consent` contains `choice: yes`, the exact service, actual intended recipient, displayed text and its version. Withdrawal or another answer blocks a payload. Persist this receipt server-side with a lead ID after storage is configured. A free-text LLM answer must not itself set consent: use an explicit deterministic choice and server-controlled notice/recipient values. Protect the webhook with a separate service credential; do not expose keys to the browser. The normalizer cannot prove what a visitor actually saw; the Voiceflow UI and trusted server must supply that evidence.

Address events are separate from contact payloads. Raw-address recording is off by default; enable only after the private store, customer notice, retention and deletion behavior are installed. An address never proves ownership or seller intent. Buyer searches must not overwrite HubSpot's standard city/zip contact-residence fields. No fabricated valuation numbers or unsupported confidence dropdown values are sent by this draft.

## Actual CRM test still needed

At inspection time, HubSpot CONTACT reads were AVAILABLE but writes were REQUIRES_REAUTHORIZATION. The existing Voiceflow OAuth connection may differ; its health was not verified. After access and test isolation are available, submit one explicitly TESTING contact per route, with synthetic details and all agent-delivery workflows disabled. Verify correct enums, optional email, source, privacy receipt, CRM success ID and failure messages. Only then connect a real transport. Use exact known contact IDs for updates; never identify a person by property address alone. Do not retry creation blindly after an ambiguous timeout.

Assignment and exclusivity need a persistent one-agent-per-lead record before commercial delivery. This draft sets commercial_handoff false even outside test mode. Send any enabled operational notifications to Paul first; no Dan notifications are part of this change.

## Low-cost implementation order

1. Fix enum mapping and consent ordering in TESTING; run the mock intake contract and a real CRM test after isolation.
2. Install the server-side ATTOM confirmation route already in the valuation draft, with separate inbound credentials and account display/coverage checks.
3. Add short buyer/renter guidance and preferences using `intake-prompts.json`; create the listed new variables in TESTING and map them to private preferences context. Never invent listings, rent prices, house defects, loan eligibility, or instant cash offers.
4. Offer optional “Save this home” / “Compare another home” using a user-supplied address or link. Store interest as interest, not an offer or proof of ownership; do not add a paid listing feed until usage warrants it.
5. After cutover, measure chatbot starts, useful reports, explicit help requests, consented contacts and successful delivery. Keep Dan's follow-up outside this scope. Traffic remains the next growth bottleneck; a CRM fix alone does not create demand.
