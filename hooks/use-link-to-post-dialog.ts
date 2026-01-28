import { create } from "zustand";

interface ILinkToPostDialogProps {
  linkID: string | null;
  setLinkID: (linkID: string | null) => void;
  postID: string | null;
  setPostID: (postID: string | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useLinkToPostDialog = create<ILinkToPostDialogProps>((set) => ({
  open: false,
  setOpen: (open: boolean) => set({ open }),
  linkID: null,
  setLinkID: (linkID: string | null) => set({ linkID }),
  postID: null,
  setPostID: (postID: string | null) => set({ postID }),
}));
