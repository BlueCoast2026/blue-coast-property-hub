import Link from "next/link";
import { UserRound, LogOut, LayoutDashboard } from "lucide-react";
import { RealtyLogo } from "@/components/realty-logo";
import { navGroups } from "./nav-items";
import { logout } from "@/app/actions/auth";

const linkClass = "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/8 hover:text-white";

export function Sidebar() {
  return <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col overflow-y-auto bg-navy px-5 py-7 text-white lg:flex">
    <div className="px-2"><RealtyLogo /></div>
    <nav className="mt-9 space-y-7" aria-label="Main navigation">
      <div><Link href="/dashboard" className={linkClass}><LayoutDashboard className="size-5" />Dashboard</Link></div>
      {navGroups.map((group) => <div key={group.label}><p className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{group.label}</p><div className="space-y-1">{group.items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={linkClass}><Icon className="size-5" />{label}</Link>)}</div></div>)}
    </nav>
    <div className="mt-auto space-y-1 border-t border-white/10 pt-5">
      <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Account</p>
      <Link href="/dashboard/account" className={linkClass}><UserRound className="size-5" />Profile</Link>
      <form action={logout}><button className={`${linkClass} w-full`}><LogOut className="size-5" />Log Out</button></form>
    </div>
  </aside>;
}
