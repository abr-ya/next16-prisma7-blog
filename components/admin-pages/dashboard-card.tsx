interface DashboardCardProps {
  totalPosts: number;
  totalCategories: number;
  totalViews: number;
}

export const DashboardCard = ({ totalPosts, totalCategories, totalViews }: DashboardCardProps) => {
  console.log("DashboardCard props:", { totalPosts, totalCategories, totalViews });

  return <div>DashboardCard</div>;
};
