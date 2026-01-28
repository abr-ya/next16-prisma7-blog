import { AdminPageLayout, LinkForm } from "@/components/index";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const LinksPage = async () => {
  await requireAuth();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Links", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={<LinkForm />}>
      todo: (My) Links Table
    </AdminPageLayout>
  );
};

export default LinksPage;
