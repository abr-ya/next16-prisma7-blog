import { getAdminUserDirectory } from "@/app/_data/users";
import { UsersTable } from "@/components/admin-pages/users-table";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-utils";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Users", to: null },
];

type AdminUsersPageProps = {
  searchParams?: Promise<{
    email?: string | string[];
    page?: string | string[];
  }>;
};

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const parsePage = (value: string | undefined) => {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
};

const AdminUsersPage = async ({ searchParams }: AdminUsersPageProps) => {
  await requireAdmin();

  const params = await searchParams;
  const directory = await getAdminUserDirectory({
    email: firstValue(params?.email),
    page: parsePage(firstValue(params?.page)),
  });

  return (
    <AdminPageLayout breadcrumbs={breadcrumbs}>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={directory.items}
              total={directory.total}
              page={directory.page}
              totalPages={directory.totalPages}
              emailSearch={directory.emailSearch}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminUsersPage;
