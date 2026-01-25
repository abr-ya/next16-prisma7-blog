import { AdminPageLayout } from "@/components/index";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const SavedPostsPage = async () => {
  await requireAuth();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Saved Posts", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={null}>
      Saved Posts Page
    </AdminPageLayout>
  );
};

export default SavedPostsPage;
