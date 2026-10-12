const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const scripts = Object.fromEntries(['parser', 'formatter', 'confirmation'].map(name => [name, fs.readFileSync(path.join(__dirname, `valuation-${name}.js`), 'utf8')]));
function run(name, extra = {}) {
  const state = {last_utterance:'', valuation_response:{}, confirmed_attom_id:'', valuation_address1:'', valuation_address2:'', valuation_display:'OLD REPORT', estimate_low:999999, estimate_high:1999999, estimate_low_display:'OLD LOW', estimate_high_display:'OLD HIGH', estimate_area:'OLD AREA', confidence_label:'OLD CONFIDENCE', property_address:'OLD ADDRESS', city:'', state:'', property_zip:'', ...extra};
  const route = vm.runInNewContext(`(function(){${scripts[name]}\n})()`, state);
  return {state, route:route?.[0]};
}
const match = {status:'confirm_property', source:'ATTOM', property:{attom_id:'147435254', address:'468 SEQUOIA DR, SMYRNA, DE 19977'}, estimate:null};
const today = new Date().toISOString().slice(0,10);
const estimate = {...match, status:'ok', estimate:{low:253561, high:292345, as_of:today}};
let count = 0;
function test(name, fn) { fn(); count++; console.log(`PASS ${name}`); }
test('full address preserves original and creates request fields',()=>{
  const {state:s,route} = run('parser',{last_utterance:'468 SEQUOIA DR, SMYRNA, DE 19977'});
  assert.equal(route,undefined); assert.equal(s.property_address,'468 SEQUOIA DR, SMYRNA, DE 19977'); assert.equal(s.valuation_address1,'468 SEQUOIA DR'); assert.equal(s.valuation_address2,'SMYRNA, DE 19977'); assert.equal(s.confirmed_attom_id,''); assert.equal(s.estimate_low,0);
});
test('unit address and ZIP extension remain in request',()=>{
  const {state:s}=run('parser',{last_utterance:'123 Main St, Unit 2, Quakertown, PA 18951-1234'}); assert.equal(s.valuation_address1,'123 Main St, Unit 2'); assert.equal(s.valuation_address2,'Quakertown, PA 18951-1234');
});
test('partial address clears estimate and does not reach provider',()=>{
  const {state:s,route}=run('parser',{last_utterance:'Main Street',confirmed_attom_id:'147435254'}); assert.equal(route,'invalid'); assert.equal(s.estimate_low,0); assert.equal(s.confirmed_attom_id,''); assert.equal(s.valuation_address1,''); assert.match(s.valuation_display,/complete address/);
});
test('JSON-breaking address input is rejected',()=>{
  assert.equal(run('parser',{last_utterance:'123 "Main" St, Quakertown, PA 18951'}).route,'invalid');
});
test('unconfirmed match exposes address and withholds range',()=>{
  const {state:s,route}=run('formatter',{valuation_response:match}); assert.equal(route,'confirm'); assert.equal(s.estimate_low,0); assert.equal(s.estimate_high_display,''); assert.match(s.valuation_display,/468 SEQUOIA/); assert.doesNotMatch(s.valuation_display,/253,561/);
});
test('explicit yes records only matched ID and clears response for retry',()=>{
  const {state:s,route}=run('confirmation',{last_utterance:'Yes',valuation_response:match,valuation_address1:'468 SEQUOIA DR',valuation_address2:'SMYRNA, DE 19977'}); assert.equal(route,undefined); assert.equal(s.confirmed_attom_id,'147435254'); assert.equal(Object.keys(s.valuation_response).length,0); assert.equal(s.estimate_low,0);
});
for (const reply of ['No','maybe','yes but wrong unit']) test(`confirmation ${reply} stops without estimate`,()=>{
  const {state:s,route}=run('confirmation',{last_utterance:reply,valuation_response:match,valuation_address1:'468 SEQUOIA DR',valuation_address2:'SMYRNA, DE 19977'}); assert.equal(route,'declined'); assert.equal(s.confirmed_attom_id,''); assert.equal(s.estimate_low,0);
});
test('matching confirmed ID displays sourced dated range',()=>{
  const {state:s}=run('formatter',{valuation_response:estimate,confirmed_attom_id:'147435254'}); assert.equal(s.estimate_low,253561); assert.match(s.valuation_display,/\$253,561/); assert.match(s.valuation_display,/Source: ATTOM/); assert.ok(s.valuation_display.includes(today)); assert.match(s.valuation_display,/no lead has been created/);
});
test('mismatched confirmed ID cannot release estimate',()=>{
  const {state:s}=run('formatter',{valuation_response:estimate,confirmed_attom_id:'999'}); assert.equal(s.estimate_low,0); assert.doesNotMatch(s.valuation_display,/253,561/);
});
for (const date of ['2000-01-01','2099-01-01','not-a-date']) test(`invalid or stale date ${date} clears range`,()=>{
  assert.equal(run('formatter',{valuation_response:{...estimate,estimate:{...estimate.estimate,as_of:date}},confirmed_attom_id:'147435254'}).state.estimate_low,0);
});
test('ZIP context never populates property estimate fields',()=>{
  const {state:s}=run('formatter',{valuation_response:{status:'zip_fallback',estimate:{kind:'zip_market_context',low:100000,high:900000},message:'ZIP market context, not a valuation of your property.'}}); assert.equal(s.estimate_low,0); assert.equal(s.estimate_high_display,''); assert.match(s.valuation_display,/not a valuation/);
});
test('malformed response cannot show a stale report',()=>{
  const {state:s}=run('formatter',{valuation_response:'not JSON'}); assert.equal(s.estimate_low,0); assert.doesNotMatch(s.valuation_display,/OLD/);
});
console.log(`${count} valuation conversation checks passed`);
