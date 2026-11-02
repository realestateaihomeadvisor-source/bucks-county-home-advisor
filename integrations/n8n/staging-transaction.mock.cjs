'use strict';
// Demonstration oracle ONLY: an in-process Map is not durable production storage.
// Every adapter below is a local mock. No HTTP/CRM/mail libraries are imported.
const {planSyntheticSellerWrite,verifySyntheticCrmResult} = require('./crm-stage-gate.js');
const {notificationPreview} = require('./staging-test-contract.js');
class OfflineTransaction {
  constructor() {this.journal=new Map();this.count={creates:0,reads:0,notificationAttempts:0};}
  async run(f, mode='success') {
    const key=f.identity.idempotency_key;
    const plan=planSyntheticSellerWrite(f.prepared(),f.stored(),f.reservation,f.mockOptions);
    if(!plan.crm_write_allowed) return plan;
    const binding=JSON.stringify({test_run_id:plan.test_run_id,session_id:plan.session_id,
      receipt_id:plan.receipt_id,idempotency_key:plan.idempotency_key,properties:plan.properties});
    const prior=this.journal.get(key);
    if(prior) {
      if(prior.binding!==binding) return {status:'idempotency_conflict',notification_sent:false};
      return {...prior.response,status:prior.state==='complete'?'replay':prior.state};
    }
    // This synchronous reservation models atomic acquisition within ONE process only.
    const entry={state:'pending',binding,response:{contact_id:null,notification_sent:false}};
    this.journal.set(key,entry);
    await Promise.resolve(); // Allow a concurrent duplicate to see pending.
    const currentPlan=()=>planSyntheticSellerWrite(f.prepared(),f.stored(),f.reservation,f.mockOptions);
    const stillAuthorized=()=>{
      const p=currentPlan();
      return p.crm_write_allowed && JSON.stringify({test_run_id:p.test_run_id,session_id:p.session_id,
        receipt_id:p.receipt_id,idempotency_key:p.idempotency_key,properties:p.properties})===binding;
    };
    if(!stillAuthorized()) {entry.state='consent_blocked';return {status:entry.state,...entry.response};}
    this.count.creates++;
    if(mode==='crm_timeout'||mode==='crm_5xx'||mode==='crm_409'||mode==='crm_429') {
      entry.state='crm_reconciliation_required'; return {status:entry.state,...entry.response};
    }
    if(mode==='crm_400') {entry.state='crm_rejected';return {status:entry.state,...entry.response};}
    this.count.reads++;
    const readback={outcome:'created',contact_id:'9000000001',idempotency_key:key,
      email:mode==='readback_mismatch'?'wrong@example.invalid':plan.properties.email,
      properties:{...plan.properties},
      owner_id:plan.properties.hubspot_owner_id,verified_by_crm_readback:true};
    const verified=verifySyntheticCrmResult(plan,readback);
    if(verified.status!=='synthetic_contact_verified') {
      entry.state='crm_reconciliation_required';return {status:entry.state,...entry.response};
    }
    entry.response.contact_id=verified.contact_id;
    await Promise.resolve(); // Model a fresh consent check at the send boundary.
    if(!stillAuthorized()) {entry.state='consent_blocked';return {status:entry.state,...entry.response};}
    const preview=notificationPreview(plan,verified,f.mockNotificationApproval);
    if(preview.status!=='notification_preview_only') {
      entry.state='notification_blocked';entry.response={...entry.response,contact_id:verified.contact_id};
      return {status:entry.state,...entry.response};
    }
    // Record attempt before crossing a hypothetical side-effect boundary.
    // No message is actually sent; this counter is a mock call count.
    this.count.notificationAttempts++;
    entry.response={contact_id:verified.contact_id,notification_sent:false,
      notification_status:mode==='notification_timeout'?'unknown':'mock_provider_accepted_not_delivered',preview};
    entry.state=mode==='notification_timeout'?'notification_reconciliation_required':'complete';
    return {status:entry.state,...entry.response};
  }
}
module.exports={OfflineTransaction};
