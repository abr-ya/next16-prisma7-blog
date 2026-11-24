# Design

## Data Model

```prisma
enum TrackSourceAliasKind {
  APP
  DEVICE
}

model TrackSourceAlias {
  id        String                @id @default(uuid())
  userId    String
  user      User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind      TrackSourceAliasKind
  rawValue  String
  rawKey    String
  label     String
  createdAt DateTime              @default(now())
  updatedAt DateTime              @default(now()) @updatedAt

  @@unique([userId, kind, rawKey])
  @@index([userId])
}
```

`User` gains `sourceAliases TrackSourceAlias[]`.

- `rawValue` keeps the source string as recorded (trimmed, original casing) for display and for the future resolution lookup.
- `rawKey` is the normalized lookup key: lowercase, trimmed, internal whitespace collapsed. The unique key uses it, so `Garmin Connect` and `garmin  connect` cannot create two aliases for the same owner and kind.
- `label` is the owner's display name, capped at 60 characters; `rawValue` is capped at 120.
- Both limits and the normalization rule are written into the type comments so the next slice's write path has one source of truth. This slice does not add a normalizer yet because nothing writes rows; the schema documents the contract.

The migration is additive: one enum, one table, one relation, one index, one unique constraint. No existing row changes and no backfill.

## Read

`getOwnerSourceAliases()` in `app/_data/track-source-aliases.ts`:

- `requireAuth` is handled by the page; the helper itself uses the session user id and returns only that user's rows;
- selected fields: `id`, `kind`, `rawValue`, `label`, `createdAt`;
- order by `kind`, then `rawValue`, so the page groups App before Device;
- no write helpers are added.

## Page

`/my/source-aliases` follows the owner-page pattern:

- `dynamic = "force-dynamic"`, `PageLayout` with `contentWidth="wide"`, `buildPageMetadata`, `requireAuth`;
- a short explanation that a source name replaces the raw GPX creator or device wherever the track shows its source;
- the owner's aliases in two groups, **Apps** and **Devices**, each row showing the raw value and the display label;
- an empty state when nothing is stored, explaining that names will be added in the next update;
- no buttons, forms, or mutation controls in this slice.

A user-menu entry labelled **Source names** sits after **My gear** with a `Fingerprint` icon. The navigation and workspace locale files gain the key.

## Risks

- **A page with no editing yet.** Deliberate split: the owner can see the surface and the empty state, while the next slice adds creation, editing, and the inline rename.
- **Case-insensitive uniqueness.** Prisma's unique constraint is case-sensitive; the normalized `rawKey` is what makes `Garmin Connect` and `garmin connect` collide as intended. The write path must always fill it.
- **Locale drift.** The page title and menu label go into the existing navigation/workspace locales in English and Russian, matching the owner menu.
- **Migration on Neon.** The table is additive; apply it with the project's pooler workaround (`prisma db execute` plus `migrate resolve`) if the direct endpoint is unavailable, then confirm an empty `migrate diff`.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx prisma validate`, `npx prisma generate`, `openspec validate --changes --strict`, and a production build. The page is checked with an existing signed-in owner: it requires auth, shows the empty state, and lists rows only for that owner. No alias rows are created in this slice.
