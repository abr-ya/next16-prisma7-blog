import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";

interface PostUserAndCategoryProps {
  userName: string;
  userImage: string | null;
  createdAt: Date;
  categoryId?: string;
  categoryName?: string;
}

export const PostUserAndCategory = (props: PostUserAndCategoryProps) => (
  <div className="flex gap-6 text-sm">
    <div className="flex gap-6">
      {/* todo: Add Empty Image? */}
      {props.userImage ? (
        <div className="relative h-8 w-8 rounded-full shadow-lg">
          <Image src={props.userImage} alt={props.userName} className="rounded-full shadow-lg" fill />
        </div>
      ) : (
        <div className="relative h-8 w-8 rounded-full bg-gray-200 shadow-lg flex items-center justify-center">
          <span className="text-xs font-medium text-gray-500">{props.userName.charAt(0)}</span>
        </div>
      )}

      <div className="flex flex-col gap-1 -ml-4">
        <span className="text-sx font-medium">{props.userName}</span>
        <span className="text-xs text-neutral-500 font-medium">{format(props.createdAt, "MM/dd/yyyy")}</span>
      </div>

      {props.categoryId && props.categoryName ? (
        <Link href={`/blog/category/${props.categoryId}`} className="font-semibold">
          category: {props.categoryName}
        </Link>
      ) : null}
    </div>
  </div>
);
