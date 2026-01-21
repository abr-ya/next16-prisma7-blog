import { getCategories } from "@/app/_data/categories";
import { CategoriesTable, CategoryForm } from "@/components/index";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  await requireAuth();
  const categories = await getCategories();

  console.log(categories.map((cat: { name: string }) => cat.name));

  return (
    <>
      <CategoriesTable categories={categories} />
      <CategoryForm />
    </>
  );
};

export default CategoriesPage;
