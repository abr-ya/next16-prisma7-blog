import { getAllLinks } from "@/app/_data/links";
import { LinksTable } from "@/components/admin-pages/links-table";
import { AdminPageLayout, LinkForm } from "@/components/index";

export const dynamic = "force-dynamic";

const LinksPage = async () => {
  const links = await getAllLinks();

  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Links", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={<LinkForm />}>
      <LinksTable data={links} />
    </AdminPageLayout>
  );
};

export default LinksPage;
