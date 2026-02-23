import { getAllLinks } from "@/app/_data/links";
import { LinksTable } from "@/components/admin-pages/links-table";
import { AdminPageLayout, LinkForm } from "@/components/index";
import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const LinksPage = async () => {
  await requireAuth();
  const links = await getAllLinks();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Links", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={<LinkForm />}>
      <LinksTable data={links} />
    </AdminPageLayout>
  );
};

export default LinksPage;
