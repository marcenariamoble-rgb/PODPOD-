import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VendedorContaSenhaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">
            Minha senha
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Altere a senha da sua conta de vendedor
          </p>
        </div>
        <Link
          href="/vendedor"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Início
        </Link>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Nova senha</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
