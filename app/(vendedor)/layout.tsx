import { AppProviders } from "@/components/providers/app-providers";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

export default function VendedorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <RegisterServiceWorker />
      {children}
    </AppProviders>
  );
}
