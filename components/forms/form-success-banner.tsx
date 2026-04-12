export function FormSuccessBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-sm font-medium text-success"
    >
      {message}
    </div>
  );
}
