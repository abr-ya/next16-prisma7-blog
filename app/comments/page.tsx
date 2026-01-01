import { CommentForm, PageLayout } from "@/components/index";

const CommentsPage = () => {
  const comments = []; // Placeholder for comments data

  return (
    <PageLayout title="Comments">
      <p className="text-muted-foreground mb-8">Sign in with GitHub to leave a comment or message.</p>

      {/* AuthButton */}
      <div className="mb-8">todo: AuthButton</div>

      {/* CommentForm */}
      <CommentForm />

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">All Comments ({comments.length})</h2>
        {/* CommentsList */}
      </div>
    </PageLayout>
  );
};

export default CommentsPage;
