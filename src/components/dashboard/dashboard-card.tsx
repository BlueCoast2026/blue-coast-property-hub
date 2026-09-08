import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

type Props = {
  title: string;
  description: string;
  action?: string;
  href?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

export function DashboardCard({ title, description, action, href, icon: Icon, comingSoon }: Props) {
  return (
    <article className="group flex min-h-72 flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-sky text-coastal"><Icon className="size-5" /></span>
        {comingSoon && <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">Coming Soon</span>}
      </div>
      <h2 className="mt-8 text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-3 flex-1 text-base leading-7 text-muted">{description}</p>
      {action && href && (
        <Link href={href} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-navy underline-offset-4 hover:underline">
          {action}<ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </article>
  );
}
