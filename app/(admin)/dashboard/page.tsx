import { requireAuth } from "@/lib/auth-utils";

const DashboardPage = async () => {
  await requireAuth();

  return <div>DashboardPage</div>;
};

export default DashboardPage;
