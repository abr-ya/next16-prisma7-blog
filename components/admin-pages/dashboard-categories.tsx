import { Category } from "@/generated/prisma/client";

interface IDashboardCategoriesProps {
  categories: Category[];
}

export const DashboardCategories = ({ categories }: IDashboardCategoriesProps) => {
  return <div>DashboardCategories: {categories.length}</div>;
};
