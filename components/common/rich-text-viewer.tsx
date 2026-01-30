"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | Record<string, any>;
}

export const RichTextViewer = ({ content }: RichTextViewerProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: false,
    immediatelyRender: false,
  });

  return editor ? <EditorContent editor={editor} /> : null;
};
