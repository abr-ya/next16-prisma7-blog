import Link from "next/link";
import { Button } from "..";
import { ArrowLeft } from "lucide-react";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const PageLayout = ({ title, children }: PageLayoutProps) => (
  <main className="min-h-screen py-16 px-4">
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" asChild className="mb-8">
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      {children}
    </div>
  </main>
);
