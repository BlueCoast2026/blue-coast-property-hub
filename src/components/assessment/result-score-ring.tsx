const ringColours = {
  green: "#15803d",
  orange: "#d97706",
  red: "#dc2626",
} as const;

export function ResultScoreRing({ score, level, dark = false }: { score: number; level: string; dark?: boolean }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const colour = ringColours[level as keyof typeof ringColours] ?? ringColours.orange;
  const track = dark ? "rgba(255,255,255,0.18)" : "#e5e7eb";

  return <div
    role="img"
    aria-label={`${safeScore} out of 100, ${level} result`}
    className="relative grid size-40 place-items-center rounded-full sm:size-44"
    style={{ background: `conic-gradient(${colour} ${safeScore * 3.6}deg, ${track} 0deg)` }}
  >
    <div className={`grid size-[calc(100%-14px)] place-items-center rounded-full ${dark ? "bg-navy" : "bg-white"}`}>
      <div><span className="font-display text-5xl font-medium">{safeScore}</span><span className={dark ? "text-white/50" : "text-muted"}>/100</span></div>
    </div>
  </div>;
}
