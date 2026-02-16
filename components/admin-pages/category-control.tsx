interface CategoryControlProps {
  name: string;
  id: string;
}

export const CategoryControl = ({ name, id }: CategoryControlProps) => {
  return (
    <div className="flex justify-end gap-6">
      Category Control: {name} ({id})
    </div>
  );
};
