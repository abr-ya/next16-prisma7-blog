import { ReactNode } from "react";

export const components = {
  h1: ({ children }: { children: ReactNode }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
  h2: ({ children }: { children: ReactNode }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
  h3: ({ children }: { children: ReactNode }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
  p: ({ children }: { children: ReactNode }) => <p className="mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }: { children: ReactNode }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  ol: ({ children }: { children: ReactNode }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  li: ({ children }: { children: ReactNode }) => <li className="mb-1">{children}</li>,
  code: ({ children, className }: { children: ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
    ) : (
      <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm mb-4">{children}</code>
    );
  },
  pre: ({ children }: { children: ReactNode }) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
  ),
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-l-4 border-border pl-4 italic my-4">{children}</blockquote>
  ),
  a: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};
