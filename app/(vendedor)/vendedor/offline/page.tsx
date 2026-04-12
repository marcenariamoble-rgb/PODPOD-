import Link from "next/link";
import { WifiOff } from "lucide-react";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";

export default function VendedorOfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 pb-24 pt-12">
      <PodPodMark variant="hero" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" />
      <div className="mt-5 flex size-14 items-center justify-center rounded-2xl bg-muted/80">
        <WifiOff className="size-7 text-muted-foreground" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-center font-heading text-xl font-bold tracking-tight">
        Sem conexão
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm font-medium text-muted-foreground">
        Não foi possível carregar os dados. Verifique sua internet e tente
        novamente.
      </p>
      <Link
        href="/vendedor"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-8 rounded-2xl px-8 font-semibold"
        )}
      >
        Tentar de novo
      </Link>
    </div>
  );
}
