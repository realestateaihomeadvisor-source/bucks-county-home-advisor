const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const scripts = Object.fromEntries(['parser', 'formatter', 'confirmation', 'offer-gate'].map(name => [name, fs.readFileSync(path.join(__dirname, `valuation-${name}.js`), 'utf8')]));
function run(name, extra = {}) {
  const state = {last_utterance:'', valuation_response:{}, confirmed_attom_id:'', valuation_address1:'', valuation_address2:'', valuation_display:'OLD REPORT', estimate_low:999999, estimate_high:1999999, estimate_low_display:'OLD LOW', estimate_high_display:'OLD HIGH', estimate_area:'OLD AREA', confidence_label:'OLD CONFIDENCE', property_address:'OLD ADDRESS', city:'', state:'', property_zip:'', ...extra};
  const route = vm.runInNewContext(`(function(){${scripts[name]}\n})()`, state);
  return {state, route};
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
const addressCases = [
  ['comma-free address', '468 SEQUOIA DR SMYRNA DE 19977', '468 SEQUOIA DR', 'SMYRNA, DE 19977'],
  ['city beginning with unit-like letters', '123 Main St, Stevens PA 17578', '123 Main St', 'Stevens, PA 17578'],
  ['comma-free city beginning with unit-like letters', '123 Main St Unity PA 15676', '123 Main St', 'Unity, PA 15676'],
  ['lowercase address', '123 main st quakertown pa 18951', '123 main st', 'quakertown, PA 18951'],
  ['multiple spaces and tabs', '  123   Main St\tQuakertown   PA   18951  ', '123 Main St', 'Quakertown, PA 18951'],
  ['pasted multiline address', '123 Main St\r\nQuakertown PA 18951', '123 Main St', 'Quakertown, PA 18951'],
  ['pasted unit on its own line', '123 Main St\nUnit 2\nQuakertown PA 18951-1234', '123 Main St, Unit 2', 'Quakertown, PA 18951-1234'],
  ['city and state punctuation', '123 Main St,Quakertown,PA,18951', '123 Main St', 'Quakertown, PA 18951'],
  ['full Pennsylvania name', '123 Main St, Quakertown Pennsylvania 18951', '123 Main St', 'Quakertown, PA 18951'],
  ['comma-free multiword city', '123 Main Road New Hope PA 18938', '123 Main Road', 'New Hope, PA 18938'],
  ['comma-free unit', '123 Main St Apt 2B Quakertown PA 18951', '123 Main St Apt 2B', 'Quakertown, PA 18951'],
  ['comma before unit', '123 Main St, Unit 2 Quakertown PA 18951', '123 Main St Unit 2', 'Quakertown, PA 18951'],
  ['hash unit', '123 Main St #2 Quakertown PA 18951', '123 Main St #2', 'Quakertown, PA 18951'],
  ['abbreviated street punctuation', '123 Main St. Quakertown PA 18951', '123 Main St', 'Quakertown, PA 18951'],
  ['apostrophe in street', "123 O'Brien Rd, New Hope, PA 18938", "123 O'Brien Rd", 'New Hope, PA 18938'],
  ['hyphenated house number', '123-125 Main St, Quakertown, PA 18951', '123-125 Main St', 'Quakertown, PA 18951'],
  ['street without type with explicit delimiter', '123 Broadway, New York, NY 10001', '123 Broadway', 'New York, NY 10001'],
];
for (const [name, input, street, locality] of addressCases) test(name, () => {
  const {state:s, route} = run('parser', {last_utterance:input, confirmed_attom_id:'stale'});
  assert.equal(route, undefined); assert.equal(s.valuation_address1, street); assert.equal(s.valuation_address2, locality);
  assert.equal(s.property_address, street + ', ' + locality); assert.equal(s.confirmed_attom_id, '');
  assert.equal(s.estimate_low, 0); assert.equal(Object.keys(s.valuation_response).length, 0);
});
for (const input of [
  '123 Main St Quakertown PA', '123 Main St Quakertown 18951', '123 Main St PA 18951',
  'Main St, Quakertown PA 18951', '123 Main St, Quakertown XX 18951',
  '123 Main St, Quakertown PA 00000', '123 Main St, Quakertown PA 00000-1234', '123 Main St, Quakertown PA 1895',
  '123 Main St, Quakertown PA 18951-123', '123 Main St, Quakertown PA 18951 extra',
  '123 Broadway New York NY 10001', '123 Main St N Quakertown PA 18951',
  '123 Main St Forest Dr New Hope PA 18938', '123 Main St, Unit 2, PA 18951', '123 Main St Unit ABC PA 18951',
  '123 Main St, Unit ABC PA 18951', '123 Main St Apt 2 PA 18951',
  '123 Main St, Quakertown PA 18951\u0000', '123 Main St, Quakertown PA 18951\\',
  '123 Main St, Quakertown PA 18951' + ' '.repeat(401),
]) test('incomplete, unsafe or ambiguous address is rejected: ' + JSON.stringify(input).slice(0,85), () => {
  const {state:s, route} = run('parser', {last_utterance:input, property_address:'OLD', city:'OLD', state:'PA', property_zip:'18951', confirmed_attom_id:'stale'});
  assert.equal(route, 'invalid');
  for (const key of ['property_address','city','state','property_zip','valuation_address1','valuation_address2','confirmed_attom_id']) assert.equal(s[key], '');
  assert.equal(s.estimate_low, 0); assert.equal(s.estimate_high_display, '');
});
test('unconfirmed match exposes address and withholds range',()=>{
  const {state:s,route}=run('formatter',{valuation_response:match,last_utterance:'Yes'}); assert.equal(route,'confirm'); assert.equal(s.last_utterance,''); assert.equal(s.estimate_low,0); assert.equal(s.estimate_high_display,''); assert.match(s.valuation_display,/468 SEQUOIA/); assert.doesNotMatch(s.valuation_display,/253,561/);
});
test('explicit yes records only matched ID and clears response for retry',()=>{
  const {state:s,route}=run('confirmation',{last_utterance:'Yes',valuation_response:match,valuation_address1:'468 SEQUOIA DR',valuation_address2:'SMYRNA, DE 19977'}); assert.equal(route,undefined); assert.equal(s.confirmed_attom_id,'147435254'); assert.equal(Object.keys(s.valuation_response).length,0); assert.equal(s.estimate_low,0);
});
for (const reply of ['No','maybe','yes but wrong unit']) test(`confirmation ${reply} stops without estimate`,()=>{
  const {state:s,route}=run('confirmation',{last_utterance:reply,valuation_response:match,valuation_address1:'468 SEQUOIA DR',valuation_address2:'SMYRNA, DE 19977'}); assert.equal(route,'declined'); assert.equal(s.confirmed_attom_id,''); assert.equal(s.estimate_low,0);
});
test('no-reply path with stale address text cannot confirm the match',()=>{
  const {state:s,route}=run('confirmation',{last_utterance:'468 SEQUOIA DR, SMYRNA, DE 19977',valuation_response:match,valuation_address1:'468 SEQUOIA DR',valuation_address2:'SMYRNA, DE 19977'});
  assert.equal(route,'declined'); assert.equal(s.confirmed_attom_id,''); assert.equal(s.estimate_low,0); assert.match(s.valuation_display,/no property estimate was released/);
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
test('verified ATTOM display alone reaches the optional test offer',()=>{
  const {state:s,route}=run('offer-gate',{valuation_response:estimate,confirmed_attom_id:'147435254',estimate_low:253561,estimate_high:292345,last_utterance:'Yes'});
  assert.equal(route,'offer'); assert.equal(s.last_utterance,'');
});
for (const response of [{...estimate,status:'zip_fallback'}, {...estimate,source:'other'}, {...estimate,property:{attom_id:'999'}}, {...estimate,estimate:{...estimate.estimate,low:0}}]) test('nonvalidated estimate cannot reach optional offer',()=>{
  assert.equal(run('offer-gate',{valuation_response:response,confirmed_attom_id:'147435254',estimate_low:253561,estimate_high:292345}).route,undefined);
});
test('stale display fields cannot reach optional offer',()=>{
  assert.equal(run('offer-gate',{valuation_response:estimate,confirmed_attom_id:'147435254',estimate_low:999,estimate_high:292345}).route,undefined);
});
console.log(`${count} valuation conversation checks passed`);

