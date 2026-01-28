"use client";

import { toast } from "sonner";
import { useLinkToPostDialog } from "@/hooks/index";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, SimpleSelect } from "..";
import { useRouter } from "next/navigation";
import { Post } from "@/generated/prisma/client";

interface ILinkToPostDialogProps {
  posts: Post[];
}

export const LinkToPostDialog = ({ posts }: ILinkToPostDialogProps) => {
  const router = useRouter();
  const { linkID, open, setOpen, setLinkID, postID, setPostID } = useLinkToPostDialog();

  const onConnect = async () => {
    console.log("connect:", { linkID, postID });
    toast.success("Link connected to post successfully");

    router.refresh();
    setLinkID(null);
    setPostID(null);
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)} variant="outline">
        Connect link
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-100" aria-describedby="link" aria-description="create link">
          <DialogHeader>
            <DialogTitle>Connect link to post</DialogTitle>
          </DialogHeader>

          <SimpleSelect
            options={posts.map((post) => ({ value: post.id, label: post.title }))}
            onSelect={setPostID}
            value={postID || ""}
          />

          <Button className="cursor-pointer" disabled={!linkID || !postID} onClick={onConnect}>
            Connect
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
