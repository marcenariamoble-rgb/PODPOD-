"use client";

import { useEffect, useRef } from "react";

/**
 * Atualiza o contador de pedidos do cardápio não lidos sem recarregar a página.
 * — vibra no telemóvel quando o número sobe;
 * — se o utilizador já tiver dado permissão a notificações do browser, mostra um aviso breve.
 */
export function VendedorPedidosCardapioPoller({
  initialCount,
  onCount,
}: {
  initialCount: number;
  onCount: (n: number) => void;
}) {
  const lastRef = useRef(initialCount);

  useEffect(() => {
    lastRef.current = initialCount;
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const res = await fetch("/api/vendedor/cardapio-notificacoes/count", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { count?: number };
        const count = typeof data.count === "number" ? data.count : lastRef.current;
        const prev = lastRef.current;
        if (count > prev) {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([100, 40, 100]);
          }
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            try {
              const n = new Notification("PodPod — novo pedido no cardápio", {
                body: "Abra Pedidos para falar com o cliente no WhatsApp.",
                tag: "podpod-cardapio-pedido",
                requireInteraction: false,
              });
              n.onclick = () => {
                try {
                  window.focus();
                  window.location.href = "/vendedor/pedidos-cardapio";
                } catch {
                  /* ignore */
                }
                n.close();
              };
            } catch {
              /* ignore */
            }
          }
        }
        lastRef.current = count;
        onCount(count);
      } catch {
        /* rede offline, etc. */
      }
    };

    const start = () => {
      void tick();
    };
    // Primeira verificação pouco depois de abrir (mais rápido que só o intervalo)
    const t0 = setTimeout(start, 2500);
    const id = setInterval(start, 32000);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [onCount]);

  return null;
}
