valuation_response = {}; confirmed_attom_id = ""; valuation_address1 = ""; valuation_address2 = ""; valuation_display = "Please enter a complete address in this format: street and unit, city, state ZIP. No estimate or request has been submitted.";
estimate_low = 0; estimate_high = 0; estimate_low_display = ""; estimate_high_display = ""; estimate_area = ""; confidence_label = "";
var input = String(last_utterance || "").trim();
var m = input.match(/^(.*),\s*([^,]+),?\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
if (!m || input.length > 400 || /["\\\x00-\x1f]/.test(input) || !/^\d+[A-Za-z-]*\s+\S+/.test(m[1].trim())) return "invalid";
property_address = input;
city = m[2].trim(); state = m[3].toUpperCase(); property_zip = m[4].slice(0,5);
valuation_address1 = m[1].trim(); valuation_address2 = city + ", " + state + " " + m[4];
valuation_display = "We could not retrieve a property estimate. No request has been submitted in this test.";
