'use strict';
// Separate LOCAL candidate for buyer/renter. This never calls the seller CRM gate,
// never authorizes a write/send, and is NOT installed in Voiceflow or n8n.
const {prepareLead}=require('./lead-intake.js');
const {identities}=require('./staging-test-contract.js');
const RULES={
  buyer:{service:'buyer_help',notice:'bucks-synthetic-buyer-handoff-v2',
    fields:['area','price','bedrooms','home_type','move_timing','must_haves']},
  renter:{service:'rental_help',notice:'bucks-synthetic-renter-handoff-v2',
    fields:['area','price','bedrooms','move_timing','lease_duration','must_haves']}
};
const OPEN=/^(?:open|still_exploring|unknown|not sure|unclear|skip|skipped|none|not_provided|n\/a|null|undefined)$/i;
const clean=v=>typeof v==='string'&&v.trim().length<=500&&!/[{}\r\n]|\$\$VAR_/i.test(v)?v.trim():'';
function buildNotice(intent,route,channel='email') {
  if(!RULES[intent]||route?.confirmed!==true||route.coverage_confirmed!==true||channel!=='email'||
    !clean(route.name)||!clean(route.business)||!/^\S+@\S+\.\S+$/.test(route.email||'')||
    route.service!==RULES[intent].service||!Array.isArray(route.notification_recipients)||
    !route.notification_recipients.length||route.notification_recipients.some(x=>!/^\S+@\S+\.\S+$/.test(x))) return null;
  const recipients=[...new Set(route.notification_recipients.map(x=>x.toLowerCase()))];
  if(!recipients.includes(route.email.toLowerCase()))return null;
  const recipient=`${clean(route.name)} at ${clean(route.business)} (${route.email.toLowerCase()})`;
  return {recipient,notification_recipients:recipients,text_version:RULES[intent].notice,
    text:`TEST ONLY — no follow-up needed. May we create one synthetic HubSpot contact for ${RULES[intent].service} and share the synthetic search brief and chosen ${channel} contact method with ${recipient}? The test notification will be emailed only to ${recipients.join(' and ')}. No real customer is requesting help. No or Skip creates no contact and sends no notification.`};
}
function prepareSearchHandoff(input,server={}) {
  const blocked=status=>({status,crm_write_allowed:false,notification_allowed:false,notification_sent:false,
    contactPayload:null,receipt_candidate:null});
  const rule=RULES[input?.intent];
  if(!rule||input.requested_service!==rule.service)return blocked('intent_service_mismatch');
  let id;try{id=identities(server.context);}catch(_){return blocked('request_identity_unverified');}
  if(typeof server.now!=='string'||!Number.isFinite(Date.parse(server.now))||
    new Date(server.now).toISOString()!==server.now)return blocked('server_timestamp_unverified');
  const route=server.routes?.[input.intent];const channel=input.contact?.channel;
  const notice=buildNotice(input.intent,route,channel);
  if(!notice)return blocked('recipient_route_or_channel_unconfirmed');
  if(!server.search_request_id||!server.prompt_id||input.consent?.request_id!==id.handoff_request_id||
    input.consent?.prompt_id!==server.prompt_id||input.consent?.stage!=='handoff_consent'||
    input.consent?.contact_method!==channel||input.consent?.withdrawn!==false)return blocked('consent_binding_unverified');
  if(input.contact.firstname!==id.firstname||input.contact.email!==id.email||input.contact.phone||
    input.contact.email_choice!=='yes')return blocked('not_synthetic_fixture');
  const brief={};
  for(const field of rule.fields){
    const item=input.criteria?.[field], value=clean(item?.value);
    brief[field]=item?.request_id===server.search_request_id&&item?.source==='explicit_current_journey'&&
      value&&!OPEN.test(value)?value:null;
  }
  // Pass only known, supported fields to the existing normalizer. Exact bedrooms
  // and move date remain in the brief, not fabricated legacy CRM enum buckets.
  const body={intent:input.intent,requested_service:rule.service,contact:input.contact,consent:input.consent,
    preferences:{budget:brief.price||'',move_timing:brief.move_timing||'',bedrooms:brief.bedrooms||'',
      must_haves:brief.must_haves||'',lease_length:brief.lease_duration||''}};
  if(input.intent==='buyer'&&brief.area)body.buyer_area=brief.area;
  if(input.intent==='renter'&&brief.area)body.renter_area=brief.area;
  const p=prepareLead(body,{testing:true,consentConfig:notice,now:server.now});
  if(!p.contactPayload)return blocked(p.status);
  return {status:'candidate_ready_mock_only',crm_write_allowed:false,notification_allowed:false,notification_sent:false,
    contactPayload:{properties:{...p.contactPayload.properties,lead_source:'TESTING — Bucks advisor staging',
      ...(server.ownerId==='84884614'?{hubspot_owner_id:server.ownerId}:{})}},
    brief,recipient:notice.recipient,notification_recipients:[...notice.notification_recipients],
    receipt_candidate:{receipt_id:id.receipt_id,session_id:id.session_id,test_run_id:id.test_run_id,
      handoff_request_id:id.handoff_request_id,idempotency_key:id.idempotency_key,
      search_request_id:server.search_request_id,prompt_id:server.prompt_id,stage:'handoff_consent',
      intent:input.intent,service:rule.service,contact_method:channel,choice:'yes',withdrawn:false,
      recipient:notice.recipient,text_version:notice.text_version,notice_text:notice.text,
      accepted_at:server.now,brief,synthetic:true,notification_recipients:[...notice.notification_recipients]}};
}
module.exports={RULES,buildNotice,prepareSearchHandoff};
