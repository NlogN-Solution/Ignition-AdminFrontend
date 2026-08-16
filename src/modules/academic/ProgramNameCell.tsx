import { Skeleton } from "@/components/ui/skeleton";
import { useProgram } from "./hooks";

export function ProgramNameCell({ programId }: { programId: string | null }) {
  const { data, isLoading } = useProgram(programId ?? undefined);

  if (!programId) return <span className="text-muted-foreground">—</span>;
  if (isLoading) return <Skeleton className="h-4 w-28" />;
  if (!data) return <span className="font-mono text-xs text-muted-foreground">#{programId.slice(0, 8)}</span>;

  return <span className="text-foreground">{data.name}</span>;
}
