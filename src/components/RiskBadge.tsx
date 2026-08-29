import { cn } from "@/lib/utils";

export function RiskBadge({
  score,
  label,
  className,
}: {
  score: number;
  label: "Low" | "Medium" | "High";
  className?: string;
}) {
  const tone =
    label === "Low"
      ? "border-positive/40 bg-positive/12 text-positive"
      : label === "Medium"
        ? "border-warning/40 bg-warning/12 text-warning"
        : "border-danger/40 bg-danger/12 text-danger";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        tone,
        className,
      )}
    >
      <span className="tabular">{score.toFixed(1)}</span>
      <span className="opacity-70">·</span>
      {label} risk
    </span>
  );
}

export function EVBadge({ ev }: { ev: number }) {
  const positive = ev > 0;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold",
        positive
          ? "border-positive/40 bg-positive/12 text-positive"
          : "border-edge bg-muted text-muted-foreground",
      )}
    >
      {positive ? "+" : ""}
      {ev.toFixed(2)}% EV
    </span>
  );
}
