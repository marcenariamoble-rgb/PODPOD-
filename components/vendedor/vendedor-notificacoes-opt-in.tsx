"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Convida o vendedor a permitir notificações do browser (avisos fora do site / ecrã bloqueado).
 * Só avalia `Notification` após montar no cliente para evitar mismatch de hidratação.
 */
export function VendedorNotificacoesOptIn() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;
  if (typeof Notification === "undefined" || Notification.permission !== "default") {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.07] px-3 py-3 shadow-sm sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Bell className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Avisos quando chegar pedido do cardápio
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Permita notificações para ser avisado no telemóvel ou com o ecrã bloqueado (depende do
              sistema). O contacto com o cliente continua pelo botão WhatsApp em Pedidos.
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-0 flex-1 rounded-xl font-semibold sm:flex-initial"
            onClick={() => setDismissed(true)}
          >
            Agora não
          </Button>
          <Button
            type="button"
            size="sm"
            className={cn("min-w-0 flex-1 rounded-xl font-semibold sm:flex-initial")}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await Notification.requestPermission();
              } finally {
                setBusy(false);
                setDismissed(true);
              }
            }}
          >
            Permitir avisos
          </Button>
        </div>
      </div>
    </div>
  );
}
