import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-mist lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-lg">
          <BrandMark />
          {children}
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-navy lg:block">
        <div className="absolute inset-0 coastal-photo" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16">
          <div className="mb-6 h-px w-14 bg-gold" />
          <p className="max-w-lg text-3xl font-medium leading-tight tracking-tight">A clearer view of your property, from coast to keys.</p>
          <p className="mt-4 max-w-md text-base leading-7 text-white/70">Everything you need to stay informed, organised and ready for what comes next.</p>
        </div>
      </aside>
    </main>
  );
}
