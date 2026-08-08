import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { format } from "date-fns";

interface PostUserAndLinkProps {
  name: string;
  avatar: string | null;
  created: Date;
  slug: string;
}

export const PostUserAndLink = ({ name, avatar, created, slug }: PostUserAndLinkProps) => {
  const createdLabel = format(created, "dd/MM/yyyy");
  const initials = name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex justify-between w-full gap-2">
      <div className="flex gap-1">
        <div className="relative h-8 w-8 rounded-full shadow-lg overflow-hidden">
          {avatar ? (
            <Image className="rounded-full shadow-lg" src={avatar} alt={name} fill sizes="32px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-semibold">
              {initials}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold">{name}</span>
          <span className="text-[10px] text-neutral-500 font-semibold">{createdLabel}</span>
        </div>
      </div>

      <Link href={`/blog/${slug}`} className="flex gap-1 text-sx items-center font-medium">
        Read more <MoveRight />
      </Link>
    </div>
  );
};
