import { getAllMdDocs } from "@/app/_data/getMdDocs";
import { AdminPageLayout, MdDocsTable } from "@/components/index";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MdDocsAdminPage = async () => {
  const posts = await getAllMdDocs();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "MD Docs", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <div className="flex gap-2">
          <Link href="/md-docs/new">
            <Button className="cursor-pointer">Add Doc</Button>
          </Link>
        </div>
      }
    >
      <MdDocsTable data={posts} />
    </AdminPageLayout>
  );
};

export default MdDocsAdminPage;
