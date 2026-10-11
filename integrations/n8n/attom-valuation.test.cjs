const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const workflow = JSON.parse(fs.readFileSync(__dirname + '/attom-valuation.workflow.json'));
const code = name => workflow.nodes.find(n => n.name === name).parameters.jsCode;
const run = (name, data, request = {}) => vm.runInNewContext('(function(){' + code(name) + '})()', {$json:data, $:() => ({first:() => ({json:request})}), Date, Intl})[0].json;
const request = {address1:'468 SEQUOIA DR',address2:'SMYRNA, DE 19977',confirmed_attom_id:'147435254'};
const fixture = () => ({statusCode:200,body:{status:{code:0},property:[{identifier:{attomId:147435254},address:{line1:'468 SEQUOIA DR',line2:'SMYRNA, DE 19977'},avm:{eventDate:new Date().toISOString().slice(0,10),amount:{low:253561,value:272953,high:292345,scr:93}}}]}});
let passed = 0;
function test(name, fn) {fn(); passed++; console.log('PASS ' + name);}
test('street, state and ZIP are required', () => {
 for (const body of [{},{address1:'fake',address2:'Doylestown'},{address1:'123 Main St',address2:'Doylestown, PA'}]) assert.equal(run('Validate address',{body}).status,'invalid_address');
 assert.equal(run('Validate address',{body:request}).valid,true);
});
test('unconfirmed property hides valuation', () => { const result = run('Normalize valuation',fixture(),{}); assert.equal(result.status,'confirm_property'); assert.equal(result.estimate,null); });
test('wrong property confirmation hides valuation', () => assert.equal(run('Normalize valuation',fixture(),{confirmed_attom_id:'other'}).estimate,null));
test('confirmed property preserves provider values', () => {const result=run('Normalize valuation',fixture(),request); assert.equal(result.status,'ok'); assert.equal(result.estimate.value,272953); assert.equal(result.voiceflow.estimate_low_display,'$253,561'); assert.equal(result.voiceflow.estimate_high_display,'$292,345');});
test('HTTP failures and timeout never invent values', () => { for (const response of [{statusCode:401},{statusCode:429},{statusCode:500},{error:'timeout'}]) assert.equal(run('Normalize valuation',response,request).estimate,null); });
test('empty and ambiguous properties return no value', () => { const data=fixture(); data.body.property=[]; assert.equal(run('Normalize valuation',data,request).estimate,null); data.body.property=[{},{}]; assert.equal(run('Normalize valuation',data,request).estimate,null); });
test('missing AVM and inverted range return no value', () => { let data=fixture(); delete data.body.property[0].avm; assert.equal(run('Normalize valuation',data,request).estimate,null); data=fixture(); data.body.property[0].avm.amount.low=400000; assert.equal(run('Normalize valuation',data,request).estimate,null); });
test('old, future and missing dates return no value', () => {for(const date of ['2020-01-01','2099-01-01',null]) {const data=fixture(); data.body.property[0].avm.eventDate=date; assert.equal(run('Normalize valuation',data,request).estimate,null);}});
test('malformed provider JSON returns no value', () => assert.equal(run('Normalize valuation',{statusCode:200,body:'{'},request).estimate,null));
test('owner data is excluded from response', () => {const data=fixture(); data.body.property[0].owner={name:'PRIVATE OWNER'}; assert.equal(JSON.stringify(run('Normalize valuation',data,request)).includes('PRIVATE OWNER'),false);});
test('workflow stays inactive and credentials are unbound', () => {assert.equal(workflow.active,false); for(const node of workflow.nodes) assert.equal(node.credentials,undefined); assert.equal(workflow.nodes[0].parameters.authentication,'headerAuth');});
console.log(`${passed} tests passed. n8n import/runtime verification still required.`);
