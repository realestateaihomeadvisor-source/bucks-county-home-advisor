const assert = require('node:assert/strict');
const {prepareLead} = require('./lead-intake.js');
const {planSyntheticSellerWrite, verifySyntheticCrmResult} = require('./crm-stage-gate.js');
const notice = {recipient:'Paul at Bucks County Home Advisor', text_version:'bucks-testing-seller-v1',
  text:'TESTING ONLY: May we share your name and chosen contact method with Paul at Bucks County Home Advisor about the service you selected? This test will not create a contact or notify Paul.'};
const now = '2026-10-14T21:00:00.000Z';
const input = {intent:'seller', requested_service:'professional_home_valuation',
  contact:{firstname:'TESTING Sample',email_choice:'yes',email:'seller@example.invalid'},
  consent:{choice:'yes',service:'professional_home_valuation',...notice}};
const prepared = prepareLead(input,{testing:true,consentConfig:notice,now});
const stored = {id:'consent-001',session_id:'test-session-001',accepted_at:now,status:'accepted',withdrawn:false,
  choice:'yes',service:'professional_home_valuation',...notice};
const reservation = {status:'reserved',receipt_id:stored.id,
  idempotency_key:'01234567-89ab-4cde-8f01-23456789abcd'};
const opts = {now,ownerId:'84884614',automationsIsolated:true};
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
    email:'seller@example.invalid',owner_id:'84884614',verified_by_crm_readback:true};
  assert.equal(verifySyntheticCrmResult(plan,valid).status,'synthetic_contact_verified');
  for(const change of [{contact_id:null},{idempotency_key:'different'},{email:'other@example.invalid'},
      {owner_id:'another-owner'},{verified_by_crm_readback:false},
      {outcome:'failed'}]) assert.equal(verifySyntheticCrmResult(plan,{...valid,...change}).contact_id,null);
  assert.equal(verifySyntheticCrmResult({status:'blocked'},valid).contact_id,null);
});
console.log(`${n} CRM staging gate checks passed. No network, CRM write or notification performed.`);
