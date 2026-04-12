import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiTone = "default" | "success" | "warning" | "finance";

const toneStyles: Record<KpiTone, { iconWrap: string; icon: string }> = {
  default: {
    iconWrap: "bg-primary/10 text-primary",
    icon: "text-primary",
  },
  success: {
    iconWrap: "bg-success/12 text-success",
    icon: "text-success",
  },
  warning: {
    iconWrap: "bg-warning/20 text-warning",
    icon: "text-warning",
  },
  finance: {
    iconWrap: "bg-accent text-accent-foreground",
    icon: "text-primary",
  },
};

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "default",
  className,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  icon: LucideIcon;
  tone?: KpiTone;
  className?: string;
  highlight?: boolean;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md",
        highlight &&
          "border-warning/45 bg-gradient-to-br from-warning/12 via-card to-card ring-1 ring-warning/20",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold leading-snug text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            t.iconWrap
          )}
        >
          <Icon className={cn("size-5", t.icon)} strokeWidth={2.25} />
        </span>
      </div>
      <div className="mt-auto space-y-1">
        <p className="font-heading text-3xl font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[1.75rem]">
          {value}
        </p>
        {sublabel ? (
          <div className="text-xs font-medium text-muted-foreground">
            {sublabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
