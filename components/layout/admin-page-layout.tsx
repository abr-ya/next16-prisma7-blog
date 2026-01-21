import { ReactNode } from "react";
import { Breadcrumbs } from "..";

interface IAdminPageLayoutProps {
  breadcrumbs: { label: string; to: string | null }[];
  children: ReactNode;
  headerRight?: ReactNode;
}

export const AdminPageLayout = ({ children, headerRight, breadcrumbs }: IAdminPageLayoutProps) => (
  <>
    <div className="flex flex-col p-4">
      <div className="flex w-full justify-between">
        <Breadcrumbs data={breadcrumbs} />
        {headerRight && <>{headerRight}</>}
      </div>
    </div>
    {children}
  </>
);
