"""Generate an inactive, authenticated, mock-only test harness. No CRM transport."""
import json
from pathlib import Path
root = Path(__file__).parent
code = (root / 'lead-intake.js').read_text().split("if (typeof module")[0]
code += "\nconst result = prepareLead($json.body, {testing:true});\nreturn [{json:{status:result.status,testing:true,crm_write_performed:false,notification_sent:false,would_create_contact:!!result.contactPayload,category:result.consentReceipt?.service || result.event.event_type,field_names:result.contactPayload ? Object.keys(result.contactPayload.properties) : []}}];\n"
nodes = [
    {'id':'intake-webhook','name':'TESTING intake request','type':'n8n-nodes-base.webhook','typeVersion':2,'position':[0,0],
     'parameters':{'httpMethod':'POST','path':'bucks-advisor-intake-testing-v1','authentication':'headerAuth','responseMode':'responseNode','options':{}}},
    {'id':'intake-code','name':'TESTING prepare CRM payload','type':'n8n-nodes-base.code','typeVersion':2,'position':[260,0],
     'parameters':{'jsCode':code}},
    {'id':'intake-response','name':'TESTING response only','type':'n8n-nodes-base.respondToWebhook','typeVersion':1.4,'position':[520,0],
     'parameters':{'respondWith':'json','responseBody':'={{ $json }}','options':{'responseCode':200}}},
]
def edge(name): return {'node':name,'type':'main','index':0}
workflow = {'name':'TESTING — Bucks advisor intake — NO CRM WRITES','active':False,'nodes':nodes,
    'connections':{'TESTING intake request':{'main':[[edge('TESTING prepare CRM payload')]]},
                   'TESTING prepare CRM payload':{'main':[[edge('TESTING response only')]]}},
    'settings':{'executionOrder':'v1','saveDataSuccessExecution':'none','saveDataErrorExecution':'none','saveManualExecutions':False}}
(root / 'lead-intake.testing.workflow.json').write_text(json.dumps(workflow, indent=2)+'\n')
