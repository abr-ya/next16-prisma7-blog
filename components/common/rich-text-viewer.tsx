"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface RichTextViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | Record<string, any>;
}

export const RichTextViewer = ({ content }: RichTextViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-4",
          },
        },
        code: {
          HTMLAttributes: {
            class: "font-mono text-sm bg-gray-200 p-2 rounded-md block overflow-x-auto mr-5",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "font-mono text-sm bg-gray-200 p-2 rounded-md block overflow-x-auto mr-5",
          },
        },
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-blue-500 underline underline-offset-2 hover:text-blue-700",
          target: "_blank",
          rel: "noreferrer",
        },
      }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });

  // Inject copy buttons for code blocks and inline code after render.
  useEffect(() => {
    if (!containerRef.current || !editor) return;

    const preBlocks = containerRef.current.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
      if (pre.querySelector(".copy-code-button")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code-button";
      button.setAttribute("aria-label", "Copy code");
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 9h11v11H9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 5h11v11H5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

      button.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code.trim());
          button.classList.add("copied");
          toast.success("Code copied");
          window.setTimeout(() => button.classList.remove("copied"), 1200);
        } catch {
          toast.error("Failed to copy code");
        }
      });

      pre.appendChild(button);
    });

    // Inject copy buttons for inline code after render.
    const inlineCodes = containerRef.current.querySelectorAll("code");
    inlineCodes.forEach((code) => {
      if (code.closest("pre")) return;
      if (code.querySelector(".copy-code-button")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code-button inline";
      button.setAttribute("aria-label", "Copy code");
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 9h11v11H9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 5h11v11H5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

      button.addEventListener("click", async () => {
        const text = code.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text.trim());
          button.classList.add("copied");
          toast.success("Code copied");
          window.setTimeout(() => button.classList.remove("copied"), 1200);
        } catch {
          toast.error("Failed to copy code");
        }
      });

      code.appendChild(button);
    });
  }, [content, editor]);

  return editor ? (
    <div ref={containerRef} className="rich-text-viewer">
      <EditorContent editor={editor} />
    </div>
  ) : null;
};
