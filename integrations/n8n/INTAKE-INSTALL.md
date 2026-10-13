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

## October 13 staging CRM checkpoint

The isolated Voiceflow valuation conversation now passes full Yes, No, no-reply and unsuccessful-lookup previews (see `integrations/voiceflow/README.md`). Its report still ends without a seller service opt-in or CRM transport.

The existing no-write intake draft was imported as a **new inactive** n8n workflow, `TESTING — Bucks advisor intake — NO CRM WRITES`, ID `RsXNcvNSwOPYL7C5`. Its webhook uses the saved `Bucks valuation inbound — TESTING` Header Auth credential rather than the automatically selected provider credential. It has only Webhook → Code payload gate → Respond nodes. It was saved inactive; no webhook request or CRM write has yet been observed through this installed copy. Do not activate it or represent its `testing_ready` response as a saved contact.

The n8n credential called `HubSpot account` is a ten-month-old HubSpot API-key credential and its UI currently says `Couldn’t connect with these settings`. A separate HubSpot OAuth2 credential form was inspected but no OAuth connection was granted or saved. The ChatGPT HubSpot connector separately reports CONTACT and TASK read/write AVAILABLE. Current seller contact properties `lead_type=home_value`, `seller_next_step=professional_home_valuation`, `hs_lead_status=NEW`, `property_address` and `lead_source` exist with the proposed enum values. The synthetic email `bucks-attom-testing-20261013@example.invalid` returned zero existing CONTACT matches. No contact or task was created.

Next, add a deterministic post-report service choice, named Paul-only recipient, contact channel and exact sharing consent in the TESTING Voiceflow path. Decline must end with no CRM call. Validate the no-write harness using its test webhook with accepted, declined, incomplete and withdrawn requests. Only after reviewing the n8n HubSpot OAuth scope and isolating any automations that could notify agents should a separate inactive CRM-write staging path create one synthetic TESTING contact. Require a returned contact ID before claiming saved status; create Paul-owned testing tasks and a Paul-only summary only after their respective API responses. Verify duplicate retry and failure paths. Keep production, existing lead routing, the ATTOM workflow and PR #11 unmerged and unpublished.

### October 13 OAuth and task attempt

A new n8n credential draft, `HubSpot account 2` (HubSpot OAuth2 API), was saved after starting its connection. It is **not connected**. Google sign-in reached HubSpot's consent screen for portal 244308583, which requires 13 permissions. These include contact, company and deal read/write, contact-list write, forms and tickets; the final screen also requires acceptance of n8n's terms and privacy policy. Grant was left pending because these scopes extend beyond contact/task staging. The old `HubSpot account` API-key credential was untouched. Do not attach the new credential to any active workflow or assume it can create tasks.

The connected HubSpot task-create API rejected a request for two Paul-owned TESTING tasks with `Tasks should be associated with at least one CRM object`. Neither task was created. A specific safe association must be chosen before retrying; do not attach test tasks to an unrelated existing contact. The intended tasks are `TESTING — verify seller consent and contact ID` (due 2026-10-14 20:00Z) and `TESTING — verify CRM failure and Paul-only delivery` (due 2026-10-15 20:00Z), owner ID 84884614. No synthetic contact, notification or full CRM transport test has occurred.

### October 13 connected CRM credential and task UI result

After explicit approval of the displayed 13 scopes and n8n terms, a fresh OAuth attempt succeeded. The first callback from the earlier pending session failed with `The OAuth callback state is invalid`; a fresh attempt reached `Connection successful`, and n8n displayed `Account connected`. The separate credential is named `Bucks HubSpot CRM — TESTING OAuth`. It is saved, unassigned to the inactive no-write workflow, and the older API-key credential remains untouched. The broad permissions are a property of n8n's HubSpot OAuth app, not proof that a CRM request has run.

HubSpot's task UI accepted two unassociated Paul-owned To-do tasks even though the connected task-create API had earlier rejected unassociated tasks. Verified task IDs: `406586045133`, `TESTING — verify seller consent and contact ID`, due 2026-10-14 20:00Z; and `406586768104`, `TESTING — verify CRM failure and Paul-only delivery`, due 2026-10-15 20:00Z. Both are NOT_STARTED, owner `84884614`, and have zero associated records. The UI reported `Task created`; a subsequent CRM search returned exactly these two titles and IDs. No contact, notification, or CRM transport write was performed. The 21 local intake tests passed again on this date.

Before a synthetic contact test, complete a deterministic post-report service choice and exact sharing consent in the isolated Voiceflow flow, isolate side-effect paths and automation notifications, and run accepted/declined/withdrawn and failure cases through the installed no-write webhook. Then add a separate inactive CRM-write staging path bound only to the new credential and require a returned contact ID before any success message or Paul-only delivery. Do not activate or deploy the staging workflows until those checks pass.

At the end of this session, the prior isolated Voiceflow editor session had expired. A Google sign-in reached Voiceflow's callback but returned HTTP 502; a fresh tab did not show a signed-in editor. A clean login page was handed to the user. Do not claim a post-report consent change or new Voiceflow preview from this CRM session. The earlier valuation Yes/No/no-reply/no-match preview evidence remains separate.
