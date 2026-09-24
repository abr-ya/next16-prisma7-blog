import { SITE_CONTENT_WIDTH, type SiteContentWidth } from "@/lib/site-content-width";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  contentWidth?: SiteContentWidth;
  headerAction?: React.ReactNode;
}

export const PageLayout = ({ title, children, className, contentWidth = "narrow", headerAction }: PageLayoutProps) => (
  <main className={cn("min-h-screen px-4 py-16", className)}>
    <div className={cn("mx-auto", SITE_CONTENT_WIDTH[contentWidth])}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        {headerAction}
      </div>
      {children}
    </div>
  </main>
);
