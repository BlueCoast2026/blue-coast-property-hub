import Image from "next/image";
import Link from "next/link";

export function RealtyLogo({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const widthClass = size === "small" ? "w-24" : size === "large" ? "w-44 sm:w-48" : "w-36";
  return <Link href="/dashboard" className="inline-block overflow-hidden rounded-2xl bg-navy shadow-sm" aria-label="Blue Coast Realty Property Hub">
    <Image src="/brand/blue-coast-realty-logo.png" alt="Blue Coast Realty" width={813} height={640} priority className={`h-auto ${widthClass}`} />
  </Link>;
}
