import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface RecentDocumentsFallbackProps {
  className?: string;
}

/** Shown while recent posts are loading (does not block Hero / About). */
export function RecentDocumentsFallback({ className }: RecentDocumentsFallbackProps) {
  return (
    <section className={cn("px-4 py-10", className)}>
      <h2 className="mb-4 text-2xl font-bold">Recent Markdown Documents</h2>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>Loading documents...</span>
      </div>
    </section>
  );
}
