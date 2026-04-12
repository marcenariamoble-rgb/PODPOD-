import { cn } from "@/lib/utils";
import { PodPodMark } from "@/components/brand/podpod-mark";

/** Bloco suave para listas/tabelas vazias — ícone discreto + texto. */
export function PodPodEmptyHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center",
        className
      )}
    >
      <PodPodMark variant="empty" decorative />
      <p className="max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
