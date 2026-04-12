"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Convida o vendedor a permitir notificações do browser (avisos fora do site / ecrã bloqueado).
 */
export function VendedorNotificacoesOptIn() {
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (dismissed) return null;
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return null;
  }
  if (Notification.permission !== "default") return null;

  return (
    <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.07] px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Bell className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Avisos quando chegar pedido do cardápio
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Permita notificações para ser avisado no telemóvel ou com o ecrã bloqueado (depende do
              sistema). O contacto com o cliente continua pelo botão WhatsApp em Pedidos.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold"
            onClick={() => setDismissed(true)}
          >
            Agora não
          </Button>
          <Button
            type="button"
            size="sm"
            className={cn("rounded-xl font-semibold")}
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
