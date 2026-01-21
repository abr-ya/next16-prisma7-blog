import { create } from "zustand";

export interface ICategory {
  name: string;
  id: string;
}

interface ICategoryDialogProps {
  category: ICategory | undefined;
  setCategory: (category: ICategory | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCategoryDialog = create<ICategoryDialogProps>((set) => ({
  open: false,
  setOpen: (open: boolean) => set({ open }),
  category: undefined,
  setCategory: (category: ICategory | undefined) => set({ category }),
}));
