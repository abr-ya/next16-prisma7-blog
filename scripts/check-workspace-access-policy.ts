import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const assertBefore = (content: string, guard: string, protectedRead: string, label: string) => {
  assert.ok(content.indexOf(guard) >= 0, `${label} must contain ${guard}`);
  assert.ok(content.indexOf(protectedRead) >= 0, `${label} must contain ${protectedRead}`);
  assert.ok(
    content.indexOf(guard) < content.indexOf(protectedRead),
    `${label} must authorize before its protected read`,
  );
};

const sidebar = source("components/admin-pages/admin-sidebar.tsx");
assert.match(sidebar, /Personal workspace/);
assert.match(sidebar, /Administrator controls/);
assert.match(sidebar, /\{isAdmin \? \(/);

assertBefore(source("app/admin/md-docs/page.tsx"), "await requireAdmin();", "getAllMdDocs()", "MD docs list route");
assertBefore(
  source("app/admin/md-docs/[id]/page.tsx"),
  "await requireAdmin();",
  "getMdDocById(id)",
  "MD doc detail route",
);
assertBefore(
  source("app/admin/video-channels/page.tsx"),
  "await requireAdmin();",
  "getAllVideoChannels()",
  "Video channels route",
);

const tripsPage = source("app/admin/hikes/page.tsx");
assert.match(tripsPage, /const photos = isAdmin \? await getHikePhotoOptions\(\) : \[\];/);

const tripsPanel = source("components/admin-pages/hikes-admin-panel.tsx");
assert.match(tripsPanel, /\{isAdmin \? \(/);

const posts = source("app/_data/posts.ts");
assert.match(posts, /await requireOwnerOrAdmin\(existingPost\.userId\);/);

const tracks = source("app/_data/tracks.ts");
assert.match(tracks, /where: \{ id, userId \}/);

const hikes = source("app/_data/hikes.ts");
assert.match(hikes, /where: \{ userId \}/);
assert.match(hikes, /isAcceptedHikeParticipant\(\{ hikeId, userId: session\.user\.id \}\)/);

const photos = source("app/_data/photos.ts");
assert.match(photos, /const session = await requireAdmin\(\);/);

console.log("Workspace access-policy checks passed.");
