import { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <main className="flex items-center justify-center w-full h-dvh">{children}</main>
);

export default AuthLayout;
