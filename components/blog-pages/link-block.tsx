"use client";

import { IPostLink } from "@/app/_interfaces/post.interface";
import Link from "next/link";
import { Button } from "..";

export const LinkBlock = ({ pl, userID }: { pl: IPostLink; userID: string }) => {
  const goToHandler = () => {
    console.log("User ID:", userID);
    console.log("Link ID:", pl.linkId);
    window.open(pl.link.url, "_blank");
  };

  return (
    <>
      <div className="flex self-center">{pl.link.name}</div>
      <Link href={`/blog/links/${pl.link.shortCode}`} rel="noreferrer">
        <Button variant="outline">show link details</Button>
      </Link>
      <Button variant="outline" onClick={goToHandler}>
        open link in new tab
      </Button>
    </>
  );
};
