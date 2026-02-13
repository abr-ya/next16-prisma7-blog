import { Post } from "@/generated/prisma/client";

interface DashboardChartProps {
  data?: Post[];
}

export const DashboardChart = ({ data }: DashboardChartProps) => {
  console.log("DashboardChart", data?.length);

  return <div>DashboardChart</div>;
};
