'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {make}=require('./search-handoff-v2.fixture.cjs');
const {prepareSearchHandoff,buildNotice}=require('./search-handoff-v2.cjs');
for(const intent of ['buyer','renter']){
  const label=intent==='buyer'?'buyer_help':'rental_help';
  test(`${intent}: actual pending recipient configuration fails closed`,()=>{
    const f=make(intent);assert.equal(prepareSearchHandoff(f.input,f.server).status,'recipient_route_or_channel_unconfirmed');
  });
  test(`${intent}: separate correct service, notice, contact method and current-journey brief`,()=>{
    const f=make(intent,{simulatedRoute:true}),r=prepareSearchHandoff(f.input,f.server);
    assert.equal(r.status,'candidate_ready_mock_only');assert.equal(r.receipt_candidate.service,label);
    assert.equal(r.contactPayload.properties.lead_type,intent);assert.equal(r.contactPayload.properties.seller_next_step,undefined);
    assert.equal(r.receipt_candidate.contact_method,'email');assert.equal(r.receipt_candidate.synthetic,true);
    assert.equal(r.brief.bedrooms,intent==='buyer'?'3':'1');assert.equal(r.brief.move_timing,'January 2027');
    assert.equal(r.brief.home_type,intent==='buyer'?null:undefined);
    assert.equal(r.contactPayload.properties.renter_bedrooms,undefined);assert.equal(r.contactPayload.properties.renter_timeline,undefined);
    assert.equal(r.crm_write_allowed,false);assert.equal(r.notification_allowed,false);
    assert.equal(r.contactPayload.properties[intent==='buyer'?'buyer_help_interest':'renter_help_interest'],intent==='buyer'?'accepted':'Accepted');
  });
  test(`${intent}: stale defaults and unproven criteria remain unknown`,()=>{
    const f=make(intent,{simulatedRoute:true});f.input.criteria.bedrooms.request_id='old';
    f.input.criteria.move_timing={value:'long_term'};f.input.criteria.price.value='unknown';
    const r=prepareSearchHandoff(f.input,f.server);assert.equal(r.brief.bedrooms,null);
    assert.equal(r.brief.move_timing,null);assert.equal(r.brief.price,null);
  });
  test(`${intent}: no, skip, cancellation and withdrawal yield no CRM payload`,()=>{
    for(const choice of ['no','skip','cancel']){const f=make(intent,{simulatedRoute:true});f.input.consent.choice=choice;
      assert.equal(prepareSearchHandoff(f.input,f.server).contactPayload,null);}
    const f=make(intent,{simulatedRoute:true});f.input.consent.withdrawn=true;
    assert.equal(prepareSearchHandoff(f.input,f.server).contactPayload,null);
  });
  test(`${intent}: service, prompt, request, channel and recipient substitutions rejected`,()=>{
    for(const change of [{service:'professional_home_valuation'},{prompt_id:'old'},{request_id:'old'},
      {contact_method:'phone'},{recipient:'Dan at unconfirmed route'}]){
      const f=make(intent,{simulatedRoute:true});Object.assign(f.input.consent,change);
      assert.equal(prepareSearchHandoff(f.input,f.server).contactPayload,null);}
  });
  test(`${intent}: route coverage unconfirmed or no channel blocks before capture acceptance`,()=>{
    const f=make(intent,{simulatedRoute:true});f.server.routes[intent].coverage_confirmed=false;
    assert.equal(prepareSearchHandoff(f.input,f.server).contactPayload,null);
    const g=make(intent,{simulatedRoute:true});delete g.input.contact.channel;
    assert.equal(prepareSearchHandoff(g.input,g.server).contactPayload,null);
  });
}
test('intent/service mismatch never becomes seller valuation',()=>{
  const f=make('buyer',{simulatedRoute:true});f.input.requested_service='professional_home_valuation';
  assert.equal(prepareSearchHandoff(f.input,f.server).status,'intent_service_mismatch');
});
test('named recipient must be present in deduplicated notification routing',()=>{
  const f=make('buyer',{simulatedRoute:true}),route=f.server.routes.buyer;
  route.notification_recipients=['operator@example.invalid'];assert.equal(buildNotice('buyer',route),null);
  route.notification_recipients=['operator@example.invalid','AGENT@example.invalid','agent@example.invalid'];
  assert.deepEqual(buildNotice('buyer',route).notification_recipients,['operator@example.invalid','agent@example.invalid']);
});
test('missing or malformed server timestamp cannot produce accepted receipt candidate',()=>{
  for(const now of [undefined,'not a date','2026-10-22']){
    const f=make('buyer',{simulatedRoute:true});f.server.now=now;
    assert.equal(prepareSearchHandoff(f.input,f.server).status,'server_timestamp_unverified');
  }
});
test('unresolved variables and all existing intake sentinels remain unknown',()=>{
  for(const value of ['not_provided','n/a','null','undefined','$$VAR_bedrooms']){
    const f=make('renter',{simulatedRoute:true});f.input.criteria.bedrooms.value=value;
    assert.equal(prepareSearchHandoff(f.input,f.server).brief.bedrooms,null);
  }
});
