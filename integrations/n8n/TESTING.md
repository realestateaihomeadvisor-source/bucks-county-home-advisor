# TESTING — Bucks Home Advisor

Status: internal draft. Do not publish or connect this document to live lead delivery.

## Verified on 2026-10-11

| Test | Result | Scope |
| --- | --- | --- |
| Valuation validation and fallback suite | 17/17 passed on rerun | Local embedded workflow code |
| Authenticated ATTOM sample through n8n | Passed in earlier runtime checks | Documentation sample, not a Bucks County coverage test |
| Missing webhook authentication | Rejected with 403 in earlier runtime check | Staging webhook |
| Explicit property confirmation | First response hides estimate; confirmed request returns provider values | Earlier n8n runtime check |
| Provider outage | Simulated 503 returns dated 18901 ZIP market context | Earlier n8n runtime check; pin removed afterward |
| Live buyer entry | Buying → free-text area → pre-approval choices → agent introduction | Public widget; synthetic preferences, no contact information |
| Buyer refuses introduction | Refusal acknowledged; no further contact questions appeared | Public widget; delivery systems were not inspected |
| Live renter entry | Renting → long-term → Doylestown → bedrooms → offer to send options | Public widget; synthetic preferences, no contact information |
| Renter chooses Maybe later | Refusal acknowledged; chat ended | Public widget; delivery systems were not inspected |
| Voiceflow project inventory / duplicate | Blocked | Google sign-in callback returned 502; fresh tab remained signed out |
| ATTOM inside duplicated Voiceflow project | Not tested | Copy and server-side API wiring still required |
| Lead delivery to Paul | Not tested | Do this only from isolated testing with outbound agent delivery disabled |

No live calculator, routing, provider connection, lead delivery, or website files changed in this test pass. Buyer/renter tests generated chat transcripts; no email or phone was supplied. Do not claim that no backend event was recorded: only the visible conversation was inspected.

## Isolated Voiceflow setup

1. Inspect project inventory after access is restored; identify live project's version and integrations. Do not choose by version number alone.
2. Reuse a suitable backup or duplicate the live project. Name it **TESTING — Bucks Home Advisor — ATTOM + buyer/renter**.
3. Disable HubSpot creation, emails, agent handoffs, external lead webhooks, and production schedules in the copy before submitting test contact data. A copy may inherit integrations.
4. Keep its project ID out of the production website; use private prototype testing. Record original version and rollback path.
5. Connect the server-side valuation step only after the separate inbound service token is configured. Never put the ATTOM key in the widget or public repository.
6. Run seller/property confirmation, supported and unsupported ZIPs, no-result, timeout, stale data, new lookup variable reset, buyer, renter, consent decline, and contact delivery to Paul. Mark synthetic leads TESTING and exclude them from commercial handoff.

## Buyer and renter changes to build in that copy

| Route | Ask, allowing Skip | Give value before contact | Optional next step |
| --- | --- | --- | --- |
| Buying | Preferred areas; comfortable purchase budget; timing; bedrooms; must-haves; optional pre-approval status | Summarize needs and a search checklist. If a specific address is entered, offer confirmed ATTOM property estimate with source/date and limitations. | Request one local agent introduction |
| Renting | Areas; monthly rent budget; move-in timing; lease length; bedrooms; must-haves; optional pets/parking needs | Summarize search criteria and questions about lease term, utilities, deposits, and availability. | Request help with rental options, only where fulfillment is available |

Do not repeat facts already provided. Do not invent current listings or rental availability. The tested ATTOM endpoint is an AVM, not a rental listing feed, rent estimate, inspection report, or mortgage eligibility engine. Do not infer house defects from an AVM. Do not collect income, credit score, documents, or protected personal attributes for these introductory routes.

The observed renter flow promises to send options; fulfillment was not verified. Replace that promise in testing with a truthful description of the service actually available. The buyer path currently offers an introduction before collecting budget/timing/must-haves.

## Private address register and separate lead record

Proposed storage contract only; no address register has been activated.

| Record | Minimum fields | Purpose |
| --- | --- | --- |
| Valuation request | Server event ID/time; session reference; submitted address; provider-matched address/ID if available; result status; source/date; campaign source if supplied; TESTING flag | Private request history and service analytics. Entering an address does not identify its owner or prove selling intent. |
| Consented contact lead | Lead ID; related request IDs; self-declared role; buyer/seller/renter intent; requested service; name; chosen email or phone; exact opt-in wording/version/time; intended agent recipient; fulfillment status; TESTING flag | A contactable service request sent to Paul for review |
| Agent assignment | Lead ID; one agent ID; assigned time; status | Support exclusivity through a unique active assignment per lead, rather than selling a request to multiple agents |

Treat addresses as private operational data, including addresses that may be publicly listed. Limit access, define retention/deletion behavior, and update customer-facing disclosures before enabling storage. Do not enrich an address with owner contact details or silently convert it into a saleable contact lead.

Lead categories are driven by explicit buttons/choices, not guessed by an LLM:

- `valuation_request`: address entered; private request event, no contact lead.
- `general_agent_introduction`: visitor explicitly asks for an introduction, supplies a contact channel, and agrees to the named sharing purpose.
- `cash_offer_request`: visitor explicitly requests a cash-offer conversation, supplies a contact channel, and agrees to that sharing purpose. This is a request, not a guaranteed offer or validated seller ownership.
- `buyer_help` / `rental_help`: explicit help request with the corresponding contact opt-in.
- `declined` / `withdrawn`: no new handoff; withdrawal prevents pending delivery.

Suggested test copy: “Would you like [named local agent] to contact you about [selected service]? If you choose Yes, we’ll share your contact details and the property/search information you provided with that agent. You can continue without an introduction.” Ask contact details only after Yes. Confirm the actual agent and fulfillment arrangement before using this copy live.

No automatic lead pricing, address resale, agent delivery, or contact enrichment is included. Commercial qualification and pricing should depend on an actual service request and contactability, not just an address.

## Remaining release gates

Restore Voiceflow access; create the clearly labeled isolated project; configure separate inbound authentication; verify Bucks County provider coverage and account display permissions; implement the private register and opt-in routes; verify delivery to Paul with agent delivery disabled; complete end-to-end tests. Keep the production chatbot unchanged until these checks pass.
