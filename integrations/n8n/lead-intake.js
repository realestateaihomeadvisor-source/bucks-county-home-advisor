/* Private server-side draft. No network calls or persistent storage. */
function prepareLead(input, options = {}) {
  input = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const clean = (v, max = 200) => {
    if (typeof v !== 'string') return '';
    const s = v.trim();
    return !s || s.length > max || /[{}]|\$\$VAR_/i.test(s) || /^(none|unknown|not_provided|n\/a|null|undefined)$/i.test(s) ? '' : s;
  };
  const oneOf = (v, values) => values.includes(v) ? v : '';
  const now = options.now || new Date().toISOString();
  const testing = options.testing !== false; // Caller must deliberately select production.
  const intent = oneOf(input.intent, ['home_value', 'seller', 'buyer', 'renter']);
  const serviceByIntent = {
    home_value: ['cash_offer', 'professional_home_valuation'],
    seller: ['cash_offer', 'professional_home_valuation'],
    buyer: ['buyer_help'], renter: ['rental_help']
  };
  const service = oneOf(input.requested_service, serviceByIntent[intent] || []);
  const consent = input.consent || {};
  const recipient = clean(consent.recipient);
  const consentAccepted = consent.choice === 'yes' && !consent.withdrawn &&
    !!recipient && !!clean(consent.text_version) && !!clean(consent.text, 1500) &&
    consent.service === service && !!service;
  const contact = input.contact || {};
  const firstname = clean(contact.firstname, 80);
  const rawPhone = clean(contact.phone, 40);
  const digits = rawPhone.replace(/\D/g, '');
  const phone = digits.length === 10 ? '+1' + digits : digits.length === 11 && digits.startsWith('1') ? '+' + digits : '';
  const rawEmail = contact.email_choice === 'yes' ? clean(contact.email, 254).toLowerCase() : '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : '';
  const address = clean(input.property_address);
  const event = {
    event_type: address ? 'valuation_request' : 'advisor_request',
    received_at: now, testing, intent: intent || 'unknown',
    // Do not identify the visitor as the owner of the submitted address.
    role: oneOf(input.role, ['owner', 'buyer', 'renter', 'landlord', 'other']) || 'unspecified',
    status: clean(input.valuation_status, 60) || 'not_requested'
  };
  // Raw-address storage is opt-in to this implementation path, after notices are installed.
  if (address && options.addressLoggingEnabled === true && clean(input.notice_version)) {
    event.submitted_address = address;
    event.notice_version = clean(input.notice_version);
  }
  const preferences = input.preferences || {};
  const context = {};
  for (const key of ['budget', 'move_timing', 'bedrooms', 'must_haves', 'lease_length', 'saved_property']) {
    const value = clean(preferences[key], 500);
    if (value) context[key] = value;
  }
  const blocked = reason => ({status: reason, event, context, contactPayload: null, consentReceipt: null, recipient: null, commercial_handoff: false});
  if (!intent) return blocked('invalid_intent');
  if (!service) return blocked('information_only');
  if (!consentAccepted) return blocked('no_contact_consent');
  if (!firstname || (!phone && !email)) return blocked('contact_incomplete');
  const p = {firstname, lead_type: intent, hs_lead_status: 'NEW'};
  if (phone) p.phone = phone;
  if (email) p.email = email;
  const source = clean(input.lead_source);
  if (source) p.lead_source = source;
  if (intent === 'buyer') {
    const area = clean(input.buyer_area); if (area) p.buyer_area = area;
    const preapproved = oneOf(input.buyer_preapproved, ['yes', 'in_progress', 'not_yet']);
    if (preapproved) p.buyer_preapproved = preapproved;
    p.buyer_help_interest = 'accepted';
  } else if (intent === 'renter') {
    const area = clean(input.renter_area); if (area) p.renter_area = area;
    const timeline = oneOf(input.renter_timeline, ['short_term', 'long_term']);
    const beds = oneOf(input.renter_bedrooms, ['studio_1', '2', '3plus']);
    if (timeline) p.renter_timeline = timeline;
    if (beds) p.renter_bedrooms = beds;
    // HubSpot's verified internal enum is capitalized; Voiceflow's is lowercase.
    p.renter_help_interest = 'Accepted';
  } else {
    if (address) p.property_address = address;
    p.seller_next_step = service;
    const timeline = oneOf(input.seller_timeline, ['asap', 'within_3_months', 'within_6_months', 'just_exploring']);
    if (timeline) p.seller_timeline = timeline;
    // Standard HubSpot city/zip describe a CONTACT'S residence. A searched property
    // must not silently overwrite these fields. No fabricated estimates/confidence.
  }
  return {
    status: testing ? 'testing_ready' : 'ready_for_crm', event, context,
    contactPayload: {properties: p},
    consentReceipt: {choice: 'yes', service, recipient, text_version: consent.text_version,
      text: consent.text.trim(), received_at: now, testing},
    recipient, commercial_handoff: false
  };
}
if (typeof module !== 'undefined') module.exports = {prepareLead};
