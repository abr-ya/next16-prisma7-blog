import { getCategories } from "@/app/_data/categories";
import { CategoryForm } from "@/components/admin-pages/category-form";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  await requireAuth();
  const categories = await getCategories();

  console.log(categories.map((cat: { name: string }) => cat.name));

  return (
    <div>
      CategoriesPage
      <CategoryForm />
    </div>
  );
};

export default CategoriesPage;
