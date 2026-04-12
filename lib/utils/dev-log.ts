/** Regista erros em desenvolvimento sem poluir logs em produção. */
export function logDevError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  console.error(`[PodPod:${context}]`, error);
}
