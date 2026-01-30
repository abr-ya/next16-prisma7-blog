"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface RichTextViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | Record<string, any>;
}

export const RichTextViewer = ({ content }: RichTextViewerProps) => {
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

  return editor ? <EditorContent editor={editor} /> : null;
};
