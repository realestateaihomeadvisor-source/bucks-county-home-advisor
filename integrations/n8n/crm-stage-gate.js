/* Inactive CRM staging contract. This module performs no network or storage I/O.
 * The caller must load a receipt and reserve an idempotency key in durable storage.
 */
const {NOTICE, identities} = require('./staging-test-contract.js');
function planSyntheticSellerWrite(prepared, storedReceipt, reservation, options = {}) {
  const blocked = reason => ({status: reason, crm_write_allowed: false, notification_allowed: false});
  if (!prepared || prepared.status !== 'testing_ready' || prepared.event?.testing !== true ||
      !prepared.contactPayload?.properties || prepared.consentReceipt?.testing !== true) return blocked('not_testing_ready');
  const receipt = prepared.consentReceipt;
  // The old no-write notice explicitly promises no CRM creation or notification.
  // Never promote that consent into a write, even if it is persisted.
  if (receipt.choice !== 'yes' || receipt.text_version !== NOTICE.text_version ||
      receipt.text !== NOTICE.text || receipt.recipient !== NOTICE.recipient) return blocked('write_notice_not_authorized');
  let identity;
  try { identity = identities(prepared.event); } catch (_) { return blocked('request_identity_unverified'); }
  if (prepared.event.receipt_id !== identity.receipt_id) return blocked('request_identity_unverified');
  if (!storedReceipt || storedReceipt.status !== 'accepted' || storedReceipt.withdrawn !== false ||
      !storedReceipt.id || !storedReceipt.session_id || !storedReceipt.accepted_at ||
      storedReceipt.id !== identity.receipt_id || storedReceipt.session_id !== identity.session_id ||
      storedReceipt.idempotency_key !== identity.idempotency_key ||
      storedReceipt.choice !== 'yes' || storedReceipt.service !== receipt.service ||
      storedReceipt.recipient !== receipt.recipient ||
      storedReceipt.text_version !== receipt.text_version || storedReceipt.text !== receipt.text) {
    return blocked('consent_receipt_unverified');
  }
  const acceptedAt = Date.parse(storedReceipt.accepted_at);
  const now = Date.parse(options.now || new Date().toISOString());
  if (!Number.isFinite(acceptedAt) || !Number.isFinite(now) || acceptedAt > now ||
      now - acceptedAt > 24 * 60 * 60 * 1000) return blocked('consent_receipt_expired');
  if (!reservation || reservation.status !== 'reserved' ||
      reservation.atomic !== true || !reservation.owner_token ||
      reservation.receipt_id !== storedReceipt.id ||
      reservation.idempotency_key !== identity.idempotency_key ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(reservation.idempotency_key || '')) {
    return blocked('idempotency_not_reserved');
  }
  const p = prepared.contactPayload.properties;
  if (prepared.event.intent !== 'seller' || receipt.service !== 'professional_home_valuation' ||
      p.lead_type !== 'seller' || p.seller_next_step !== 'professional_home_valuation' ||
      p.firstname !== identity.firstname || p.email !== identity.email || p.phone) {
    return blocked('not_synthetic_seller_fixture');
  }
  if (options.ownerId !== '84884614' || options.automationsIsolated !== true ||
      options.explicitSyntheticWriteApproval !== true) {
    return blocked('crm_side_effects_not_isolated');
  }
  return {
    status: 'ready_for_synthetic_crm', crm_write_allowed: true, notification_allowed: false,
    idempotency_key: reservation.idempotency_key, receipt_id: storedReceipt.id,
    test_run_id: identity.test_run_id, session_id: identity.session_id,
    properties: {
      firstname: p.firstname, email: p.email, lead_type: 'seller',
      seller_next_step: 'professional_home_valuation', hs_lead_status: 'NEW',
      hubspot_owner_id: options.ownerId, lead_source: 'TESTING — Bucks advisor staging'
    }
  };
}

function verifySyntheticCrmResult(plan, response) {
  const fail = reason => ({status: reason, contact_id: null, notification_allowed: false});
  if (!plan?.crm_write_allowed || plan.status !== 'ready_for_synthetic_crm') return fail('write_not_authorized');
  if (!response || response.verified_by_crm_readback !== true ||
      !['created', 'existing'].includes(response.outcome) ||
      !/^[1-9]\d*$/.test(String(response.contact_id || '')) ||
      response.idempotency_key !== plan.idempotency_key ||
      response.email !== plan.properties.email ||
      response.owner_id !== plan.properties.hubspot_owner_id ||
      !response.properties || response.properties.phone ||
      Object.entries(plan.properties).some(([key,value]) => response.properties[key] !== value)) return fail('crm_result_unverified');
  return {status: 'synthetic_contact_verified', contact_id: String(response.contact_id),
    outcome: response.outcome, notification_allowed: false,
    test_run_id:plan.test_run_id, receipt_id:plan.receipt_id, idempotency_key:plan.idempotency_key};
}

if (typeof module !== 'undefined') module.exports = {planSyntheticSellerWrite, verifySyntheticCrmResult};

