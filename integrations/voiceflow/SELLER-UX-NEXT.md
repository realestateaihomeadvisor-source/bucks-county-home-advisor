# Seller conversation: focused TESTING revision

Status: proposed for the isolated Voiceflow TESTING project only. No canvas change, production publish, CRM write, or notification is established by this document. The user's October 14 mobile preview screenshots showed the existing seller route collecting address, bedrooms, bathrooms, square footage and timeline before a $405,000–$475,000 **preliminary ZIP-based starting range**, followed by Cash Offer and Professional Home Valuation buttons. That range explicitly said recent comparable sales had not been verified; the screenshot is not evidence of an ATTOM property valuation or accuracy for that address. Do not store the submitted personal address in fixtures or PR notes.

## Target customer path

1. Ask for the property address. Confirm an exact ATTOM match before releasing an ATTOM range. If an exact match is unavailable, state that a property-specific estimate is unavailable. ZIP context may be shown only as a broad area benchmark with its source/date, never as the home's value.
2. Show the result in a short first message: the range, source/date and “Starting estimate, not an appraisal.” Give optional “How was this estimated?” detail below it. Keep the no-lead/no-agent disclosure in TESTING. Do not claim recent comparable sales were verified unless that is actually supported.
3. Ask one next-step question with three buttons: **Explore a Cash Offer**, **Request a Professional Home Valuation**, **Not now**. Persist the exact selected service. Cash offer is an exploration request, not a promised offer. The professional valuation is a request for a local review, not an appraisal.
4. When a service is selected, ask once: “Would you like us to share your name and preferred contact method with Paul at Bucks County Home Advisor so he can follow up about [selected service]?” Buttons: **Yes, continue** and **No thanks**. In TESTING, explicitly explain that no real request is being sent. Save a server-side consent receipt tied to the exact displayed notice, service, visitor session and choice; do not accept the request body's own assertion as proof that the notice was displayed. No, timeout and withdrawal end without contact submission.
5. After Yes, ask **How should Paul reach you? Text, call, or email?** Then ask for first name and only the chosen contact detail, one field at a time. Validate the contact channel, show a correction prompt for invalid input, and offer a graceful exit. Do not require a comma-separated name/email answer or an extra, repeated Yes. Do not capture a real visitor's details during isolated tests.
6. Submit through the authenticated staging intake and durable idempotency gate. A success message must require the actual outcome: stored consent, a matching CRM contact ID/read-back, and confirmed notification if it promises agent follow-up. A timeout, duplicate ambiguity or downstream error gets a neutral “I couldn't confirm the request was delivered” message with a safe retry/status path; it must never invent a contact or notification. Distinguish contact saved from agent notified when those results differ.

For an ATTOM property match, bedrooms/bathrooms/square footage can be optional refinements **after** the initial result. If those fields are genuinely required by the ZIP fallback formula, preserve their existing route for that fallback and label it a broad estimate; do not silently imply ATTOM or verified comps. Ask timeline after service selection only if it helps Paul prioritize the chosen request, and make “Not sure” available.

## Small changes to test first

- Replace the repeated post-report “Would you like Paul to follow up?” Yes and later separate sharing Yes with the selected-service button followed by the single, explicit consent prompt. This removes one extra decision while preserving consent.
- Keep the two useful next-step buttons and add a neutral “Not now” exit.
- Shorten filler such as “Perfect, that's helpful to know!” and “Got it. One sec...” when it creates delay between the last detail and the report. Keep one clear progress message only while a provider call is actually pending.
- If only a ZIP-based range is available, use “Broad area starting range” rather than a property-specific price claim. Do not use a similar-looking number as evidence that the property match succeeded.
- Phone-first lead capture can present **Text** and **Call** prominently, with **Email** as a legitimate alternative. Ask for the channel the visitor chose and validate it.

## Acceptance in the isolated project

Run complete visitor previews from Start for exact ATTOM Yes/No/timeout/no-match, then service choice Cash/Professional/Not now; consent Yes/No/timeout; valid/invalid contact; API timeout; duplicate retry; and HubSpot/notification failure. Observe the actual visitor wording, webhook execution, stored receipt, CRM ID and delivery result separately. Measure completion at report, next-step selection, consent, valid contact and confirmed CRM write before judging conversion. Keep existing production seller routing and lead records untouched, n8n staging inactive, and PR #11 draft until Paul tests and approves the cutover.
