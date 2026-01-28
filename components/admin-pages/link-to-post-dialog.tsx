"use client";

import { toast } from "sonner";
import { useLinkToPostDialog } from "@/hooks/index";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, SimpleSelect } from "..";
import { useRouter } from "next/navigation";
import { Link, Post } from "@/generated/prisma/client";
import { connectLinkToPost } from "@/app/_data/posts";

interface ILinkToPostDialogProps {
  links: Link[];
  posts: Post[];
}

export const LinkToPostDialog = ({ posts, links }: ILinkToPostDialogProps) => {
  const router = useRouter();
  const { linkID, open, setOpen, setLinkID, postID, setPostID, isConnecting, setIsConnecting } = useLinkToPostDialog();

  const onConnect = async () => {
    if (!linkID || !postID) return;

    try {
      setIsConnecting(true);
      await connectLinkToPost(postID, linkID);
      toast.success("Link connected to post successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect link to post");
    } finally {
      setIsConnecting(false);
    }

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

          <h3>Select a post to connect:</h3>
          <SimpleSelect
            options={posts.map((post) => ({ value: post.id, label: post.title }))}
            onSelect={setPostID}
            value={postID || ""}
          />

          <h3>Select a link to connect:</h3>
          <SimpleSelect
            options={links.map((link) => ({ value: link.id, label: link.name }))}
            onSelect={setLinkID}
            value={linkID || ""}
          />

          <Button className="cursor-pointer" disabled={!linkID || !postID || isConnecting} onClick={onConnect}>
            Connect
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
