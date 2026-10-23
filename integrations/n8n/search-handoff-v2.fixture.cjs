'use strict';
const base=require('./staging-test.fixture.cjs');
const {identities}=require('./staging-test-contract.js');
const {buildNotice}=require('./search-handoff-v2.cjs');
// No production recipient selected. Parent's Dan buyer/renter routing question is pending.
const pendingRoutes={buyer:null,renter:null};
function make(intent,{simulatedRoute=false}={}){
  const service=intent==='buyer'?'buyer_help':'rental_help';
  const context={test_run_id:`TESTING_20261022_${intent.toUpperCase()}_001`,
    session_id:`TESTING_20261022_${intent.toUpperCase()}_001:session-001`,
    handoff_request_id:intent==='buyer'?'4187ff3e-daa3-4a5b-9f18-c4d30c257b86':'5187ff3e-daa3-4a5b-9f18-c4d30c257b86'};
  const id=identities(context),search=`${id.test_run_id}:search-001`,prompt=`${id.test_run_id}:consent-001`;
  // Deliberately nonroutable fictional recipient for local positive coverage.
  // This is not Dan and must never be installed or sent.
  const mockRoute={confirmed:true,coverage_confirmed:true,name:'Synthetic Route',business:'Offline Fixture Agency',
    email:'agent@example.invalid',service,notification_recipients:['operator@example.invalid','agent@example.invalid']};
  const notice=buildNotice(intent,mockRoute);
  const value=v=>({value:v,request_id:search,source:'explicit_current_journey'});
  const input={intent,requested_service:service,contact:{channel:'email',firstname:id.firstname,
    email_choice:'yes',email:id.email},consent:{choice:'yes',withdrawn:false,service,...notice,
      request_id:id.handoff_request_id,prompt_id:prompt,stage:'handoff_consent',contact_method:'email'},
    criteria:{area:value('Doylestown / Newtown'),price:value(intent==='buyer'?'$500,000':'$2,000/month'),
      bedrooms:value(intent==='buyer'?'3':'1'),move_timing:value('January 2027'),
      must_haves:value('Parking'),home_type:value('unknown'),lease_duration:value('flexible')}};
  const server={context,search_request_id:search,prompt_id:prompt,now:base.now,ownerId:'84884614',
    routes:simulatedRoute?{...pendingRoutes,[intent]:mockRoute}:pendingRoutes};
  return {input,server};
}
module.exports={pendingRoutes,make};
