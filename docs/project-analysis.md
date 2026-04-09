# Project Analysis: next16-prisma7-blog

## 📋 Application Type

This is a **blogging platform** with a fully-functional administrative dashboard, including:
- Public blog with post cards and detailed post pages
- Admin panel (dashboard) for content management
- Authentication system (email/password + OAuth Google/GitHub)
- Rich-text editor (TipTap) for content creation
- Image uploads via UploadThing
- Action logging system

---

## 🛠 Key Technologies

| Category | Technology |
|-----------|------------|
| **Framework** | Next.js 16.1.1 (App Router) |
| **React** | 19.2.3 |
| **ORM** | Prisma 7.2.0 + `@prisma/adapter-pg` |
| **Database** | PostgreSQL |
| **Authentication** | Better Auth 1.4.9 (email + Google OAuth + GitHub OAuth) |
| **UI** | shadcn/ui (style "new-york") + Radix UI |
| **Styling** | Tailwind CSS 4 |
| **Rich-text Editor** | TipTap 3.16+ |
| **File Upload** | UploadThing 7.7.4 |
| **State Management** | Zustand 5.0.10 |
| **Forms** | React Hook Form + Zod 4.3.4 |

---

## 📁 Project Architecture

```
app/
├── _data/            # Server actions (CRUD operations)
├── _interfaces/      # TypeScript interfaces
├── (admin)/          # Admin panel (dashboard, posts, categories, links)
├── (auth)/           # Authentication (sign-in, sign-up)
├── api/              # API routes (auth, uploadthing)
├── blog/             # Public blog
├── blog-md/          # Markdown-based blog
└── comments/         # Comments page (in development)

components/
├── ui/               # 22 shadcn/ui components
├── admin-pages/      # Admin panel components
├── auth-forms/       # Sign-in/Sign-up forms
├── blog-pages/       # Blog components (Navbar, PostCard, etc.)
├── common/           # DataTable, RichTextEditor, RichTextViewer
└── layout/           # Layout components

hooks/                # Zustand stores for dialogs
lib/                  # Utilities (auth, prisma, slug-generator, uploadthing)
prisma/               # DB schema (10 models), seed, migrations
```

---

## 🗄 Database Schema (10 Models)

**Authentication:** `User`, `Session`, `Account`, `Verification`

**Business Models:**
- `BlogPost` — simple markdown posts
- `Post` — main posts with rich-text (title, slug, content, views, tags, status)
- `PostImage` — post images
- `Category` — categories
- `Link` — external links with shortCode
- `LinksToPosts` — many-to-many relation Link ↔ Post
- `Comment` — comments
- `Log` — action log

---

## ✨ Notable Patterns

1. **Server Actions** — all CRUD operations implemented as `"use server"` functions with lazy Prisma imports
2. **Route Groups** — `(admin)` and `(auth)` for layout separation
3. **Prisma Singleton** — singleton pattern with `globalThis` for dev mode
4. **Zustand for Dialogs** — dialog state management
5. **TipTap Editor** — custom WYSIWYG with Image and Link extensions
6. **Cyrillic Slug Generator** — transliteration from Cyrillic to Latin for URL-friendly slugs
7. **Action Logging** — all key actions are logged
8. **Barrel Exports** — all components exported via `components/index.ts`

---

## 🔍 Development Status

**Completed:**
- ✅ Authentication (email + OAuth)
- ✅ Admin panel (posts, categories, links)
- ✅ Public blog
- ✅ Rich-text editor
- ✅ Image uploads

**In Progress:**
- 🚧 Comments page (form exists, functionality not complete)

---

## 📊 Key Features

### Public Facing
- **Home Page**: Hero section, "About" section, latest markdown posts
- **Blog** (`/blog`): All posts with cards (author, category, image, date)
- **Post Detail** (`/blog/[slug]`): Full article with rich-text content, view counter, related links (for authenticated users)
- **Blog-MD** (`/blog-md`): Simple markdown posts from BlogPost table
- **Comments** (`/comments`): Placeholder, functionality in development

### Admin Panel (`/dashboard`)
- **Dashboard**: Statistics, charts, categories
- **Posts** (`/posts`): Post table with CRUD, rich-text TipTap editor, image uploads, category/tag selection, status (published/draft)
- **Categories** (`/categories`): Category management
- **Links** (`/links`): External links management with short codes
- **Saved Posts**: Placeholder

---

## 🔄 Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run fix` | ESLint --fix |
| `npm run tsc` | Type check (tsc --noEmit) |
| `npm run postinstall` | Auto `prisma generate` after dependency install |

---

*Generated on April 8, 2026*
