import { getCategories } from "@/app/_data/categories";
import { getAllUserPosts } from "@/app/_data/posts";
import { DashboardStats, DashboardCategories, DashboardChart, DashbordLayout } from "@/components/index";
import { Post } from "@/generated/prisma/client";
import { authSession, requireAuth } from "@/lib/auth-utils";
import { Rocket } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  await requireAuth();
  const session = await authSession();
  const categories = await getCategories(); // todo: to user's categories?
  const posts = await getAllUserPosts();
  const totalViews = posts.reduce((acc: number, item: Post) => acc + item.views!, 0);

  return (
    <DashbordLayout
      bottomSlot1={
        <DashboardStats totalPosts={posts.length} totalCategories={categories.length} totalViews={totalViews} />
      }
      bottomSlot2={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <DashboardChart data={posts} />
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
