// UI Components
export { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
export { Badge } from "./ui/badge";
export { Button } from "./ui/button";
export { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
export { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
export { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
export { Input } from "./ui/input";
export { Label } from "./ui/label";
export * from "./ui/navigation-menu";
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
export { Separator } from "./ui/separator";
export { Sidebar, SidebarProvider } from "./ui/sidebar";
export { Spinner } from "./ui/spinner";
export { Textarea } from "./ui/textarea";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// Common Components
export { DataTable } from "./common/data-table";
export { RichTextEditor } from "./common/rich-text-editor";
export { RichTextViewer } from "./common/rich-text-viewer";
export { SimpleSelect } from "./common/simple-select";

// Admin Pages Components
export { AdminSidebar } from "./admin-pages/admin-sidebar";
export { CategoriesTable } from "./admin-pages/categories-table";
export { CategoryForm } from "./admin-pages/category-form";
export { DashboardStats } from "./admin-pages/dashboard-stats";
export { DashboardCategories } from "./admin-pages/dashboard-categories";
export { DashboardChart } from "./admin-pages/dashboard-chart";
export { LinkForm } from "./admin-pages/link-form";
export { LinkToPostDialog } from "./admin-pages/link-to-post-dialog";
export { PostForm } from "./admin-pages/post-form";
export { PostsTable } from "./admin-pages/posts-table";
export type { PostFormValues } from "./admin-pages/post-form";
export { VideoForm } from "./admin-pages/video-form";
export type { VideoFormValues } from "./admin-pages/video-form";
export { VideoChannelCreateDialog } from "./admin-pages/video-channel-create-dialog";
export { VideoChannelEditDialog } from "./admin-pages/video-channel-edit-dialog";
export { VideoChannelsTable } from "./admin-pages/video-channels-table";
export { VideosTable } from "./admin-pages/videos-table";
export { MdDocsTable } from "./admin-pages/md-docs-table";
export { MdDocForm } from "./admin-pages/md-doc-form";
export type { MdDocFormValues } from "./admin-pages/md-doc-form";
export { ImageUploader } from "./admin-pages/image-uploader";

// Home Page Components
export { AboutSection } from "./home-page/about-section";
export { HeroSection } from "./home-page/hero-section";
// Do not barrel-export RecentDocuments / DB-backed home segments: any client
// import from this file would pull Prisma/pg into the browser bundle.

// Blog Components
export { About } from "./blog-pages/about";
export { LinkBlock } from "./blog-pages/link-block";
export { Navbar } from "./blog-pages/navbar";
export { Pagination } from "./blog-pages/pagination";
export { PostCard } from "./blog-pages/post-card";
export { PostUserAndCategory } from "./blog-pages/post-user-and-category";

// Docs Components
export { DocsList } from "./docs/docs-list";
export { PostArticle } from "./docs/post-article";

// Comments Components
// export { CommentsSection } from "./comments-page/comments-section";
// export { Comment } from "./comments-page/comment";
export { CommentForm } from "./comments-page/comment-form";

// Layout Components
export { AdminPageLayout, DashbordLayout } from "./layout/admin-page-layout";
export { Breadcrumbs } from "./layout/breadcrumbs";
export { PageLayout } from "./layout/page-layout";

// Auth Forms
export { SignInForm } from "./auth-forms/sign-in-form";
export { SignUpForm } from "./auth-forms/sign-up-form";
