var r = valuation_response;
if (typeof r === "string") { try { r = JSON.parse(r); } catch (e) { r = {}; } }
if (!r || typeof r !== "object") r = {};
var e = r.estimate || {};
var age = (Date.now() - Date.parse(String(e.as_of) + "T00:00:00Z")) / 86400000;
if (r.status === "ok" && r.source === "ATTOM" && r.property && confirmed_attom_id && String(r.property.attom_id) === String(confirmed_attom_id) && Number.isFinite(e.low) && Number.isFinite(e.high) && e.low > 0 && e.high >= e.low && Number(estimate_low) === e.low && Number(estimate_high) === e.high && /^\d{4}-\d{2}-\d{2}$/.test(e.as_of || "") && Number.isFinite(age) && age >= -1 && age <= 180) {
  last_utterance = "";
  return "offer";
}
