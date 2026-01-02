import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { components } from "./md-components-config";

interface IMdRendererProps {
  content: string;
}

export const MdRenderer = ({ content }: IMdRendererProps) => (
  // @ts-expect-error Markdown types is correct!
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
    {content}
  </ReactMarkdown>
);
