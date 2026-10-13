var r = valuation_response;
if (typeof r === "string") { try { r = JSON.parse(r); } catch (e) { r = {}; } }
var yes = /^yes[.!]?$/i.test(String(last_utterance || "").trim());
confirmed_attom_id = "";
estimate_low = 0; estimate_high = 0; estimate_low_display = ""; estimate_high_display = ""; estimate_area = ""; confidence_label = "";
valuation_display = "Stopped — no property estimate was released, no lead created and no agent contacted. Start a new test if you want to correct the address.";
if (!yes || !r || r.status !== "confirm_property" || !r.property || !/^\d+$/.test(String(r.property.attom_id || "")) || !valuation_address1 || !valuation_address2) { valuation_response = {}; return "declined"; }
confirmed_attom_id = String(r.property.attom_id);
valuation_response = {};
valuation_display = "We could not retrieve a property estimate. No request has been submitted in this test.";
