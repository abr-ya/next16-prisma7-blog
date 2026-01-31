"use client";

import { IPostLink } from "@/app/_interfaces/post.interface";
import Link from "next/link";
import { Button } from "..";
import { createLogEvent } from "@/app/_data/log";

export const LinkBlock = ({ pl, userID }: { pl: IPostLink; userID: string }) => {
  const goToHandler = async () => {
    console.log("User ID:", userID, "Link ID:", pl.linkId);
    await createLogEvent("goToLink", `User ${userID} opened link: ${pl.link.name}`);
    window.open(pl.link.url, "_blank");
  };

  return (
    <>
      <div className="flex self-center">{pl.link.name}</div>
      <Button onClick={goToHandler} className="bg-green-300 text-green-900 hover:bg-green-200">
        open link in new tab
      </Button>
      <Link href={`/blog/links/${pl.link.shortCode}`} rel="noreferrer">
        <Button variant="outline">show link details</Button>
      </Link>
    </>
  );
};
