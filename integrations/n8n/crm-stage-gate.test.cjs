const assert = require('node:assert/strict');
const {prepareLead} = require('./lead-intake.js');
const {planSyntheticSellerWrite, verifySyntheticCrmResult} = require('./crm-stage-gate.js');
const fixture = require('./staging-test.fixture.cjs');
const prepared = fixture.prepared();
const stored = fixture.stored();
const reservation = fixture.reservation;
const opts = fixture.mockOptions;
let n=0;
function check(label, fn) {fn();n++;console.log('PASS '+label)}
check('stored consent and reserved synthetic fixture prepare an exact contact payload',()=>{
  const p=planSyntheticSellerWrite(prepared,stored,reservation,opts);
  assert.equal(p.status,'ready_for_synthetic_crm');
  assert.deepEqual(Object.keys(p.properties).sort(),
    ['firstname','email','lead_type','seller_next_step','hs_lead_status','hubspot_owner_id','lead_source'].sort());
  assert.equal(p.notification_allowed,false);
});
check('unpersisted, withdrawn, mismatched or expired consent blocks a write',()=>{
  for(const receipt of [null,{...stored,withdrawn:true},{...stored,service:'cash_offer'},
      {...stored,text:'altered'}, {...stored,accepted_at:'2026-10-12T21:00:00.000Z'}]) {
    assert.equal(planSyntheticSellerWrite(prepared,receipt,reservation,opts).crm_write_allowed,false);
  }
});
check('missing or reused reservation blocks a write',()=>{
  for(const r of [null,{...reservation,status:'used'},{...reservation,receipt_id:'other'},
      {...reservation,idempotency_key:'bad'}]) {
    assert.equal(planSyntheticSellerWrite(prepared,stored,r,opts).crm_write_allowed,false);
  }
});
check('real contact, phone, non-seller or disabled automation isolation blocks a write',()=>{
  const real={...prepared,contactPayload:{properties:{...prepared.contactPayload.properties,email:'person@gmail.com'}}};
  const phone={...prepared,contactPayload:{properties:{...prepared.contactPayload.properties,phone:'+12155550100'}}};
  const buyer={...prepared,event:{...prepared.event,intent:'buyer'}};
  for(const candidate of [real,phone,buyer]) assert.equal(planSyntheticSellerWrite(candidate,stored,reservation,opts).crm_write_allowed,false);
  assert.equal(planSyntheticSellerWrite(prepared,stored,reservation,{...opts,automationsIsolated:false}).crm_write_allowed,false);
});
check('only a matching CRM ID and reservation can support a verified test result',()=>{
  const plan=planSyntheticSellerWrite(prepared,stored,reservation,opts);
  const valid={outcome:'created',contact_id:'123456',idempotency_key:reservation.idempotency_key,
    properties:{...plan.properties},
    email:fixture.identity.email,owner_id:'84884614',verified_by_crm_readback:true};
  assert.equal(verifySyntheticCrmResult(plan,valid).status,'synthetic_contact_verified');
  for(const change of [{contact_id:null},{idempotency_key:'different'},{email:'other@example.invalid'},
      {owner_id:'another-owner'},{verified_by_crm_readback:false},
      {outcome:'failed'}]) assert.equal(verifySyntheticCrmResult(plan,{...valid,...change}).contact_id,null);
  assert.equal(verifySyntheticCrmResult({status:'blocked'},valid).contact_id,null);
});
console.log(`${n} CRM staging gate checks passed. No network, CRM write or notification performed.`);

