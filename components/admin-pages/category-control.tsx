import { useCategoryDialog } from "@/hooks";
import { Edit } from "lucide-react";

interface CategoryControlProps {
  name: string;
  id: string;
}

export const CategoryControl = ({ name, id }: CategoryControlProps) => {
  const { setOpen, setCategory } = useCategoryDialog();
  const editClickHandler = () => {
    setOpen(true);
    setCategory({ id, name });
  };

  return (
    <div className="flex justify-end gap-6">
      <div className="cursor-pointer" title="Edit" onClick={editClickHandler}>
        <Edit />
      </div>
    </div>
  );
};
