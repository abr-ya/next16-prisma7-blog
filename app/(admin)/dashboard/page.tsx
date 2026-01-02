import { requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  await requireAuth();

  return <div>DashboardPage</div>;
};

export default DashboardPage;
