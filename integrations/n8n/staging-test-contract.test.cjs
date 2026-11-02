'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const f=require('./staging-test.fixture.cjs');
const {NOTICE,identities,bindPrepared,receiptFromTableRow,notificationPreview}=require('./staging-test-contract.js');
const {planSyntheticSellerWrite:plan,verifySyntheticCrmResult:verify}=require('./crm-stage-gate.js');
const {prepareLead}=require('./lead-intake.js');
const {OfflineTransaction}=require('./staging-transaction.mock.cjs');
const clone=x=>structuredClone(x);
const good=()=>plan(f.prepared(),f.stored(),f.reservation,f.mockOptions);
function verified(p=good()) {return verify(p,{outcome:'created',contact_id:'9000000001',
  idempotency_key:p.idempotency_key,email:p.properties.email,owner_id:p.properties.hubspot_owner_id,
  properties:{...p.properties},verified_by_crm_readback:true});}
test('new gate binds exact current receipt/session/request',()=>{
  assert.equal(good().crm_write_allowed,true);
  for(const delta of [{id:'different'},{session_id:'different'},{idempotency_key:'different'}])
    assert.equal(plan(f.prepared(),{...f.stored(),...delta},f.reservation,f.mockOptions).crm_write_allowed,false);
});
test('same identity is stable across retries; new request creates distinct receipt/email',()=>{
  assert.deepEqual(identities(f.context),f.identity);
  const fresh=identities({...f.context,handoff_request_id:'3187ff3e-daa3-4a5b-9f18-c4d30c257b86'});
  assert.notEqual(fresh.receipt_id,f.identity.receipt_id);assert.notEqual(fresh.email,f.identity.email);
});
test('no-write v1 consent cannot authorize CRM even with a matching stored row',()=>{
  const oldNotice={recipient:'Paul at Bucks County Home Advisor',text_version:'bucks-testing-seller-v1',
    text:'TESTING ONLY: May we share your name and chosen contact method with Paul at Bucks County Home Advisor about the service you selected? This test will not create a contact or notify Paul.'};
  const input=clone(f.input);Object.assign(input.consent,oldNotice);
  const p=bindPrepared(prepareLead(input,{testing:true,consentConfig:oldNotice,now:f.now}),f.context);
  assert.equal(plan(p,{...f.stored(),...oldNotice},f.reservation,f.mockOptions).status,'write_notice_not_authorized');
});
test('current pending approval and unverified isolation always block',()=>{
  assert.equal(plan(f.prepared(),f.stored(),f.reservation,f.safeOptions).crm_write_allowed,false);
  for(const key of ['automationsIsolated','explicitSyntheticWriteApproval'])
    assert.equal(plan(f.prepared(),f.stored(),f.reservation,{...f.mockOptions,[key]:false}).crm_write_allowed,false);
});
test('existing table columns map strictly; fixture_unverified/ambiguous withdrawn are rejected',()=>{
  assert.equal(receiptFromTableRow(f.tableRow).withdrawn,false);
  assert.equal(receiptFromTableRow({...f.tableRow,withdrawn:'true'}).withdrawn,true);
  for(const delta of [{withdrawn:''},{withdrawn:false},{withdrawn:'False'},{status:'fixture_unverified'},{receipt_id:''}])
    assert.equal(receiptFromTableRow({...f.tableRow,...delta}),null);
});
test('raw table row is not silently treated as a normalized receipt',()=>{
  assert.equal(plan(f.prepared(),f.tableRow,f.reservation,f.mockOptions).crm_write_allowed,false);
});
test('No/skip/cancel/withdrawn/incomplete produce zero contact payload',()=>{
  for(const choice of ['no','skip','cancel']) {
    const b=clone(f.input);b.consent.choice=choice;assert.equal(f.prepared(b).contactPayload,null);
  }
  const b=clone(f.input);b.consent.withdrawn=true;assert.equal(f.prepared(b).contactPayload,null);
  const c=clone(f.input);delete c.contact.email;assert.equal(f.prepared(c).contactPayload,null);
});
test('withdrawal, expiry, future timestamp, mismatched notice or service fail closed',()=>{
  for(const delta of [{withdrawn:true},{withdrawn:undefined},{accepted_at:'2026-10-20T00:00:00Z'},
    {accepted_at:'2026-10-23T00:00:00Z'},{text:'changed'},{service:'buyer_help'}])
    assert.equal(plan(f.prepared(),{...f.stored(),...delta},f.reservation,f.mockOptions).crm_write_allowed,false);
});
test('check-then-insert is not represented as an atomic reservation',()=>{
  for(const delta of [{atomic:false},{owner_token:''},{status:'used'},{idempotency_key:'other'}])
    assert.equal(plan(f.prepared(),f.stored(),{...f.reservation,...delta},f.mockOptions).crm_write_allowed,false);
});
test('contact substitution and real/phone contact are rejected',()=>{
  for(const delta of [{email:'another@example.invalid'},{email:'realestateaihomeadvisor@gmail.com'},
    {firstname:'TESTING another'},{phone:'+12155550100'}]) {
    const p=f.prepared();Object.assign(p.contactPayload.properties,delta);
    assert.equal(plan(p,f.stored(),f.reservation,f.mockOptions).crm_write_allowed,false);
  }
});
test('buyer/renter input shape is supported by intake but blocked by seller-only CRM gate',()=>{
  for(const [intent,service,field,value] of [['buyer','buyer_help','buyer_help_interest','accepted'],
    ['renter','rental_help','renter_help_interest','Accepted']]) {
    const b=clone(f.input);b.intent=intent;b.requested_service=service;b.consent.service=service;
    const p=f.prepared(b);assert.equal(p.contactPayload.properties[field],value);
    assert.equal(plan(p,{...f.stored(),service},f.reservation,f.mockOptions).crm_write_allowed,false);
  }
});
test('CRM verification requires every approved mapped field, not only ID/email/owner',()=>{
  const p=good();assert.equal(verified(p).status,'synthetic_contact_verified');
  const raw={outcome:'created',contact_id:'9000000001',idempotency_key:p.idempotency_key,
    email:p.properties.email,owner_id:p.properties.hubspot_owner_id,properties:{...p.properties},verified_by_crm_readback:true};
  for(const field of Object.keys(p.properties)) {
    const changed=clone(raw);changed.properties[field]='wrong';assert.equal(verify(p,changed).contact_id,null);
  }
});
test('notification preview needs same CRM receipt/request and exact approved fixture recipients',()=>{
  const p=good(),v=verified(p);
  assert.equal(notificationPreview(p,v,null).status,'operator_approval_pending');
  assert.equal(notificationPreview(p,{...v,idempotency_key:'different'},f.mockNotificationApproval).status,'crm_result_unverified');
  assert.equal(notificationPreview(p,v,{...f.mockNotificationApproval,recipients:['dan@lvhomegroup.com']}).status,'operator_approval_pending');
  const preview=notificationPreview(p,v,f.mockNotificationApproval);
  assert.equal(preview.notification_sent,false);assert.equal(preview.notification_allowed,false);
  assert.match(preview.subject,/TEST ONLY — no follow-up needed/);
});
test('sequential retry replays same contact without a second mock notification',async()=>{
  const h=new OfflineTransaction();const first=await h.run(f);const replay=await h.run(f);
  assert.equal(first.status,'complete');assert.equal(replay.status,'replay');
  assert.equal(first.contact_id,replay.contact_id);assert.deepEqual(h.count,{creates:1,reads:1,notificationAttempts:1});
});
test('concurrent duplicate gets explicit pending then replay with one mock creation',async()=>{
  const h=new OfflineTransaction();const result=await Promise.all([h.run(f),h.run(f)]);
  assert.deepEqual(result.map(r=>r.status).sort(),['complete','pending']);
  assert.equal((await h.run(f)).status,'replay');assert.equal(h.count.creates,1);assert.equal(h.count.notificationAttempts,1);
});
for(const failure of ['crm_400','crm_409','crm_429','crm_5xx','crm_timeout','readback_mismatch'])
  test(`${failure}: no mock notification, no blind create retry`,async()=>{
    const h=new OfflineTransaction();await h.run(f,failure);const retry=await h.run(f);
    assert.notEqual(retry.status,'complete');assert.equal(h.count.creates,1);assert.equal(h.count.notificationAttempts,0);
  });
