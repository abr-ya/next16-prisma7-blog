# Blog | Next 16

A personal content hub for publishing articles, notes, videos, and outdoor activity records.

## Site sections

- **Home** — an introduction and a selection of recent documents.
- **Blog** — published posts, categories, and short links.
- **Docs** — Markdown-based technical notes and documentation, including GitHub-flavored Markdown and Mermaid diagrams.
- **Videos** — a video library with channels, tags, comments, and bookmarks.
- **Trips and hikes** — trip journals, hike details, maps, media, and community photo contributions.
- **Tracks** — route and track pages, including a personal collection for signed-in users.
- **Comments and profile** — a shared comment feed and account profile pages.
- **Admin** — authenticated content management for posts, documents, videos, media, trips, hikes, tracks, users, and related metadata.

The public interface is available in English and Russian.

## Featured sections

### Blog

The Blog is the primary space for publishing long-form articles and personal posts. Readers can browse the post archive, open individual articles, and navigate content through categories. Posts may include rich text and links to related resources. Short links provide a convenient way to share or reference content.

### Videos

Videos brings together published video content in one browsable library. Content can be organized by channels and tags to help visitors discover related videos. Individual video pages support discussion through comments, while signed-in users can save videos as bookmarks. The section is backed by an admin workflow for managing videos and their metadata.

### Trips

Trips documents outdoor journeys as detailed, shareable entries. Each trip can bring together its description, associated hikes, route tracks, photos, and other media. Visitors can explore an overview of all trips or open a specific trip to follow its itinerary and related materials. Authenticated users can also manage trip invitations, while administrators maintain trip content from the dashboard.

## Main stack

- **Next.js 16** with the App Router, **React 19**, and **TypeScript**
- **Prisma 7** and **PostgreSQL** for data access and storage
- **better-auth** for authentication
- **Tailwind CSS 4**, Radix UI primitives, and local shadcn-style components for the UI
- **Tiptap** for rich-text editing and **UploadThing** for media uploads
- **React Markdown**, remark-gfm, and Mermaid for documentation rendering

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Useful checks:

```bash
npm run tsc
npm run lint
```
