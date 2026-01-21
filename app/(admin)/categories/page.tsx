import { getCategories } from "@/app/_data/categories";
import { AdminPageLayout, CategoriesTable, CategoryForm } from "@/components/index";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  await requireAuth();
  const categories = await getCategories();

  console.log(categories.map((cat: { name: string }) => cat.name));

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Categories", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={<CategoryForm />}>
      <CategoriesTable categories={categories} />
    </AdminPageLayout>
  );
};

export default CategoriesPage;
