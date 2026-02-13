import { FC } from "react";
import { Combine } from "lucide-react";
import { Card, CardTitle, CardDescription, CardHeader } from "..";

interface DashboardStatsCardProps {
  title: string;
  value: number;
}

export const DashboardStatsCard: FC<DashboardStatsCardProps> = ({ title, value }) => (
  <Card className="shadow-lg min-h-36 flex items-center flex-col justify-center">
    <CardHeader className="flex flex-col w-full">
      <div className="w-full flex justify-between">
        <CardDescription className="text-lg font-medium">{title}</CardDescription>
        <Combine />
      </div>
      <CardTitle className="text-2xl">{value} </CardTitle>
    </CardHeader>
  </Card>
);
