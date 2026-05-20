"use client";

import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ICodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock = ({ code, language }: ICodeBlockProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <SyntaxHighlighter
      language={language}
      style={resolvedTheme === "dark" ? oneDark : oneLight}
      customStyle={{
        margin: "0 0 1rem",
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
      }}
      PreTag="div"
    >
      {code}
    </SyntaxHighlighter>
  );
};
