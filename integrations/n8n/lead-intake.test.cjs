const assert = require('node:assert/strict');
const {prepareLead} = require('./lead-intake.js');
let count = 0;
const test = (name, fn) => { fn(); count++; console.log('PASS ' + name); };
const make = (intent='buyer', service='buyer_help') => ({intent, requested_service:service,
  contact:{firstname:'TESTING', email_choice:'yes', email:'synthetic@example.invalid'},
  consent:{choice:'yes', service, recipient:'TESTING recipient', text_version:'testing-v1',
    text:'TEST ONLY: share these synthetic preferences with the testing recipient.'}});
test('malformed and missing bodies fail closed without throwing', () => {
  for(const i of [null,undefined,'text',[],123]) assert.equal(prepareLead(i).status,'invalid_intent');
});
test('address alone creates no CRM contact or owner assertion', () => {
  const r=prepareLead({intent:'home_value',property_address:'123 Example Lane'});
  assert.equal(r.contactPayload,null);assert.equal(r.event.role,'unspecified');assert.equal(r.event.submitted_address,undefined);
});
test('raw address register requires explicit enabling and installed notice version', () => {
  const i={intent:'home_value',property_address:'123 Example Lane'};
  assert.equal(prepareLead(i,{addressLoggingEnabled:true}).event.submitted_address,undefined);
  i.notice_version='testing-v1'; assert.equal(prepareLead(i,{addressLoggingEnabled:true}).event.submitted_address,'123 Example Lane');
});
test('buyer opt-in accepts email-only and verified enum', () => {
  const r=prepareLead(make());assert.equal(r.status,'testing_ready');assert.equal(r.contactPayload.properties.buyer_help_interest,'accepted');assert.equal(r.contactPayload.properties.phone,undefined);
});
test('renter payload maps capitalized CRM enum', () => {
  const r=prepareLead({...make('renter','rental_help'),renter_bedrooms:'2',renter_timeline:'long_term'});
  assert.equal(r.contactPayload.properties.renter_help_interest,'Accepted');assert.equal(r.contactPayload.properties.renter_bedrooms,'2');
});
test('seller cash-offer choice is explicit', () => {
  const r=prepareLead(make('seller','cash_offer'));assert.equal(r.contactPayload.properties.seller_next_step,'cash_offer');assert.equal(r.commercial_handoff,false);
});
test('home-value introduction maps to valid CRM service', () => {
  const r=prepareLead(make('home_value','professional_home_valuation'));assert.equal(r.contactPayload.properties.lead_type,'home_value');
});
test('decline and withdrawal block CRM regardless of contact details', () => {
  for(const change of [{choice:'no'},{choice:'maybe_later'},{withdrawn:true},{choice:true}]) {
    const i=make();Object.assign(i.consent,change);assert.equal(prepareLead(i).contactPayload,null);
  }
});
test('consent for another service or missing recipient is blocked', () => {
  for(const change of [{service:'cash_offer'},{recipient:''},{text_version:''},{text:''}]) {
    const i=make();Object.assign(i.consent,change);assert.equal(prepareLead(i).contactPayload,null);
  }
});
test('stale email is omitted when email choice is no', () => {
  const i=make();i.contact.email_choice='no';i.contact.phone='(215) 555-0100';
  const p=prepareLead(i).contactPayload.properties;assert.equal(p.email,undefined);assert.equal(p.phone,'+12155550100');
});
test('invalid phone and unresolved email do not produce a contact', () => {
  const i=make();i.contact.email='{customer_email}';i.contact.phone='123';assert.equal(prepareLead(i).contactPayload,null);
});
test('wrong service for intent never yields premium request', () => {
  assert.equal(prepareLead(make('renter','cash_offer')).contactPayload,null);
});
test('unknown preapproval stays unknown instead of defaulting', () => {
  const p=prepareLead({...make(),buyer_preapproved:'not sure'}).contactPayload.properties;
  assert.equal(p.buyer_preapproved,undefined);
});
test('invalid renter dropdown labels are omitted', () => {
  const p=prepareLead({...make('renter','rental_help'),renter_bedrooms:'2 bedrooms',renter_timeline:'Long-term'}).contactPayload.properties;
  assert.equal(p.renter_bedrooms,undefined);assert.equal(p.renter_timeline,undefined);
});
test('search location does not overwrite contact home address', () => {
  const p=prepareLead({...make(),property_address:'123 Example Lane',city:'Doylestown',property_zip:'18901'}).contactPayload.properties;
  assert.equal(p.property_address,undefined);assert.equal(p.city,undefined);assert.equal(p.zip,undefined);
});
test('no arbitrary numeric estimates or confidence are written to CRM', () => {
  const p=prepareLead({...make('seller','cash_offer'),estimate_low:100,confidence_label:'stronger'}).contactPayload.properties;
  assert.equal(p.estimate_low,undefined);assert.equal(p.confidence_label,undefined);
});
test('budget and timing remain useful private context without inventing CRM fields', () => {
  const r=prepareLead({...make(),preferences:{budget:'$500,000',move_timing:'six months',must_haves:'parking'}});
  assert.equal(r.context.move_timing,'six months');assert.equal(r.contactPayload.properties.buyer_budget,undefined);
});
test('test mode is default; no automatic commercial handoff', () => {
  assert.equal(prepareLead(make()).event.testing,true);assert.equal(prepareLead(make(),{testing:false}).status,'ready_for_crm');assert.equal(prepareLead(make(),{testing:false}).commercial_handoff,false);
});
test('input API credentials and internal IDs are never forwarded', () => {
  const r=prepareLead({...make(),apikey:'NOT_A_REAL_KEY',hubspot_owner_id:'999'});
  assert.ok(!JSON.stringify(r).includes('NOT_A_REAL_KEY'));assert.equal(r.contactPayload.properties.hubspot_owner_id,undefined);
});
test('generated harness stays inactive, authenticated and has no outbound nodes', () => {
  const w=require('./lead-intake.testing.workflow.json');
  assert.equal(w.active,false);assert.equal(w.nodes[0].parameters.authentication,'headerAuth');
  assert.ok(w.nodes.every(n=>!n.credentials));
  assert.deepEqual(w.nodes.map(n=>n.type),['n8n-nodes-base.webhook','n8n-nodes-base.code','n8n-nodes-base.respondToWebhook']);
  assert.equal(w.settings.saveManualExecutions,false);
});
test('embedded n8n code returns mock-only response without contact data', () => {
  const vm=require('node:vm');const w=require('./lead-intake.testing.workflow.json');
  const result=vm.runInNewContext('(function(){'+w.nodes[1].parameters.jsCode+'})()',{$json:{body:make('renter','rental_help')}})[0].json;
  assert.equal(result.would_create_contact,true);assert.equal(result.crm_write_performed,false);assert.equal(result.notification_sent,false);
  assert.ok(Array.from(result.field_names).includes('renter_help_interest'));
  assert.ok(!JSON.stringify(result).includes('synthetic@example.invalid'));
});
console.log(`${count} intake tests passed. No network or CRM writes performed.`);
