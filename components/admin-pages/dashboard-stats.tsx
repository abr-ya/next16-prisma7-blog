import { Fragment } from "react/jsx-runtime";
import { DashboardStatsCard } from "./dashboard-stats-card";

interface DashboardStatsProps {
  totalPosts: number;
  totalCategories: number;
  totalViews: number;
}

export const DashboardStats = ({ totalPosts, totalCategories, totalViews }: DashboardStatsProps) => {
  console.log("DashboardStats props:", { totalPosts, totalCategories, totalViews });

  const data = [
    { title: "Total Posts", value: totalPosts },
    { title: "Total Categories", value: totalCategories },
    { title: "Total Views", value: totalViews },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full px-6">
      {data.map((item) => (
        <Fragment key={item.title}>
          <DashboardStatsCard title={item.title} value={item.value} />
        </Fragment>
      ))}
    </div>
  );
};
