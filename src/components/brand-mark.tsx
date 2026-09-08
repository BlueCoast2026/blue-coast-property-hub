import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="inline-flex items-center gap-3" aria-label="Blue Coast Property Hub">
      <span className="grid size-10 place-items-center rounded-xl bg-coastal text-white shadow-sm">
        <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden="true">
          <path d="M5 18.5 16 9l11 9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17.5V25h14v-7.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M6 27c4-2 7-2 10 0 3 2 6 2 10 0" stroke="#9ED7EA" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-[0.12em] text-current">BLUE COAST</span>
          <span className="block text-xs font-medium tracking-[0.08em] text-current/65">PROPERTY HUB</span>
        </span>
      )}
    </Link>
  );
}
