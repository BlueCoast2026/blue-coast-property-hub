"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard, UserRound } from "lucide-react";
import { RealtyLogo } from "@/components/realty-logo";
import { navGroups } from "./nav-items";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
    <div className="flex items-center justify-between"><RealtyLogo size="small" /><button onClick={() => setOpen((value) => !value)} className="grid size-11 place-items-center rounded-xl border border-line text-navy" aria-label="Toggle navigation" aria-expanded={open}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
    {open && <nav className="mt-3 max-h-[75vh] space-y-5 overflow-y-auto border-t border-line pt-4" aria-label="Mobile navigation">
      <Link href="/dashboard" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-mist"><LayoutDashboard className="size-5 text-coastal" />Dashboard</Link>
      {navGroups.map((group) => <div key={group.label}><p className="mb-1 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{group.label}</p>{group.items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-mist"><Icon className="size-5 text-coastal" />{label}</Link>)}</div>)}
      <div><p className="mb-1 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Account</p><Link href="/dashboard/account" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-mist"><UserRound className="size-5 text-coastal" />Profile</Link></div>
    </nav>}
  </header>;
}
