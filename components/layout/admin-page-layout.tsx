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

interface IDashbordLayout {
  bottomSlot1: ReactNode;
  bottomSlot2: ReactNode;
  children: ReactNode;
}

export const DashbordLayout = ({ children, bottomSlot1, bottomSlot2 }: IDashbordLayout) => (
  <div className="flex flex-1 flex-col">
    <div className="flex flex-wrap w-full flex-col gap-6 p-4">{children}</div>
    <div className="container flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6">{bottomSlot1}</div>
      <div className="p-4">{bottomSlot2}</div>
    </div>
  </div>
);
