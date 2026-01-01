import { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-center w-full h-dvh">{children}</div>
);

export default AuthLayout;
