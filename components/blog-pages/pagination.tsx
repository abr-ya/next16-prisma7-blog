"use client";

import { MoveLeft, MoveRight } from "lucide-react";
import { Button } from "../index";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  page: number;
  pageUrl?: string;
}

export const Pagination = ({ currentPage, totalPages, page, pageUrl }: IPaginationProps) => {
  const router = useRouter();
  console.log("Pagination", `${currentPage}/${totalPages}/${page}`);

  return (
    <div className="flex gap-6 flex-row w-full pb-14">
      <div className="w-full flex gap-6 justify-center">
        <Button
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full shadow-lg cursor-pointer opacity-100",
            currentPage === 1 && "opacity-50 pointer-events-none",
          )}
          disabled={currentPage === 1}
          onClick={() => {
            const url = pageUrl ? `${pageUrl}?page=${currentPage - 1}` : `?page=${currentPage - 1}`;
            router.push(url);
          }}
        >
          <MoveLeft />
        </Button>

        <div className="flex items-center justify-between text-sm gap-6">
          Page {page} of {totalPages}
        </div>

        <Button
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full shadow-lg cursor-pointer opacity-100",
            currentPage === totalPages && "opacity-50 pointer-events-none",
          )}
          disabled={currentPage === totalPages}
          onClick={() => {
            const url = pageUrl ? `${pageUrl}?page=${currentPage + 1}` : `?page=${currentPage + 1}`;
            router.push(url);
          }}
        >
          <MoveRight />
        </Button>
      </div>
    </div>
  );
};
