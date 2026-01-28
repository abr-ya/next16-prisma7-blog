import { create } from "zustand";

export interface ILink {
  name: string;
  description?: string;
  id: string;
  url: string;
}

interface ILinkDialogProps {
  link: ILink | undefined;
  setLink: (link: ILink | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useLinkDialog = create<ILinkDialogProps>((set) => ({
  open: false,
  setOpen: (open: boolean) => set({ open }),
  link: undefined,
  setLink: (link: ILink | undefined) => set({ link }),
}));
