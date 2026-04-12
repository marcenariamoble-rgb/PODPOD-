import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export const nativeSelectClassName = cn(
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium shadow-sm outline-none transition-colors",
  "focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/35",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
    </div>
  );
}
