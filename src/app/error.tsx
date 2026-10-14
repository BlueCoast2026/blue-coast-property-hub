"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-mist px-5"><section className="max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-card"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-coastal">Blue Coast Property Hub</p><h1 className="mt-4 font-display text-4xl font-medium text-navy">This page could not open</h1><p className="mt-4 leading-7 text-muted">Please try again or refresh the page. If the problem continues, share the page address and error reference with an administrator.</p>{error.digest && <p className="mt-4 text-xs text-muted">Error reference: {error.digest}</p>}<div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={retry} className="h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white">Try again</button><a href="/login" className="inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold text-navy">Return to sign in</a></div></section></main>;
}
