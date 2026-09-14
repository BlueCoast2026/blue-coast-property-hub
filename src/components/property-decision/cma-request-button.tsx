"use client";
import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { requestPropertyCma } from "@/app/actions/property-cma";
export function CmaRequestButton({submissionId}:{submissionId:string}){const [state,action,pending]=useActionState(requestPropertyCma,{});return <div><form action={action}><input type="hidden" name="submissionId" value={submissionId}/><button disabled={pending} className="inline-flex h-12 items-center gap-2 rounded-xl bg-coastal px-6 text-sm font-semibold uppercase text-white disabled:opacity-50">{pending?<LoaderCircle className="size-4 animate-spin"/>:<Send className="size-4"/>}Request a Property CMA</button></form>{state.error&&<p className="mt-3 text-sm text-red-700">{state.error}</p>}{state.success&&<p className="mt-3 text-sm text-emerald-700">{state.success}</p>}</div>}
