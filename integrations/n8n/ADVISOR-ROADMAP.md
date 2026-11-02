# Bucks County AI Home Advisor — architecture and revenue sequence

Updated 2026-10-12. Decision record for the isolated staging work; no production cutover is authorized by this document.

## Product decision

The original Lehigh Valley MVP described a “ChatGPT for Real Estate” that remembers a person's goals, answers buyer/renter/seller questions, and offers a relevant human handoff. The later Bucks master plan narrowed the launch to one seller funnel and the first ten real homeowners. Keep that sequence. A useful open-ended advisor is the product direction; a verified, delivered seller request is the next commercial milestone.

Keep the existing Voiceflow embed as the live conversation front end. Use n8n for private tools, validation, data lookups, consent receipts, CRM delivery, routing and cost limits. The language model and the quality/rights of its data determine answer quality; n8n itself is an orchestration service, not an LLM or a live listing database. Do not replace the live widget or publish the TESTING project to evaluate this architecture.

| Path | Near-term benefit | Added cost / risk | Decision |
| --- | --- | --- | --- |
| Voiceflow alone | Proven visitor interface and existing conversation | Harder to govern external data, retries and multi-partner routing | Keep live while private tools are added. |
| Voiceflow + n8n + ATTOM + HubSpot | Reuse the chat while controlling property matching, records and delivery | Voiceflow subscription/credits, n8n executions, ATTOM calls; integration work | Build the first seller end-to-end proof here. |
| n8n chat as replacement | Custom UI and one orchestration surface | New widget, model API, memory, QA, consent, security and migration; roughly one chat execution per message before extra workflows | Prototype separately only if measured conversion or unit cost justifies it. |

## Verified account baseline, October 12

Voiceflow workspace is Pro. Usage UI shows $60 credits for Oct 11–Nov 11, $1.21 used and $58.79 remaining; auto top-ups checkbox is off. Billing UI shows a $60/month credit bundle plus $50/month editor seats, monthly cycle, next billing date Nov 11, and an Oct 11 paid invoice of $110. Members UI shows 2 of 2 editor seats taken (Paul as owner and one collaborator). These account observations supersede the earlier unknown-credit warning; the earlier “maximum credit consumption” message may have referred to a prior cycle or a temporary limit, but its cause was not established. One live widget reply was observed October 12; full seller report and lead delivery were not proven. Do not buy credits now. Do not remove a collaborator or change a subscription without assessing actual access needs and effect on the live workspace.

n8n plan, executions remaining and ATTOM paid quota/production display rights are still unverified. Do not claim an estimated per-lead cost until these three meters and a measured conversation sample are available. Spend gates: cache repeated property requests with a dated TTL; one provider lookup per confirmed address unless the user changes it; deduplicate submission IDs; cap requests/session and failures; log only needed fields; alert before quotas. Keep secrets server-side. Do not enable auto top-ups or paid tiers as a substitute for a budget.

## Stage gates

### 1. Seller revenue proof

Complete the isolated Voiceflow branch: valid full address → private ATTOM request → matched property shown → exact confirmation → sourced range/date or truthful unavailable response. A model must never invent a price. Then ask whether the visitor wants a human follow-up. Only after a specified service and contact-channel consent: write a TESTING HubSpot record with contact ID and consent receipt, send a Paul-only summary with delivery proof, and show the correct queued/sent/failed status. Test rejection, mismatched property, duplicate retry and transport failures. Check Bucks address coverage and the ATTOM account's customer display rights before public valuation claims. Live widget remains untouched until the whole path is verified. Measure real starts, reports, opt-ins, contactable leads, delivered handoffs, response time and actual revenue separately from tests. Aim for ten real homeowner conversations/leads before broadening acquisition spend; a raw contact is not automatically a paid qualified lead.

### 2. General advisor without a listing feed

Add a concise needs router for sell, buy, rent, finance and home repair. Answer general questions with explicitly dated sources and uncertainty. Remember only useful stated preferences (area, timing, budget range, property needs, decision stage, service requested and preferred channel) with purpose/consent and a deletion path. Ask for email/phone when saving a search, sending an analysis or connecting a professional is useful; support decline and anonymous guidance. Buyer/renter users may provide a property URL/address for explanation, but the assistant must not represent an unlicensed or stale set as “available now.” For mortgage and repairs, provide educational ranges/checklists and refer to a licensed/vetted person on request rather than claiming approval, quotes or guaranteed ROI.

### 3. Licensed current inventory and partner network

Explore Bright MLS/IDX or another authorized listing/rental source with permitted display, refresh, attribution and storage terms. ATTOM AVM, sale history and characteristics do not establish active inventory. Add live property discovery only after a feed contract, coverage, latency and listing-rights checks. Vet each partner and define request-specific routing, response service level, disclosure and CRM owner. Review mortgage/settlement-service compensation and marketing with qualified counsel before charging for referral traffic. Expand to contractors/rentals only when demand, fulfillment and margin are measurable.

## Cost decision rule

Review a weekly unit-cost sheet: Voiceflow subscription and credit debit, n8n plan and executions, ATTOM calls, model/API costs if any, CRM/notifications, qualified delivered requests, partner response and collected revenue. Compare an n8n chat prototype with the same scripted conversations and actual usage. Migrate the front end only if it improves visitor outcomes or total monthly cost enough to cover migration and maintenance. The current $110 Voiceflow recurring charge merits a seat audit before Nov 11, but current usage does not justify buying more credits. A credit balance is not free capacity: the bundle is already paid monthly.

## Open decisions for Paul after a working seller proof

1. Confirm the primary human recipient and response commitment for Bucks seller requests (Paul first in TESTING; Dan or other partners only after an explicit arrangement).
2. Decide whether the second Voiceflow editor still needs edit access before renewal; leave current access in place until then.
3. Choose the next demand signal from real conversations: buyer search, rent, mortgage introduction or repair/sell-as-is guidance. Build the winner, not all four at once.

Sources of project intent: `Lehigh_Valley_AI_Real_Estate_MVP_Master_Spec_V4.pdf` (March 4) and `Bucks_County_AI_Master_Document_V4.pdf` (March 14), plus current staging checkpoints. Public vendor/legal source checks were performed October 12; recheck pricing, data contracts and rules before committing spend or commercial arrangements.
