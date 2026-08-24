import { ReactNode } from "react";

import { PublicNavbarShell } from "@/components/layout/public-navbar-shell";

const SiteTopNavLayout = ({ children }: { children: ReactNode }) => <PublicNavbarShell>{children}</PublicNavbarShell>;

export default SiteTopNavLayout;
