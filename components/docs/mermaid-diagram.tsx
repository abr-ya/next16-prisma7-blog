"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

interface IMermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram = ({ chart }: IMermaidDiagramProps) => {
  const diagramId = useId().replace(/:/g, "");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "default",
        securityLevel: "strict",
      });

      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${diagramId}`, chart.trim());
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invalid Mermaid diagram");
          setSvg("");
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId, resolvedTheme]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-destructive/50 bg-muted p-4 text-sm">
        <p className="mb-2 font-medium text-destructive">Mermaid: {error}</p>
        <pre className="overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return <div className="my-4 h-24 animate-pulse rounded-lg bg-muted" aria-hidden />;
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto rounded-lg border bg-muted/30 p-4 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
