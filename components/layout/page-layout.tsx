import Link from "next/link";
import { Button } from "..";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showBackLink?: boolean;
}

export const PageLayout = ({ title, children, className, showBackLink = true }: PageLayoutProps) => (
  <main className={cn("min-h-screen px-4 py-16", className)}>
    <div className="max-w-3xl mx-auto">
      {showBackLink ? (
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      ) : null}
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      {children}
    </div>
  </main>
);
