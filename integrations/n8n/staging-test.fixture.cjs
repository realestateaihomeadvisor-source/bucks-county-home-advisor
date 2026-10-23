'use strict';
const {NOTICE, identities, bindPrepared, receiptFromTableRow} = require('./staging-test-contract.js');
const {prepareLead} = require('./lead-intake.js');
const now = '2026-10-22T22:00:00.000Z';
const context = {test_run_id:'TESTING_20261022_DELIVERY_001',session_id:'TESTING_20261022_DELIVERY_001:session-001',
  handoff_request_id:'2087ff3e-daa3-4a5b-9f18-c4d30c257b86'};
const identity = identities(context);
const input = {intent:'seller',requested_service:'professional_home_valuation',
  contact:{firstname:identity.firstname,email_choice:'yes',email:identity.email},
  consent:{choice:'yes',withdrawn:false,service:'professional_home_valuation',...NOTICE}};
// Existing table column names only. These are LOCAL FIXTURES, not persisted rows.
const tableRow = {receipt_id:identity.receipt_id,session_id:identity.session_id,status:'accepted',
  service:'professional_home_valuation',recipient:NOTICE.recipient,text_version:NOTICE.text_version,
  notice_text:NOTICE.text,accepted_at:now,withdrawn:'false',idempotency_key:identity.idempotency_key,
  crm_contact_id:'',crm_status:'not_attempted'};
function prepared(body = input) {return bindPrepared(prepareLead(body,{testing:true,consentConfig:NOTICE,now}),context);}
const reservation = {status:'reserved',atomic:true,owner_token:'MOCK-ONLY-LEASE-001',
  receipt_id:identity.receipt_id,idempotency_key:identity.idempotency_key};
// Never use these assertions as real approval/isolation/storage evidence.
const mockOptions = {now,ownerId:'84884614',automationsIsolated:true,explicitSyntheticWriteApproval:true};
const safeOptions = {now,ownerId:'84884614',automationsIsolated:false,explicitSyntheticWriteApproval:false};
const mockNotificationApproval = {status:'approved_offline_fixture',test_run_id:identity.test_run_id,
  recipients:['realestateaihomeadvisor@gmail.com','dan@lvhomegroup.com']};
module.exports = {now,context,identity,input,tableRow,prepared,reservation,mockOptions,safeOptions,
  stored:()=>receiptFromTableRow(tableRow),mockNotificationApproval};
