import { PodPodMark } from "@/components/brand/podpod-mark";

/** Ecrã de carregamento dentro da área do vendedor (PWA / navegação). */
export default function VendedorPortalLoading() {
  return (
    <div
      className="flex min-h-[min(70dvh,32rem)] flex-col items-center justify-center gap-5 px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <PodPodMark variant="splash" />
      <p className="text-sm font-medium text-muted-foreground">Carregando…</p>
    </div>
  );
}
