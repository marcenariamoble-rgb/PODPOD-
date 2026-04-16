"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
}

export function VendedorInstallPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showIosHelp = useMemo(
    () => !installed && !dismissed && !installEvent && isIosSafari(),
    [dismissed, installEvent, installed]
  );

  if (dismissed || installed) return null;

  if (installEvent) {
    return (
      <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.07] px-3 py-3 shadow-sm sm:px-4">
        <p className="text-sm font-semibold text-foreground">Instalar app no celular</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          Instale o PodPod para abrir mais rapido e receber avisos com mais facilidade.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-xl font-semibold"
            onClick={async () => {
              await installEvent.prompt();
              const result = await installEvent.userChoice;
              if (result.outcome === "dismissed") {
                setDismissed(true);
              }
            }}
          >
            <Download className="mr-1 size-4" />
            Instalar agora
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={() => setDismissed(true)}
          >
            Depois
          </Button>
        </div>
      </div>
    );
  }

  if (showIosHelp) {
    return (
      <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.07] px-3 py-3 shadow-sm sm:px-4">
        <p className="text-sm font-semibold text-foreground">Instalar app no iPhone</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          No Safari, toque em <span className="font-semibold">Partilhar</span> e depois em{" "}
          <span className="font-semibold">Adicionar ao Ecra de inicio</span>.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={() => setDismissed(true)}
          >
            <Share2 className="mr-1 size-4" />
            Entendi
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
