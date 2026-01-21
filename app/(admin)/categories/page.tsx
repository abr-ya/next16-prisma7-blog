import { CategoryForm } from "@/components/admin-pages/category-form";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  await requireAuth();

  return (
    <div>
      CategoriesPage
      <CategoryForm />
    </div>
  );
};

export default CategoriesPage;
