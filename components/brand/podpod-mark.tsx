import { cn } from "@/lib/utils";

const VARIANT_CLASS: Record<
  "sidebar" | "nav" | "hero" | "splash" | "empty",
  string
> = {
  sidebar:
    "h-11 w-11 rounded-2xl object-cover shadow-[var(--shadow-soft)] ring-1 ring-primary/15",
  nav: "h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-primary/10",
  hero: "h-20 w-20 sm:h-[5.5rem] sm:w-[5.5rem] rounded-3xl object-cover shadow-[var(--shadow-soft)] ring-1 ring-primary/20",
  splash:
    "h-24 w-24 sm:h-28 sm:w-28 rounded-[1.75rem] object-cover shadow-[0_0_40px_oklch(0.55_0.2_292_/_0.22)] ring-1 ring-primary/25 animate-in fade-in zoom-in-95 duration-300",
  empty:
    "h-14 w-14 rounded-2xl object-cover opacity-[0.36] saturate-[0.92] contrast-[1.02]",
};

export function PodPodMark({
  variant = "sidebar",
  className,
  /** Se definido, o ícone é anunciado por leitores de ecrã; caso contrário é decorativo. */
  label = "PodPod",
  decorative = false,
}: {
  variant?: keyof typeof VARIANT_CLASS;
  className?: string;
  label?: string;
  /** `true` = apenas visual (empty states); ignora `label`. */
  decorative?: boolean;
}) {
  const alt = decorative ? "" : label;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset estático em /public; evita config extra do Image
    <img
      src="/icon-192.png"
      alt={alt}
      width={192}
      height={192}
      decoding="async"
      className={cn(VARIANT_CLASS[variant], className)}
      aria-hidden={decorative || undefined}
    />
  );
}
