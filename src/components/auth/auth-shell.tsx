import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-mist lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-lg">
          <Link href="/" className="inline-block overflow-hidden rounded-2xl bg-navy shadow-sm" aria-label="Blue Coast Realty home">
            <Image src="/brand/blue-coast-realty-logo.png" alt="Blue Coast Realty" width={813} height={640} priority className="h-auto w-44 sm:w-48" />
          </Link>
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
