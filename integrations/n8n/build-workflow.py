import json
from pathlib import Path

root = Path(__file__).parent
validate = r'''const body = $json.body || {};
const text = v => typeof v === 'string' ? v.trim() : '';
const address1 = text(body.address1);
const address2 = text(body.address2);
const valid = address1.length <= 200 && /^\d+[A-Za-z-]*\s+\S+/.test(address1) && address2.length <= 200 && /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?$/.test(address2);
return [{json: valid ? {valid, address1, address2, confirmed_attom_id: text(body.confirmed_attom_id)} : {valid:false, status:'invalid_address', estimate:null, message:'Please provide the street address and city, state, and ZIP code.'}}];'''
normalize = r'''const request = $('Validate address').first().json;
const response = $json;
const unavailable = status => [{json:{status, source:'ATTOM', estimate:null, message:'An automated estimate is unavailable. You can still request a local professional review.'}}];
if (response.error || response.statusCode !== 200) return unavailable('provider_unavailable');
let body = response.body;
if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return unavailable('provider_unavailable'); } }
if (!body || Number(body.status?.code) !== 0) return unavailable('no_result');
if (!Array.isArray(body.property) || body.property.length !== 1) return unavailable('no_unique_property');
const property = body.property[0];
const id = String(property.identifier?.attomId || '');
const address = property.address || {};
const matchedAddress = [address.line1, address.line2].filter(Boolean).join(', ');
if (!id || !matchedAddress) return unavailable('no_unique_property');
const amount = property.avm?.amount;
const values = [amount?.low, amount?.value, amount?.high];
if (!values.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0) || values[0] > values[1] || values[1] > values[2]) return unavailable('no_valuation');
const date = property.avm?.eventDate;
if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return unavailable('undated_valuation');
const timestamp = Date.parse(date + 'T00:00:00Z');
const age = (Date.now() - timestamp) / 86400000;
if (!Number.isFinite(timestamp) || age < -1 || age > 180) return unavailable('valuation_needs_review');
const match = {attom_id:id, address:matchedAddress};
if (request.confirmed_attom_id !== id) return [{json:{status:'confirm_property', source:'ATTOM', property:match, estimate:null, message:'Is this the property you meant? Confirm the full address, including any unit, before continuing.'}}];
const usd = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
return [{json:{status:'ok', source:'ATTOM', property:match, estimate:{low:values[0], value:values[1], high:values[2], as_of:date, provider_score:typeof amount.scr === 'number' ? amount.scr : null}, voiceflow:{estimate_low:values[0], estimate_high:values[2], estimate_low_display:usd(values[0]), estimate_high_display:usd(values[2]), estimate_area:matchedAddress, confidence_label:'ATTOM automated estimate'}, message:'Automated estimate, not an appraisal. The provider score is not a probability. Condition and recent changes may affect the value.'}}];'''

def node(name, kind, version, position, parameters, **extra):
    return dict(id=name.lower().replace(' ', '-'), name=name, type='n8n-nodes-base.'+kind, typeVersion=version, position=position, parameters=parameters, **extra)

nodes = [
 node('Valuation request','webhook',2,[0,0],{'httpMethod':'POST','path':'bucks-attom-valuation-v1','authentication':'headerAuth','responseMode':'responseNode','options':{}}),
 node('Validate address','code',2,[240,0],{'jsCode':validate}),
 node('Valid address','if',2,[460,0],{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict'},'conditions':[{'id':'valid','leftValue':'={{ $json.valid }}','rightValue':True,'operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}}),
 node('ATTOM valuation','httpRequest',4.2,[700,-100],{'url':'https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendQuery':True,'queryParameters':{'parameters':[{'name':'address1','value':'={{ $json.address1 }}'},{'name':'address2','value':'={{ $json.address2 }}'}]},'sendHeaders':True,'headerParameters':{'parameters':[{'name':'Accept','value':'application/json'}]},'options':{'timeout':8000,'response':{'response':{'fullResponse':True,'neverError':True,'responseFormat':'json'}}}},onError='continueRegularOutput'),
 node('Normalize valuation','code',2,[940,-100],{'jsCode':normalize}),
 node('Return result','respondToWebhook',1.4,[1180,0],{'respondWith':'json','responseBody':'={{ $json }}','options':{'responseCode':200}}),
]
def edge(target): return {'node':target,'type':'main','index':0}
workflow = {'name':'Bucks ATTOM valuation — staging','active':False,'nodes':nodes,'connections':{'Valuation request':{'main':[[edge('Validate address')]]},'Validate address':{'main':[[edge('Valid address')]]},'Valid address':{'main':[[edge('ATTOM valuation')],[edge('Return result')]]},'ATTOM valuation':{'main':[[edge('Normalize valuation')]]},'Normalize valuation':{'main':[[edge('Return result')]]}},'settings':{'executionOrder':'v1','saveDataSuccessExecution':'none','saveDataErrorExecution':'none','saveManualExecutions':False}}
(root/'attom-valuation.workflow.json').write_text(json.dumps(workflow, indent=2)+'\n')
