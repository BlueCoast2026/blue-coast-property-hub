"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Home, LoaderCircle, Plus } from "lucide-react";
import { addBasicProperty } from "@/app/actions/health-check";
import { submitReadyToRent } from "@/app/actions/ready-to-rent";
import { readyToRentQuestions, type ReadinessValue } from "@/lib/ready-to-rent/questions";

type Property = { id: string; address_line_1: string; suburb: string | null; state: string | null; postcode: string | null };

function AddPropertyForm() {
  const [state, action, pending] = useActionState(addBasicProperty, {});

  return <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
    <span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><Plus className="size-5" /></span>
    <h2 className="mt-6 text-xl font-semibold text-navy">Add a property to begin</h2>
    <p className="mt-2 text-base leading-7 text-muted">We only need the basic address for this checklist. You can add more property details later.</p>
    <form action={action} className="mt-7 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-ink sm:col-span-2">Address<input required name="address" autoComplete="street-address" placeholder="88 The Esplanade" className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label>
      <label className="text-sm font-medium text-ink">Suburb<input required name="suburb" placeholder="Burleigh Heads" className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label>
      <div className="grid grid-cols-[1fr_1.2fr] gap-4"><label className="text-sm font-medium text-ink">State<input required name="state" defaultValue="QLD" maxLength={3} className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base uppercase outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label><label className="text-sm font-medium text-ink">Postcode<input required name="postcode" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="4220" className="mt-2 h-12 w-full rounded-xl border border-line px-4 text-base outline-none focus:border-coastal focus:ring-4 focus:ring-coastal/10" /></label></div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-sky px-4 py-3 text-sm text-navy sm:col-span-2">{state.success}</p>}
      <button disabled={pending} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white sm:col-span-2 sm:justify-self-start">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}Add Property</button>
    </form>
  </section>;
}

export function ReadyToRentFlow({ properties, initialPropertyId }: { properties: Property[]; initialPropertyId?: string }) {
  const [current, setCurrent] = useState(0);
  const [propertyId, setPropertyId] = useState(properties.some((property) => property.id === initialPropertyId) ? initialPropertyId! : properties[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, ReadinessValue>>({});
  const [state, action, pending] = useActionState(submitReadyToRent, {});
  if (properties.length === 0) return <AddPropertyForm />;

  const question = readyToRentQuestions[current];
  const answered = answers[question.key];
  const isLast = current === readyToRentQuestions.length - 1;
  const completed = Object.keys(answers).length;
  const progress = (current + 1) * 10;

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-9">
      <div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold text-coastal">Question {current + 1} of 10</p><p className="text-sm font-medium text-muted">{progress}%</p></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${progress}% complete`}><div className="h-full rounded-full bg-coastal transition-all duration-300" style={{ width: `${progress}%` }} /></div>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-coastal">{question.category}</p>
      <h2 className="mt-3 max-w-3xl font-display text-3xl font-medium leading-tight text-navy sm:text-4xl">{question.text}</h2>
      <fieldset className="mt-8 grid gap-3 sm:grid-cols-2"><legend className="sr-only">Choose one answer</legend>{question.options.map((option) => { const selected = answered === option.value; return <label key={option.value} className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${selected ? "border-coastal bg-sky ring-2 ring-coastal/10" : "border-line hover:border-coastal/50"}`}><span className="flex items-center gap-3"><input type="radio" name={question.key} value={option.value} checked={selected} onChange={() => setAnswers((previous) => ({ ...previous, [question.key]: option.value }))} className="size-4 accent-[#247fa2]" /><span className="font-medium text-ink">{option.label}</span></span><span className="text-sm text-muted">{option.score}/10</span></label>; })}</fieldset>
      {state.error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="mt-9 flex items-center justify-between gap-4 border-t border-line pt-6"><button type="button" disabled={current === 0 || pending} onClick={() => setCurrent((value) => value - 1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-navy disabled:opacity-40"><ArrowLeft className="size-4" />Previous</button>{!isLast ? <button type="button" disabled={!answered} onClick={() => setCurrent((value) => value + 1)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-40">Next<ArrowRight className="size-4" /></button> : <form action={action}><input type="hidden" name="propertyId" value={propertyId} readOnly />{readyToRentQuestions.map((item) => <input key={item.key} type="hidden" name={`answer_${item.key}`} value={answers[item.key] ?? ""} readOnly />)}<button disabled={completed !== readyToRentQuestions.length || pending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-40">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}Submit Checklist</button></form>}</div>
    </section>
    <aside className="space-y-5"><div className="rounded-2xl border border-line bg-white p-5 shadow-card"><label className="text-sm font-semibold text-navy"><span className="mb-3 flex items-center gap-2"><Home className="size-4 text-coastal" />Property</span><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-medium outline-none focus:border-coastal">{properties.map((property) => <option key={property.id} value={property.id}>{property.address_line_1}, {property.suburb}</option>)}</select></label></div><div className="rounded-2xl bg-navy p-5 text-white"><p className="text-sm font-semibold">Checklist progress</p><p className="mt-3 text-3xl font-semibold">{completed}<span className="text-lg text-white/50"> / 10</span></p><p className="mt-2 text-sm leading-6 text-white/60">Answers are saved when the complete checklist is submitted.</p></div></aside>
  </div>;
}
