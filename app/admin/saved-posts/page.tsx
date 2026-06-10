import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const SavedPostsPage = async () => {
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Saved Posts", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={null}>
      Saved Posts Page
    </AdminPageLayout>
  );
};

export default SavedPostsPage;
