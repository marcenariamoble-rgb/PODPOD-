"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Convida o vendedor a permitir notificações do browser (avisos fora do site / ecrã bloqueado).
 * Só avalia `Notification` após montar no cliente para evitar mismatch de hidratação.
 */
export function VendedorNotificacoesOptIn() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [message, setMessage] = useState("");

  async function ensurePushSubscription() {
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
      setMessage("Este dispositivo não suporta notificações push.");
      return false;
    }

    const keyRes = await fetch("/api/vendedor/push-subscriptions", {
      method: "GET",
      cache: "no-store",
    });
    if (!keyRes.ok) {
      setMessage("Não foi possível iniciar notificações.");
      return false;
    }
    const keyData = (await keyRes.json()) as { publicKey?: string };
    if (!keyData.publicKey) {
      setMessage("Chave de notificação não configurada no servidor.");
      return false;
    }

    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(keyData.publicKey),
      }));

    const saveRes = await fetch("/api/vendedor/push-subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!saveRes.ok) {
      setMessage("Falha ao guardar inscrição de notificação.");
      return false;
    }
    return true;
  }

  useEffect(() => {
    setMounted(true);
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    const current = Notification.permission;
    setPermission(current);
    if (current === "granted") {
      void ensurePushSubscription();
    }
  }, []);

  if (!mounted || dismissed) return null;
  if (permission === "unsupported" || permission === "granted") {
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
                if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
                  setMessage("Este dispositivo não suporta notificações push.");
                  return;
                }

                const nextPermission = await Notification.requestPermission();
                setPermission(nextPermission);
                if (nextPermission !== "granted") {
                  setMessage("Permissão não concedida.");
                  return;
                }

                const ok = await ensurePushSubscription();
                if (ok) {
                  setMessage("Avisos ativados. Você receberá alerta mesmo com app fechado.");
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            Permitir avisos
          </Button>
        </div>
      </div>
      {message ? (
        <p className="mt-2 text-xs font-medium text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
