# Voiceflow greeting change — 2026-10-11

Project: Bucks County Home Advisor V12 - UTM. Website project ID: `6a97385ba2e6e60fee4143bd`; explicit version ID: `6a97385ba2e6e60fee4143be`.

Changed only the Router agent instructions:
- Greeting before: “Hey there 👋” / “What brings you here today?”
- Greeting after: “Hi 👋 I can help you explore your home’s value or your next move.” / “What would you like help with?”
- Button order before: Buying, Selling, Renting, What's my home worth?
- Button order after: What's my home worth?, Selling, Buying, Renting.

All routing keywords, exit conditions, entry_type assignments, contact tools, and downstream steps are unchanged. Rollback: restore the two original greeting messages and original button order in Router.

Verified in the Voiceflow prototype: revised greeting and four buttons rendered; home-value selection navigated to Seller Address and asked for the full property address. No contact information submitted and no lead delivery tested.

Important deployment behavior: the live website pins an explicit editable version. A fresh live website visit displayed the updated greeting without pressing Publish. Treat future edits in this project as potentially live; use an isolated copy or a published-version configuration before larger experiments. The homepage code changes in this branch have not been merged or deployed.

Separate finding needing investigation: Seller Mini Report agent instructions contain a default $320,000–$520,000 baseline and multipliers. The canvas also contains a JavaScript Calculate Seller Mini Report step. The active calculation/data source has not yet been traced; do not assume the instructions prove the complete live valuation method. Verify before changing valuation logic or claiming comparable-sales accuracy.
