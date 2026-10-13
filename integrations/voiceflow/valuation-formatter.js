estimate_low = 0; estimate_high = 0; estimate_low_display = ""; estimate_high_display = ""; estimate_area = ""; confidence_label = "";
valuation_display = "We could not retrieve a property estimate. You can check the address or request a local review. No request has been submitted in this test.";
var r = valuation_response;
if (typeof r === "string") { try { r = JSON.parse(r); } catch (e) { r = {}; } }
if (!r || typeof r !== "object") r = {};
valuation_response = r;
if (r.status === "confirm_property" && r.property && typeof r.property.address === "string" && /^\d+$/.test(String(r.property.attom_id || ""))) {
  confirmed_attom_id = "";
  valuation_display = "Confirm this exact property: " + r.property.address + ". Reply Yes or No. No estimate until you confirm.";
  return "confirm";
}
var e = r.estimate || {};
var age = (Date.now() - Date.parse(String(e.as_of) + "T00:00:00Z")) / 86400000;
if (r.status === "ok" && r.source === "ATTOM" && r.property && String(r.property.attom_id) === String(confirmed_attom_id) && confirmed_attom_id && Number.isFinite(e.low) && Number.isFinite(e.high) && e.low > 0 && e.high >= e.low && /^\d{4}-\d{2}-\d{2}$/.test(e.as_of || "") && Number.isFinite(age) && age >= -1 && age <= 180) {
  estimate_low = e.low; estimate_high = e.high;
  estimate_low_display = "$" + Math.round(e.low).toLocaleString("en-US");
  estimate_high_display = "$" + Math.round(e.high).toLocaleString("en-US");
  estimate_area = r.property.address; confidence_label = "ATTOM automated estimate";
  valuation_display = estimate_area + "\nAutomated estimate: " + estimate_low_display + " – " + estimate_high_display + "\nSource: ATTOM. Estimate date: " + e.as_of + ".\nNot an appraisal. Condition and recent changes may affect the value.\nTesting only — no lead has been created and no agent contacted.";
} else if (r.status === "zip_fallback" && e.kind === "zip_market_context") {
  valuation_display = "A property estimate is unavailable. " + (r.message || "ZIP market context is not a valuation of this property.") + " Testing only — no request has been submitted.";
}
