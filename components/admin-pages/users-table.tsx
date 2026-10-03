import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import type { AdminUserDirectoryRow } from "@/app/_data/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type UsersTableProps = {
  users: AdminUserDirectoryRow[];
  total: number;
  page: number;
  totalPages: number;
  emailSearch: string;
};

const trustLabel: Record<string, string> = {
  NEW: "New",
  VERIFIED: "Verified",
  TRUSTED: "Trusted",
  RESTRICTED: "Restricted",
};

const trustVariant = (trustLevel: string) => {
  if (trustLevel === "TRUSTED") return "default";
  if (trustLevel === "RESTRICTED") return "destructive";
  if (trustLevel === "VERIFIED") return "secondary";

  return "outline";
};

const providerLabel: Record<string, string> = {
  credential: "Email/password",
  google: "Google",
  github: "GitHub",
};

const getSignInMethods = (user: AdminUserDirectoryRow) =>
  [...new Set(user.accounts.map((account) => account.providerId))].map((providerId) => ({
    id: providerId,
    label: providerLabel[providerId] ?? providerId,
  }));

const buildUsersHref = (page: number, emailSearch: string) => {
  const params = new URLSearchParams();

  if (emailSearch) params.set("email", emailSearch);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/admin/users?${query}` : "/admin/users";
};

const formatRegistrationDate = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

export const UsersTable = ({ users, total, page, totalPages, emailSearch }: UsersTableProps) => (
  <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{total === 1 ? "1 user" : `${total} users`}</p>
      <form action="/admin/users" className="flex w-full gap-2 sm:w-auto">
        <Input
          name="email"
          type="search"
          defaultValue={emailSearch}
          placeholder="Search by email"
          aria-label="Search users by email"
          className="sm:w-72"
        />
        <Button type="submit" variant="outline">
          <Search />
          Search
        </Button>
      </form>
    </div>

    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Trust status</TableHead>
            <TableHead>Sign-in methods</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{formatRegistrationDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={trustVariant(user.trustLevel)}>
                    {trustLabel[user.trustLevel] ?? user.trustLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getSignInMethods(user).map((method) => (
                      <Badge key={method.id} variant="secondary">
                        {method.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No users match this email search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

    {totalPages > 1 ? (
      <nav
        className="flex items-center justify-end gap-3 text-sm text-muted-foreground"
        aria-label="User directory pages"
      >
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Previous page"
            aria-disabled={page <= 1}
            className={cn(page <= 1 && "pointer-events-none opacity-50")}
          >
            <Link href={buildUsersHref(Math.max(1, page - 1), emailSearch)}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Next page"
            aria-disabled={page >= totalPages}
            className={cn(page >= totalPages && "pointer-events-none opacity-50")}
          >
            <Link href={buildUsersHref(Math.min(totalPages, page + 1), emailSearch)}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </nav>
    ) : null}
  </section>
);
