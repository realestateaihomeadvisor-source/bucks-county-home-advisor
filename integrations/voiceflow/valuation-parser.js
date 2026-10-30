// Normalize presentation only. ATTOM must still match the property and the visitor must confirm it.
valuation_response = {}; confirmed_attom_id = ""; valuation_address1 = ""; valuation_address2 = "";
property_address = ""; city = ""; state = ""; property_zip = "";
valuation_display = "Please enter a complete address: street and unit, city, state and ZIP. Commas are optional when the street ends in a standard type such as St or Rd. No estimate or request has been submitted.";
estimate_low = 0; estimate_high = 0; estimate_low_display = ""; estimate_high_display = ""; estimate_area = ""; confidence_label = "";
var raw = String(last_utterance || "");
if (raw.length > 400 || /["\\\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(raw)) return "invalid";
var input = raw.trim().replace(/[\r\n]+/g, ", ").replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").replace(/(?:,\s*){2,}/g, ", ");
var tail = input.match(/^(.*?)(?:,\s*|\s+)([A-Za-z]{2}|Pennsylvania)\s*,?\s+(\d{5}(?:-\d{4})?)$/i);
if (!tail) return "invalid";
var region = /^pennsylvania$/i.test(tail[2]) ? "PA" : tail[2].toUpperCase();
if (!(" AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY ").includes(" " + region + " ") || /^00000(?:-|$)/.test(tail[3])) return "invalid";
var body = tail[1].replace(/,\s*$/, "").trim();
var street = "", locality = "";
var parts = body.split(/,\s*/);
// A comma before the city is definitive; earlier comma-separated pieces belong to the street/unit.
if (parts.length > 1) {
  locality = parts.pop().trim(); street = parts.join(", ").trim();
  // A comma before a unit alone is not a street/city delimiter: use the same guarded inference below.
  if (/^(?:(?:apt\.?|apartment|unit|suite|ste\.?)(?=\s|\d|$)|#)/i.test(locality)) { street = ""; locality = ""; }
}
if (!street) {
  // Infer only one recognizable street-type boundary. Never guess a missing city, state, or ZIP.
  var boundaries = /\b(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|court|ct|circle|cir|boulevard|blvd|way|terrace|ter|place|pl|parkway|pkwy|highway|hwy|trail|trl)\.?\b/gi;
  var found, candidates = [];
  while ((found = boundaries.exec(body))) {
    var left = body.slice(0, boundaries.lastIndex).replace(/\.$/, "").trim();
    var right = body.slice(boundaries.lastIndex).replace(/^\.?\s*,?\s*/, "");
    var unit = right.match(/^((?:(?:apt\.?|apartment|unit|suite|ste\.?)(?=\s|\d)|#)\s*[A-Za-z0-9-]+)\s*,?\s+(.+)$/i);
    if (unit) { left += " " + unit[1]; right = unit[2]; }
    else if (/^(?:(?:apt\.?|apartment|unit|suite|ste\.?)(?=\s|\d|$)|#)/i.test(right)) continue;
    if (/^\d+(?:-\d+)?[A-Za-z]?\s+\S+\s+\S+/.test(left) && !/^(?:N|S|E|W|NE|NW|SE|SW)\b/i.test(right) && /^[A-Za-z][A-Za-z .'-]*$/.test(right)) candidates.push([left, right]);
  }
  if (candidates.length !== 1) return "invalid";
  street = candidates[0][0]; locality = candidates[0][1];
}
if (!/^\d+(?:-\d+)?[A-Za-z]?\s+\S+/.test(street) || !/^[A-Za-z][A-Za-z .'-]*$/.test(locality) || !/[A-Za-z]/.test(street.replace(/^\d+(?:-\d+)?[A-Za-z]?\s+/, ""))) return "invalid";
city = locality; state = region; property_zip = tail[3].slice(0, 5);
valuation_address1 = street; valuation_address2 = city + ", " + state + " " + tail[3];
property_address = valuation_address1 + ", " + valuation_address2;
valuation_display = "We could not retrieve a property estimate. No request has been submitted in this test.";
