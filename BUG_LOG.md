# Bug Log — Bucks County Home Advisor

## How to use this file
Before fixing anything, check here first.
After fixing anything, add it here so we never repeat it.

---

## April 1, 2026 — FIXED: Chatbot greeting not auto-firing

PROBLEM: Widget showed blank splash screen with "Start New Chat" button.
Greeting would not fire automatically on page load.

ROOT CAUSE: autostart was set to false in the Voiceflow embed script.

FIX: Changed autostart: false → autostart: true in index.html

DO NOT CHANGE autostart TO false. Ever. This breaks the greeting.

## 🔴 OPEN BUGS

### BUG-001: Blue "Your AI agent" banner inside Voiceflow widget
**Status**: UNRESOLVED  
**What it looks like**: A blue bar appears inside the chatbot card showing "Your AI agent" branding  
**Root cause**: Voiceflow renders this from their servers inside a shadow DOM. The title "Your AI agent" is set in the Voiceflow project's publish settings and cannot be fully overridden via embed code on the free plan.  
**Attempts made**:
- Switched widget URL from `widget-next/bundle.mjs` to `widget/bundle.mjs` — did not fix
- Added CSS targeting `[class*="Header"]` — did not reach shadow DOM
- Added JS to inject styles into shadow DOM — partially worked in one session, stopped working after redeploy
- Negative margin clip approach (`margin-top: -58px`) — untested on live site  
**Most promising fix**: The clip/overflow approach — hide the blue bar by pushing the widget up inside an `overflow:hidden` container so the bar is physically cut off above the visible area  
**Note**: Paul confirmed this WAS fully fixed in a previous session via HTML alone. That exact file has been lost. Recover by testing the clip approach.

---

## ✅ RESOLVED BUGS

### BUG-002: HubSpot not receiving leads
**Status**: RESOLVED ✅ (March 28, 2026)  
**What happened**: HubSpot OAuth disconnected silently. The "Create Lead" tool showed red "HubSpot is not connected" in Voiceflow.  
**Fix**: Clicked "Connect" button inside the HubSpot integration tool in the Contact Capture block. Re-authorized OAuth. Republished Voiceflow.  
**Confirmed working**: Test lead "Jim" appeared in HubSpot with name and phone populated.

### BUG-003: Chat session not resetting between visitors
**Status**: RESOLVED ✅  
**What happened**: Browser cached the previous conversation so new visitors saw old chat history.  
**Fix**: Added `userID: Date.now().toString()` to the Voiceflow embed config. This generates a unique session ID on every page load.  
**Never remove this line from the embed code.**

### BUG-004: "Get My Estimate" nav button invisible
**Status**: RESOLVED ✅  
**What happened**: Button was forest green on a cream/light nav background — blended in and was hard to see.  
**Fix**: Changed button to gold background (`#c9973a`) with white text. Added `!important` to color to prevent override.

### BUG-005: Netlify deploy credits being consumed
**Status**: RESOLVED ✅ (workaround)  
**What happened**: Paul was accidentally dropping files into Netlify's AI Agent area instead of the deploy drop zone, consuming credits.  
**Fix**: Always drop files into the lower deploy box labeled "Drag and drop your site folder here" — NOT the top AI agent area.  
**Long term fix**: Connect GitHub to Netlify for automatic deploys — no drag and drop needed.

### BUG-006: Wrong Voiceflow project being edited
**Status**: RESOLVED ✅ (awareness fix)  
**What happened**: Two Voiceflow projects exist. Edits were being made to the wrong one repeatedly.  
**Fix**: Only ever use project ID `69c64d82ea3646d26e12d74d` — "Bucks County Home Advisor". Ignore any other project.

---

## Deployment Rules (Never Break These)
- Windows renames repeated downloads: `index.html` → `index (2).html` — always use a fresh empty folder
- Drag individual FILES into Netlify, never the folder
- If rename dialog appears, click "Deploy without renaming"
- Always test in incognito window after deploying
