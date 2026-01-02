import { Fragment } from "react/jsx-runtime";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface ICrumb {
  label: string;
  to: string | null;
}

interface IBreadcrumbs {
  data: ICrumb[];
}

export const Breadcrumbs = ({ data }: IBreadcrumbs) => (
  <Breadcrumb>
    <BreadcrumbList>
      {data.map((el) => (
        <Fragment key={el.label}>
          <BreadcrumbItem>
            {el.to ? (
              <BreadcrumbLink asChild>
                <Link href={el.to}>{el.label}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{el.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {el.to ? <BreadcrumbSeparator /> : null}
        </Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);
