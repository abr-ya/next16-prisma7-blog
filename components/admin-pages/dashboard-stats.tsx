interface DashboardStatsProps {
  totalPosts: number;
  totalCategories: number;
  totalViews: number;
}

export const DashboardStats = ({ totalPosts, totalCategories, totalViews }: DashboardStatsProps) => {
  console.log("DashboardStats props:", { totalPosts, totalCategories, totalViews });

  return <div>DashboardStats</div>;
};
