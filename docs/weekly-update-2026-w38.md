# Weekly Update — Week 38, 2026 (Sep 14 → Sep 20)

A chronological digest of user-facing features shipped into `master` this
week, plus the unmerged outdoor-photo-comments branch that closed its
implementation on Sunday. Each entry lists the shipped capability and the
direct value for visitors of the public site or the personal workspace.

## Monday, Sep 14

- **feature-078 — Outdoor trip photo lightbox polish.** Each gallery photo
  in the trip lightbox now shows a position counter (e.g. `3 / 12`) and a
  stable semi-transparent authorized-details panel so the title and
  description stay legible over any image. Visitors no longer lose context
  when navigating a long trip gallery.

## Wednesday, Sep 16

- **feature-079 — Trip list viewer status.** On `/trips`, each published
  trip card now tells the signed-in viewer whether the trip is theirs,
  one where they are an accepted participant, or another public trip —
  no more guessing which trips they can act on.

## Thursday, Sep 17

- **feature-080 — Outdoor photo likes.** Signed-in viewers can privately
  like photos on a published trip from the lightbox; likes are personal
  (no public counts) and dedupe automatically. It is the first step toward
  the trust-tier auto-promotion rule for accounts that collect likes.

## Friday, Sep 18

- **feature-081 — Trip photo details map focus.** Pressing `Show on map`
  on a photo's details now closes the lightbox, reveals the trip map, and
  zooms to the photo's accepted coordinate. Visitors jump straight to the
  place the picture was taken instead of scrolling a long map.
- **feature-082 — Photo track-time map preview.** Inside the coordinate
  review dialog, owners and admins can preview a photo on a protected map
  to see which section of the linked track it best fits, with a temporary
  capture-time offset from -3 to +3 hours before they commit. Coordinate
  approval becomes a single-screen decision instead of trial-and-error.

## Saturday, Sep 19

- **feature-083 — Photo capture timezone normalization.** Photos with
  timezone-less EXIF capture time are now treated as camera-local
  evidence; matching only happens against track or owner-confirmed IANA
  zones. The map's "photo taken around…" hint stops misleading visitors
  near timezone boundaries.
- **feature-084 — Outdoor trip map-photo lightbox.** Tapping a photo
  marker on a public trip map now opens the same full-screen lightbox as
  the gallery, including a selectable list when several photos share
  coordinates. Guests pressing a marker see a clear sign-in prompt
  instead of broken image fragments.
- **Admin post save fixes.** The post editor now propagates rich-text
  edits to form validation, so the **Save changes** button enables the
  moment the form is dirty and valid. Less fighting with a stuck-grey
  save button for post authors.

## Sunday, Sep 20

- **feature-073 — Workspace access policy.** A new personal
  `/admin` workspace sidebar splits "Personal workspace" from
  "Administrator controls", `/admin/md-docs`, `/admin/video-channels`,
  cross-user `/admin/photos`, `/admin/files`, `/admin/content-tags`, and
  `/admin/database` now require an `admin` role at the route boundary,
  and post/trip/track/photo mutations are owner-scoped with an admin
  override. Visitors and ordinary users see a workspace that matches
  what they can actually do, and administrators keep every override.
- **feature-085 — Shared comment UI foundation.** The reusable
  comment-list and comment-composer components are extracted into
  `components/comments/` so the public video detail surface and any
  future comment target share one well-tested piece of UI.
- **fix-002 — Camera-local capture time preservation.** Photos with
  timezone-less EXIF capture timestamps now keep their original
  camera-local reading instead of being coerced; matching still derives
  authoritative instants from track or owner-confirmed zones.

## Branch state (unmerged as of 2026-09-20)

- **feature-086 — Outdoor photo comments** (branch
  `feature-086-outdoor-photo-comments`). Implementation and OpenSpec
  archive completed on Sunday; PR still pending. When merged, signed-in
  viewers on a published trip can post, edit, and delete their own
  comments on any linked photo through a `Comments` overlay inside the
  existing lightbox, with the same owner-scoped boundary used for video
  comments.
