import { getCategories } from "@/app/_data/categories";
import { DashboardStats, DashboardCategories, DashboardChart, DashbordLayout } from "@/components/index";
import { authSession, requireAuth } from "@/lib/auth-utils";
import { Rocket } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  await requireAuth();
  const session = await authSession();
  const categories = await getCategories(); // todo: to user's categories?

  return (
    // todo: counts / chart + categories
    <DashbordLayout
      bottomSlot1={<DashboardStats totalPosts={0} totalCategories={0} totalViews={0} />}
      bottomSlot2={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <DashboardChart />
          <DashboardCategories categories={categories} />
        </div>
      }
    >
      <Link href="/" target="_blank" className="text-blue-600 font-medium gap-2 items-center flex">
        <span>Visit public site</span>
        <Rocket />
      </Link>
      <h1 className="font-semibold text-2xl">Hi, {session?.user.name}</h1>
    </DashbordLayout>
  );
};

export default DashboardPage;
