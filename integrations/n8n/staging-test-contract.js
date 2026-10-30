'use strict';
// LOCAL, OFF-NETWORK contract. No transport, persistence, or delivery implementation.
// These fixed destinations are a proposal, NOT evidence of permission to send.
const NOTICE = Object.freeze({
  recipient: 'Paul at Bucks County Home Advisor and Dan Witt at LV Home Group',
  text_version: 'bucks-synthetic-crm-delivery-v2',
  text: 'TEST ONLY — no follow-up needed. May we create one clearly labeled synthetic HubSpot contact and email a test notification to Paul at realestateaihomeadvisor@gmail.com and Dan Witt at dan@lvhomegroup.com about the selected professional home valuation service? No real customer is requesting help. Choose Yes only for this synthetic test; No or Skip will create no contact and send no notification.'
});
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function identities(context) {
  if (!context || !/^TESTING_[A-Z0-9_]{1,50}$/.test(context.test_run_id || '') ||
      !UUID.test(context.handoff_request_id || '') ||
      !String(context.session_id || '').startsWith(context.test_run_id + ':') ||
      !/^TESTING_[A-Z0-9_]+:[a-z0-9-]{1,50}$/.test(context.session_id)) throw new Error('invalid_test_identity');
  return {
    test_run_id: context.test_run_id, session_id: context.session_id,
    handoff_request_id: context.handoff_request_id,
    receipt_id: `consent:${context.test_run_id}:${context.handoff_request_id}`,
    idempotency_key: context.handoff_request_id,
    email: `bucks-test-${context.handoff_request_id}@example.invalid`,
    firstname: `TESTING ${context.test_run_id.slice(8)}`
  };
}
// Call with an authenticated server-owned event context, NEVER body-selected IDs.
function bindPrepared(prepared, serverContext) {
  const i = identities(serverContext);
  return {...prepared, event: {...prepared.event, test_run_id: i.test_run_id,
    session_id: i.session_id, handoff_request_id: i.handoff_request_id, receipt_id: i.receipt_id}};
}
// Adapt ONLY the existing receipt-table columns. String "false" is not Boolean false.
// This schema conversion is not evidence of a real displayed/clicked receipt.
function receiptFromTableRow(row) {
  if (!row || row.status !== 'accepted' || !['false','true'].includes(row.withdrawn) ||
      !row.receipt_id || !row.session_id || !row.notice_text || !row.accepted_at) return null;
  return {id:row.receipt_id, session_id:row.session_id, status:row.status,
    service:row.service, recipient:row.recipient, text_version:row.text_version,
    text:row.notice_text, accepted_at:row.accepted_at, withdrawn:row.withdrawn === 'true',
    choice:'yes', idempotency_key:row.idempotency_key};
}
function notificationPreview(plan, verified, approval) {
  const blocked = reason => ({status:reason, transport:'local_preview_only',
    notification_allowed:false, notification_sent:false, recipients:[]});
  if (!plan?.crm_write_allowed || verified?.status !== 'synthetic_contact_verified' ||
      verified.idempotency_key !== plan.idempotency_key || verified.receipt_id !== plan.receipt_id ||
      verified.test_run_id !== plan.test_run_id) return blocked('crm_result_unverified');
  const expected = ['realestateaihomeadvisor@gmail.com','dan@lvhomegroup.com'];
  if (approval?.status !== 'approved_offline_fixture' || approval.test_run_id !== plan.test_run_id ||
      JSON.stringify(approval.recipients) !== JSON.stringify(expected)) return blocked('operator_approval_pending');
  return {status:'notification_preview_only',transport:'local_preview_only',
    notification_allowed:false, notification_sent:false,
    recipients:expected, notification_key:`${plan.idempotency_key}:notification:v1`,
    subject:`TEST ONLY — no follow-up needed — ${plan.test_run_id}`,
    body:`Synthetic integration check only. No real customer or property is requesting help.\nService: professional_home_valuation\nTest run: ${plan.test_run_id}\nHandoff: ${plan.idempotency_key}\nReceipt: ${plan.receipt_id}\nHubSpot test contact: ${verified.contact_id}\nDo not follow up with this contact; exclude it from leads, conversions and revenue.`};
}
module.exports = {NOTICE, identities, bindPrepared, receiptFromTableRow, notificationPreview};
