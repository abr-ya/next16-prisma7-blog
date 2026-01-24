import { DashbordLayout } from "@/components/layout/admin-page-layout";
import { authSession, requireAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  await requireAuth();
  const session = await authSession();

  return (
    // todo: counts / chart + categories
    <DashbordLayout bottomSlot1={<div>bottomSlot1</div>} bottomSlot2={<div>bottomSlot2</div>}>
      {/* todo: Link to Publick page */}
      <h1 className="font-semibold text-2xl">Hi, {session?.user.name}</h1>
    </DashbordLayout>
  );
};

export default DashboardPage;
