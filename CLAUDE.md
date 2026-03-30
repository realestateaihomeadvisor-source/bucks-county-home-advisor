# Bucks County Home Advisor — Project Context for Claude

## Read this at the start of every session before touching any code.

---

## What This Project Is
AI-powered seller lead generation site for Bucks County, PA homeowners.
Live at: buckscountyhomevaluenow.com
Revenue model: Sell qualified seller leads to local agents at $200–500/lead.

---

## Tech Stack
- **Site**: Single file — `index.html` (all HTML, CSS, JS in one file)
- **Hosting**: GitHub Pages (primary) / Netlify (backup)
- **Chatbot**: Voiceflow — Project ID: `69c64d82ea3646d26e12d74d`
- **CRM**: HubSpot (free plan) — OAuth connected via Voiceflow native integration
- **DNS**: Namecheap → buckscountyhomevaluenow.com

---

## The Only File That Matters
`index.html` in the root of this repo is the entire site.
Always edit this file. Never create separate CSS or JS files.

---

## Voiceflow Embed Rules (CRITICAL)
- Widget source: `https://cdn.voiceflow.com/widget/bundle.mjs`
- Project ID: `69c64d82ea3646d26e12d74d`
- Always include `userID: Date.now().toString()` — this resets the session for every visitor
- Render mode: `embedded` targeting div `id="vf-chat-embed"`
- The inner widget has a blue header bar that must be hidden — see BUG_LOG.md

---

## Brand & Design
- Primary color: Forest green `#2c4a3e`
- Accent: Gold `#c9973a`
- Background: Cream `#f8f4ee`
- Fonts: Playfair Display (headings) + DM Sans (body)
- Nav button: Gold background, white text — NOT forest green
- Widget title: "Bucks County Home Advisor"

---

## Legal Requirements (Never Remove)
- All estimates must be framed as "AI-generated using public market data"
- Never use words: appraisal, official valuation, broker price opinion
- Disclaimer must appear near chatbot AND in footer
- STOP opt-out language must appear in chatbot before conversation ends
- This platform is a lead generation tool, NOT a licensed brokerage

---

## HubSpot Integration
- Native Voiceflow → HubSpot "Create Lead" tool in Contact Capture block
- Fields mapped: firstname, phone, city, state
- Free plan — Workflows are locked, use built-in notification settings instead
- OAuth must stay connected — check if leads stop flowing

---

## How Paul Works Best
- One clear action at a time
- Exact click-by-click instructions
- Screenshot confirmation before moving to next step
- All fixes in one production-ready file per deploy
- Never contradict previously settled decisions
- Never confuse the two Voiceflow projects — only `69c64d82ea3646d26e12d74d` is correct

---

## Current Status (as of March 30, 2026)
- HubSpot integration: WORKING ✅
- Session reset: WORKING ✅
- Nav button color: WORKING ✅
- Blue banner on widget: UNRESOLVED ⚠️ — see BUG_LOG.md
- GitHub repo: CONNECTED ✅
- Netlify: Temporarily out of credits

---

## Next Priorities
1. Fix blue widget banner permanently
2. Connect GitHub to hosting (GitHub Pages or Netlify)
3. Reach out to 2–3 local Bucks County agents, offer first leads free
4. Capture first 10 real homeowner leads
