import { Spinner } from "@/components/ui/spinner";

/** Shown while recent posts are loading (does not block Hero / About). */
export function RecentDocumentsFallback() {
  return (
    <section className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-4">Recent Markdown Documents</h2>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>Loading documents...</span>
      </div>
    </section>
  );
}