test('unknown notification outcome never resends automatically or claims delivered',async()=>{
  const h=new OfflineTransaction();const first=await h.run(f,'notification_timeout');const retry=await h.run(f);
  assert.equal(first.status,'notification_reconciliation_required');assert.equal(retry.status,first.status);
  assert.equal(retry.notification_sent,false);assert.equal(h.count.notificationAttempts,1);
});
test('normal mock provider acceptance is not mailbox delivery evidence',async()=>{
  const h=new OfflineTransaction();const r=await h.run(f);
  assert.equal(r.notification_status,'mock_provider_accepted_not_delivered');assert.equal(r.notification_sent,false);
});
test('replay validates current request and consent before exposing prior contact result',async()=>{
  const h=new OfflineTransaction();await h.run(f);
  const bad={...f,prepared:()=>({status:'invalid_intent'}),stored:()=>null,mockOptions:f.safeOptions};
  const r=await h.run(bad);assert.equal(r.status,'not_testing_ready');assert.equal(r.contact_id,undefined);
  const withdrawn={...f,stored:()=>({...f.stored(),withdrawn:true})};
  assert.equal((await h.run(withdrawn)).status,'consent_receipt_unverified');
  assert.equal(h.count.creates,1);assert.equal(h.count.notificationAttempts,1);
});
test('withdrawal after reservation but before create prevents all mock side effects',async()=>{
  const h=new OfflineTransaction();let withdrawn=false;
  const request={...f,stored:()=>({...f.stored(),withdrawn})};
  const pending=h.run(request);withdrawn=true;const r=await pending;
  assert.equal(r.status,'consent_blocked');assert.equal(h.count.creates,0);assert.equal(h.count.notificationAttempts,0);
});
test('withdrawal after CRM readback but before send retains contact ID and suppresses notification',async()=>{
  const h=new OfflineTransaction();let reads=0;
  const request={...f,stored:()=>({...f.stored(),withdrawn:++reads>=3})};
  const r=await h.run(request);
  assert.equal(r.status,'consent_blocked');assert.equal(r.contact_id,'9000000001');
  assert.equal(h.count.creates,1);assert.equal(h.count.notificationAttempts,0);assert.equal(r.notification_sent,false);
});
