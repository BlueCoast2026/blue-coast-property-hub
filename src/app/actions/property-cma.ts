"use server";
import { requireUser } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
export type CmaRequestState={error?:string;success?:string};
const thinking:Record<string,string>={sell_soon:"Planning to sell soon",sell_6_12_months:"Considering selling within 6–12 months",curious_value:"Curious about property value",compare_hold_sell:"Comparing selling versus holding",exploring_only:"Not planning to sell — exploring options"};
export async function requestPropertyCma(_state:CmaRequestState,formData:FormData):Promise<CmaRequestState>{
  void _state; const submissionId=String(formData.get("submissionId")??"");
  if(!/^[0-9a-f-]{36}$/i.test(submissionId)) return {error:"Invalid Property Decision Check."};
  const {supabase,user}=await requireUser();
  const {data:s}=await supabase.from("property_decision_submissions").select("id,property_id,score,result_level,current_thinking").eq("id",submissionId).eq("user_id",user.id).single();
  if(!s)return{error:"This result could not be found."};
  const [{data:p},{data:profile}]=await Promise.all([supabase.from("properties").select("address_line_1,address_line_2,suburb,state,postcode").eq("id",s.property_id).single(),supabase.from("profiles").select("first_name,last_name,email,phone").eq("id",user.id).single()]);
  const address=p?[p.address_line_1,p.address_line_2,p.suburb,p.state,p.postcode].filter(Boolean).join(", "):"Property unavailable";
  const name=profile?`${profile.first_name??""} ${profile.last_name??""}`.trim()||"Member":"Member";
  const token=process.env.POSTMARK_SERVER_TOKEN;
  const from=process.env.POSTMARK_FROM_EMAIL??"Blue Coast Realty <no-reply@blue-coast-realty.com.au>";
  const resultUrl=`${(process.env.NEXT_PUBLIC_SITE_URL??"https://portal.blue-coast-realty.com.au").replace(/\/$/,"")}/dashboard/property-decision/result/${submissionId}`;
  let status:"sent"|"failed"="failed",messageId:string|null=null;
  if(token){try{const response=await fetch("https://api.postmarkapp.com/email",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json","X-Postmark-Server-Token":token},body:JSON.stringify({From:from,To:"admin@bluecoastrealty.com.au",ReplyTo:profile?.email??user.email,Subject:`Property CMA request — ${address}`,TextBody:["A client has requested a Property CMA.",`Client: ${name}`,`Email: ${profile?.email??user.email??"Not provided"}`,`Phone: ${profile?.phone??"Not provided"}`,`Property: ${address}`,`Decision score: ${Number(s.score)}/100`,`Result: ${s.result_level}`,`Current thinking: ${thinking[s.current_thinking]??s.current_thinking}`,`View result: ${resultUrl}`].join("\n"),MessageStream:"outbound"})});const body=await response.json() as {ErrorCode?:number;MessageID?:string};if(response.ok&&body.ErrorCode===0){status="sent";messageId=body.MessageID??null;}}catch{status="failed";}}
  try{const admin=createAdminClient();await admin.from("property_decision_submissions").update({cma_requested_at:new Date().toISOString(),cma_email_status:status,cma_email_message_id:messageId}).eq("id",submissionId);}catch{return{error:"The CMA request could not be recorded."};}
  return status==="sent"?{success:"Your Property CMA request has been sent to Blue Coast Realty."}:{success:"Your CMA request has been recorded. Email delivery is pending server configuration."};
}
